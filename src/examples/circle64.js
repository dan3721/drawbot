/**
 * 64
 */
const drawbot = require('../drawbot2')

const NUM_POINTS = 64
const RADIUS = 2.5

// https://stackoverflow.com/questions/5300938/calculating-the-position-of-points-in-a-circle
let slice = 2 * Math.PI / NUM_POINTS
for (let i = 0-1; i < NUM_POINTS-1; i++)
{
  let angle = slice * i
  let x = RADIUS * Math.cos(angle)
  let y = RADIUS * Math.sin(angle) + 5
  drawbot.move(x, y)
}

drawbot.draw(true)