/**
 * Draw a circle with a number of consecutive points.
 */

const drawbot = require('../drawbot')

const NUM_POINTS = 512
const RADIUS = 2.5
const MILIS = 0

let coordinates = []

// https://stackoverflow.com/questions/5300938/calculating-the-position-of-points-in-a-circle
let slice = 2 * Math.PI / NUM_POINTS
for (let i = 0; i < NUM_POINTS; i++)
{
  let angle = slice * i
  let x = 5 + RADIUS * Math.cos(angle)
  let y = 5 + RADIUS * Math.sin(angle)
  coordinates.push({x, y})
}
// console.log(coordinates)

console.log('#!/bin/sh')
console.log('#')
console.log(`# NUM_POINTS: ${NUM_POINTS}`)
console.log('#')
console.log(`MILS=${MILIS}`)
console.log('')
for (let i = 0; i < coordinates.length; i++) {
  let coordinate = coordinates[i]
  let angles = drawbot.calcServoAngles(coordinate.x, coordinate.y)
  let angleA = angles[0]
  let angleB = angles[1]
  let pwA = drawbot.getPulseWidth(angleA)
  let pwB = drawbot.getPulseWidth(angleB)

  console.log(`pigs s 10 ${pwA} s 9 ${pwB} mils $MILS`)
}

