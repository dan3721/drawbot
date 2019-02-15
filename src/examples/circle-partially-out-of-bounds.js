/**
 * This circle is partially and partially out of bounds.
 */
const drawbot = require('../drawbot2')

const getPoints = (x, y, numPoints, radius) => {
  let points = []
  let slice = 2 * Math.PI / numPoints
  for (let i = 0; i < numPoints; i++) {
    let angle = slice * i
    let ptX = radius * Math.cos(angle)
    let ptY = radius * Math.sin(angle)
    points.push(ptX + x, ptY + y)
  }
  // points.push(points[0], points[1])
  return points
}

let polygon = getPoints(-1.5, 8, 16, 1).map(p => drawbot.r2(p))

drawbot.drawPolyline(polygon)
drawbot.execute()

