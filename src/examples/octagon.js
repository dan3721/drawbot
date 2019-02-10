/**
 * octagon
 */
const drawbot = require('../drawbot2')

// const NUM_POINTS = 8
// const RADIUS = 2.5
//
// // https://stackoverflow.com/questions/5300938/calculating-the-position-of-points-in-a-circle
// let slice = 2 * Math.PI / NUM_POINTS
// for (let i = 0-1; i < NUM_POINTS-1; i++)
// {
//   let angle = slice * i
//   let x = RADIUS * Math.cos(angle)
//   let y = RADIUS * Math.sin(angle) + 4
//   drawbot.move(x, y)
// }

drawbot.drawRegularPolygon(0,5,8,3)
drawbot.draw()