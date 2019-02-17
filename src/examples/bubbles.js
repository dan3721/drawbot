/**
 * Draws some random bubbles.
 */
const drawbot = require('../drawbot2')
const geometry = require('../geometry')
const _ = require('lodash')

const NUM_BUBBLES = 16

const bubblesCollide = (b1, b2) => b1.isCollision(b2) || b2.isCollision(b1)

const bubbles = []
do {
  let point = drawbot.getRandomPoint()
  let newBubble = geometry.circle(point.x, point.y, _.random(.25, 3, true))
  let collision = bubbles.some(
    existingBubble => bubblesCollide(existingBubble, newBubble))
  if (!collision) {
    bubbles.push(newBubble)
  }
}
while (bubbles.length < NUM_BUBBLES)

bubbles.forEach(bubble => drawbot.queuePolyline(bubble.points))

drawbot.execute()