const FS = require('fs')
const PATH = require('path')

const ARM_1_LENGTH = 4          // length of arm 1
const ARM_2_LENGTH = 5          // length of arm 2
const CENTER = 5                // center point
const PIVIOT_DIST_FROM_CENT = 1 // distance from servo axel from CENTER
const START_X = 5
const START_Y = 1

// current position
let _x = START_X
let _y = START_Y

// point stack
const POINTS = [[_x, _y]]

const radians2Degrees = (r) => {
  return r * 180 / Math.PI
}

/**
 * Given a point returns the corresponding positions in degrees for both
 * servos. Note we are leveraging {@link calcServoPosition} for both the A and B
 * servos by flipping the SAME flag!
 */
const calcServoPositions = (x, y) => {
  const SAME = x < CENTER
  return SAME ?
    [
      (180 - calcServoPosition(x, y, SAME)).toFixed(2),
      calcServoPosition(x, y, !SAME)] : // A
    [
      (180 - calcServoPosition(x, y, !SAME)).toFixed(2),
      calcServoPosition(x, y, SAME)]   // B
}

/**
 * Given a point returns the corresponding position in degrees for a servo. The
 * same parameter indicates whether or not we are dealing with a servo that is
 * in the same quadrant as the x coordinate. This is because we do some things
 * just a bit differently depending so that we can make use of the same
 * approach.
 */
const calcServoPosition = (x, y, same) => {

  const OFFSET = same ?
    CENTER - PIVIOT_DIST_FROM_CENT : // offset is left of center
    CENTER + PIVIOT_DIST_FROM_CENT // offset is right of center

  const OPPOSITE = OFFSET - x
  const ADJACENT = y

  // step 1: solve hypotenuse
  const HYPOTENUSE = Math.sqrt(Math.pow(OPPOSITE, 2) + Math.pow(ADJACENT, 2))

  // step 2: solve angle 1
  const ANGLE1 = radians2Degrees(Math.atan(OPPOSITE / ADJACENT))

  // step 3: solve angle 2
  const A = HYPOTENUSE
  const B = ARM_1_LENGTH
  const C = ARM_2_LENGTH
  const ANGLE2 = radians2Degrees(
    Math.acos((Math.pow(A, 2) + Math.pow(B, 2) - Math.pow(C, 2)) / (2 * A * B)))

  // step 4: add angles
  const ANGLE = (same ? ANGLE1 + ANGLE2 : ANGLE2 - ANGLE1).toFixed(2)

  return ANGLE
}

/**
 * Smart padding for values fixed to 2. If the value ends with two digits the
 * padding is added to the beginning else it's added to the end. This nicely
 * pads values like 96.78 and 158.7 so they are left aligned.
 */
const padDeg = (val) => {
  val += ''
  return val.match(/^\.\d\d$/) ? val.padStart(6, ' ') : val.padEnd(6, ' ')
}

const fmtPoint = (x, y) => (`${x},${y}`).padEnd(8, ' ')

const move = (x, y) => {
  const START = calcServoPositions(_x, _y)
  const END = calcServoPositions(x, y)
  const DELTA_X = Math.abs(START[0] - END[0]).toFixed(2)
  const DELTA_Y = Math.abs(START[1] - END[1]).toFixed(2)
  console.log(
    `${fmtPoint(_x, _y)} -> ${fmtPoint(x, y)}\tA:[${padDeg(
      START[0])}° -> ${padDeg(
      START[1])}°] B:[${padDeg(END[0])}° -> ${padDeg(END[1])}°]\tΔx°:${padDeg(
      DELTA_X)} Δy°:${padDeg(DELTA_Y)}${DELTA_X === DELTA_Y ? '' : ' *'}`)

  // signal servos

  // wait

  // update location
  _x = x
  _y = y
  POINTS.push([_x, _y])
}

/**
 * Multiple moves.
 */
const mmove = points => {
  for (let i = 0; i < points.length; i += 2) {
    move(points[i], points[i + 1])
  }
}

const drawLine = (x1, y1, x2, y2) => {
  move(x, y)
  move(x2, y2)
}

const SCALE = 50

/**
 * Dumps {@link POINTS} as an SVG HTML file and opens it in a browser unless
 * the open param is false.
 */
const dumpSVG = (open = true) => {

  const MAX_X = POINTS.reduce(
    (accumulator, currentValue) => currentValue > accumulator
      ? currentValue[0]
      : accumulator)
  const MAX_Y = POINTS.reduce(
    (accumulator, currentValue) => currentValue > accumulator
      ? currentValue[1]
      : accumulator)

  // filename based on drawing js
  let filename = module.parent.filename
  filename = filename.replace('.js', '.html')

  const SVG = FS.createWriteStream(filename)

  SVG.write(`<html>`)
  SVG.write(`<head><title>${PATH.parse(filename).name}</title></head>`)
  SVG.write(`<body>`)
  SVG.write(
    `<svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">`)
  SVG.write(`<g transform="translate(0,500)">`)

  // x axis
  SVG.write(`<line x1="0" y1="0" x2="${10 *
  SCALE}" y2="0" style="stroke:red;stroke-width:1" />`)

  // y axis
  SVG.write(
    `<line x1="${CENTER * SCALE}" y1="0" x2="${CENTER * SCALE}" y2="${-10 *
    SCALE}" style="stroke:green;stroke-width:1" />`)

  // servo A
  SVG.write(`<circle cx="${4 *
  SCALE}" cy="0" r="10" stroke="black" stroke-width="2" fill="cyan" />`)
  SVG.write(`<text x="${4 *
  SCALE}" y="5" text-anchor="middle" stroke="black" stroke-width="1px">A</text>`)

  // servo B
  SVG.write(`<circle cx="${6 *
  SCALE}" cy="0" r="10" stroke="black" stroke-width="2" fill="yellow" />`)
  SVG.write(`<text x="${6 *
  SCALE}" y="5" text-anchor="middle" stroke="black" stroke-width="1px">B</text>`)

  // path
  SVG.write('<polyline points="')
  POINTS.forEach(point => {
    SVG.write(`${point[0] * SCALE},${-point[1] * SCALE} `)
  })
  SVG.write('" style="fill:none;stroke:black;stroke-width:1" />')

  // points and labels
  POINTS.forEach((point, index) => {
    // point
    SVG.write(`<circle cx="${point[0] * SCALE}" cy="${-point[1] *
    SCALE}" r="2" stroke="blue" stroke-width="2" fill="blue" />`)
    // label
    SVG.write(`<text x="${point[0] * SCALE + 3}" y="${-point[1] *
    SCALE -
    8}" fill="blue" style="font-size:85%">${index} (${point[0]},${point[1]})</text>`)
  })

  SVG.write('</g>')
  SVG.write('</svg>')
  SVG.write(`</body>`)
  SVG.write(`</html>`)

  SVG.end()

  console.log(`${filename}`)

  if (open) {
    const opn = require('opn')
    opn(filename, {wait: false})
  }

}

// public API
module.exports = {

  // calculations
  calcServoPosition,
  calcServoPositions,
  // cmds

  move,
  mmove,
  drawLine,

  // utility
  dumpSVG,
}


