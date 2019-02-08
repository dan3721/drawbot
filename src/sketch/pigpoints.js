const filename = process.argv[2]
if (!filename) {
  console.error(
    'ERROR: Must provide a points input file as the first argument!')
  process.exit(-1)
}

const drawbot = require('../drawbot')
const readline = require('readline')
const fs = require('fs')
const Handlebars = require('handlebars')
const DATEFORMAT = require('dateformat')
const startDate = DATEFORMAT(new Date(), 'dddd, mmmm dS, yyyy, h:MM:ss TT')

// sketch.html is 500px x 500px
const SKETCH_FRAME_WIDTH = 500, SKETCH_FRAME_HEIGHT = 500
const PLOT_WIDTH = 7.2, PLOT_HEIGHT = 7.2

const p4 = n => ('' + n).padEnd(5, ' ')
const p6 = n => ('' + n).padEnd(7, ' ')

// read in points from
fs.readFile(`./${filename}`, function (err, data) {
  if (err) {
    throw err
  }

  const content = data.toString()
  const points = content

  const originalPoints = points.split(',').map(val => +(val))

  // switch 0,0 from top left to bottom left
  let pointsXYFliped = originalPoints.map(
    (val, idx) => idx % 2 === 0
      ? SKETCH_FRAME_WIDTH - val
      : SKETCH_FRAME_HEIGHT - val)
  pointsXYFliped = pointsXYFliped.map(
    (val, idx) => idx % 2 !== 0 ? val : 255 - (val - 255))

  // let maxX = points.reduce(
  //   (accumulator, val, idx) => idx % 2 === 0 && val > accumulator
  //     ? val
  //     : accumulator)
  // let maxY = points.reduce(
  //   (accumulator, val, idx) => idx % 2 !== 0 && val > accumulator
  //     ? val
  //     : accumulator)
  // console.log(maxX, maxY)

  // scale from frame to plot
  const SCALE_WIDTH = PLOT_WIDTH / SKETCH_FRAME_WIDTH
  const SCALE_HEIGHT = PLOT_HEIGHT / SKETCH_FRAME_HEIGHT
  const pointsScaled = pointsXYFliped.map(
    (val, idx) => idx % 2 === 0 ? val * SCALE_WIDTH : val * SCALE_HEIGHT)

  // shift up away from the x axis (away from the servos) into the drawable area
  const pointsShifted = pointsScaled.map(
    (val, idx) => idx % 2 !== 0 ? val + 1 : val + 2) // x,y

  const pointsFinal = pointsShifted

  let startAngles = drawbot.calcServoAngles(pointsFinal[0], pointsFinal[1])
  // stream.write(`pigs s 10 ${drawbot.getPulseWidth(
  //   startAngles[0])} s 9 ${drawbot.getPulseWidth(
  //   startAngles[1])} mils 10000 # move to first position and wait 10s so user can set paper and then run...`)

  const cmds = []
  for (let i = 0; i < pointsFinal.length; i += 2) {
    let x = pointsFinal[i]
    let y = pointsFinal[i + 1]
    let angles = drawbot.calcServoAngles(x, y)
    let angleA = angles[0]
    let angleB = angles[1]
    let pwA = drawbot.getPulseWidth(angleA)
    let pwB = drawbot.getPulseWidth(angleB)
    let cmd = `pigs s 10 ${pwA} s 9 ${pwB} mils $MILS`
    cmd = cmd.padEnd(36, ' ')
    let line = `${cmd} # ${p4(
      drawbot.r2(x))} ${p4(drawbot.r2(y))} ${p6(
      angleA)} ${p6(angleB)}`
    cmds.push(line)
  }

  const CTX = {
    startDate,
    originalPoints,
    pointsXYFliped,
    pointsScaled,
    pointsShifted,
    pointsFinal,
    cmds,
  }

  fs.readFile('./templates/pigpoints.sh', function (err, data) {
    if (err) {
      throw err
    }
    const template = Handlebars.compile(data.toString())
    const script = template(CTX)
    const scriptFilename = filename.replace('.points', '.sh')
    const stream = fs.createWriteStream(scriptFilename)
    stream.write(script)
    stream.end()
    console.log(scriptFilename)
  })

  fs.readFile('./templates/pigpoints.html', function (err, data) {
    if (err) {
      throw err
    }
    const template = Handlebars.compile(data.toString())
    const html = template(CTX)
    const validationFilename = filename.replace('.points', '.html')
    const stream = fs.createWriteStream(validationFilename)
    stream.write(html)
    stream.end()
    console.log(validationFilename)
  })

})