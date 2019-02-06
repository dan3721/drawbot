const drawbot = require('../drawbot')
const readline = require('readline')

// sketch.html is 500px x 500px
const SKETCH_FRAME_WIDTH = 500, SKETCH_FRAME_HEIGHT = 500
const PLOT_WIDTH = 7.5, PLOT_HEIGHT = 7.5

// read in points from stdin
const RL = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
})
RL.on('line', function (line) {

  let points = line.split(',').map(val => +(val))

  // switch 0,0 fro top left to bottom left
  points = points.map(
    (val, idx) => drawbot.r2(idx % 2 === 0 ? val : SKETCH_FRAME_HEIGHT - val))
  // console.log(points)

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
  points = points.map((val, idx) => drawbot.r2(
    idx % 2 === 0 ? val * SCALE_WIDTH : val * SCALE_HEIGHT))
  // console.log(points)

  // shift up 2 away from the x axis (away from the servos into the drawable area)
  points = points.map(
    (val, idx) => drawbot.r2(idx % 2 === 0 ? val + 2 : val))

  // write pigs cmds script
  console.log('#!/bin/sh')

  // move to first position and wait 10s so user can set paper and then run...
  let startAngles = drawbot.calcServoAngles(points[0], points[1])
  console.log(`pigs s 10 ${drawbot.getPulseWidth(
    startAngles[0])} s 9 ${drawbot.getPulseWidth(startAngles[1])} mils 10000`)

  const mils = 100
  for (let i = 0; i <= points.length / 2; i += 2) {
    // console.log(`${points[i]} ${points[i+1]}`)
    let angles = drawbot.calcServoAngles(points[i], points[i + 1])
    let pwA = drawbot.getPulseWidth(angles[0])
    let pwB = drawbot.getPulseWidth(angles[1])

    console.log(`pigs s 10 ${pwA} s 9 ${pwB} mils ${mils}`)
  }

  // all quiet
  console.log('pigs s 10 0 s 9 0')

})