/**
 * Draws some random bubbles.
 *
 * Note(1): There is currently some bug in which bubbles appear within others.
 * boundingfx was intended to prevent that; either it has a bug or the approach
 * is flawed.
 */
const drawbot = require('../drawbot2')
const _ = require('lodash')

const NUM_BUBBLES = 16

const CIRCLE_RESOLUTION = .10 // lower = more points of resolution
const genCircle = (x, y, radius) => {
  const numPoints = Math.round((2 * Math.PI / CIRCLE_RESOLUTION) * radius)
  return getPoints(x, y, numPoints, radius)
}

const getPoints = (x, y, numPoints, radius) => {
  let points = []
  let slice = 2 * Math.PI / numPoints
  for (let i = 0; i < numPoints; i++) {
    let angle = slice * i
    let ptX = radius * Math.cos(angle)
    let ptY = radius * Math.sin(angle)
    points.push(ptX + x, ptY + y)
  }
  return {
    points, boundingfx: (tx, ty) => {
      return drawbot.isPointWithinCircle(tx, ty, x, y, radius)
    },
  }
}

let bubbles = []
do {
  let point = drawbot.getRandomPoint()
  let newBubble = genCircle(point.x, point.y, _.random(0, 3, true))

  let hasPointsWithinAnExistingBubble = bubbles.some(bubble => {
    for (let k = 0; k < newBubble.points.length; k += 2) {
      if (bubble.boundingfx(newBubble.points[k], newBubble.points[k + 1])) {
        return true
      }
    }
    return false
  })

  if (!hasPointsWithinAnExistingBubble) {
    bubbles.push(newBubble)
  }

}
while (bubbles.length < NUM_BUBBLES)

bubbles.forEach(bubble => drawbot.drawPolyline(bubble.points))
drawbot.execute()