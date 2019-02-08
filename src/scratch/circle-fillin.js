/**
 * Randomly fill in a circle.
 */

const drawbot = require('../drawbot')

const NUM_POINTS = 1000
const RADIUS = 1.5

let coordinates = []

for (let i = 0; i < NUM_POINTS; i++) {

// https://programming.guide/random-point-within-circle.html
  let a = Math.random() * 2 * Math.PI
  let r = RADIUS * Math.sqrt(Math.random())

// If you need it in Cartesian coordinates
  let x = r * Math.cos(a)
  let y = r * Math.sin(a)
  coordinates.push({x, y})

}
// console.log(coordinates)

coordinates = coordinates.map(coordinate => {return {x: coordinate.x + 6, y: coordinate.y + 6}})
// console.log(coordinates)

console.log('#!/bin/sh')
console.log('')
for (let i = 0; i < coordinates.length; i++) {
  let coordinate = coordinates[i]
  let angles = drawbot.calcServoAngles(coordinate.x, coordinate.y)
  let angleA = angles[0]
  let angleB = angles[1]
  let pwA = drawbot.getPulseWidth(angleA)
  let pwB = drawbot.getPulseWidth(angleB)

  console.log(`pigs s 10 ${pwA} s 9 ${pwB} mils 100`)
}

