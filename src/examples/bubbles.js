/**
 * Draws some random bubbles.
 */
const drawbot = require('../drawbot2')
const _ = require('lodash')

const NUM_BUBBLES = 16

const CIRCLE_RESOLUTION = .2 // lower = more points of resolution
const genCircle = (x, y, radius) => {
  const numPoints = Math.round((2 * Math.PI / CIRCLE_RESOLUTION) * radius)
  return {
    points: getPoints(x, y, numPoints, radius),
    isCollision: (otherCircle) => {
      let collides = false
      for (let j = 0; j < otherCircle.points.length; j += 2) {
        // console.log(`${otherCircle.points[j]} ${otherCircle.points[j+1]}`)
        if (drawbot.isPointWithinCircle(otherCircle.points[j],
          otherCircle.points[j + 1], x, y, radius)) {
          return true
        }
      }
      return collides
    },
  }
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
  points.push(points[0], points[1])
  return points
}

const bubblesCollide = (b1, b2) => b1.isCollision(b2) || b2.isCollision(b1)

let bubbles = []
do {
  let point = drawbot.getRandomPoint()
  let newBubble = genCircle(point.x, point.y, _.random(.25, 3, true))
  let collision = bubbles.some(
    existingBubble => bubblesCollide(existingBubble, newBubble))
  if (!collision) {
    bubbles.push(newBubble)
  }
}
while (bubbles.length < NUM_BUBBLES)

bubbles.forEach(bubble => drawbot.drawPolyline(bubble.points))

drawbot.execute()