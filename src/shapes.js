const drawbot = require('./drawbot2')

/**
 * Generates the points for a regular polygon. A regular polygon is a polygon
 * that is equiangular (all angles are equal in measure) and equilateral
 * (all sides have the same length)
 * @param x origin
 * @param y origin
 * @param numPoints
 * @param radius
 *
 * @see https://en.wikipedia.org/wiki/Regular_polygon
 * @see https://stackoverflow.com/questions/5300938/calculating-the-position-of-points-in-a-circle
 */
const regularPolygon = (x, y, numPoints, radius) => {
  let points = []
  let slice = 2 * Math.PI / numPoints
  for (let i = 0; i < numPoints; i++) {
    let angle = slice * i
    let ptX = radius * Math.cos(angle)
    let ptY = radius * Math.sin(angle)
    points.push({x: ptX + x, y: ptY + y})
  }

  return points.reduce((accum, point) => {
    accum.push(point.x)
    accum.push(point.y)
    return accum
  }, [])
}

const star = (x, y, radius) => {
  const numPoints = 10
  let points = []
  let slice = 2 * Math.PI / numPoints
  for (let i = 0; i < numPoints; i++) {
    let angle = slice * i
    const factor = i % 2 === 0 ? radius : radius / 2
    let ptX = factor * Math.cos(angle)
    let ptY = factor * Math.sin(angle)
    points.push({x: ptX + x, y: ptY + y})
  }

  return points.reduce((accum, point) => {
    accum.push(point.x)
    accum.push(point.y)
    return accum
  }, [])
}

// public API
module.exports = {
  regularPolygon,
  star,
}
