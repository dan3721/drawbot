const NOT_IMPLEMENTED = 'Not implemented!'

const distance = (originX, originY, x, y) => Math.sqrt(
  Math.pow(originX - x, 2) + Math.pow(originY - y, 2))

const isPointWithinCircle = (x, y, originX, originY, radius) =>
  distance(originX, originY, x, y) <= radius

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
const regularPolygon = (x = 0, y = 0, numPoints = 5, radius = 2) => {
  const points = []
  const slice = 2 * Math.PI / numPoints
  for (let i = 0; i < numPoints; i++) {
    const angle = slice * i
    const ptX = radius * Math.cos(angle)
    const ptY = radius * Math.sin(angle)
    points.push({x: ptX + x, y: ptY + y})
  }
  return {
    points,
    isCollision: (otherThing) => {
      let collides = false
      for (let j = 0; j < otherThing.points.length; j++) {
        if (isPointWithinCircle(otherThing.points[j].x,
          otherThing.points[j].y, x, y, radius)) {
          return true
        }
      }
      return collides
    },
  }
}

const circle = (x = 0, y = 0, radius = 2, circleResolution = .20) => {
  const numPoints = Math.round((2 * Math.PI / circleResolution) * radius)
  return regularPolygon(x, y, numPoints, radius)
}

const star = (x = 0, y = 0, radius = 2, cleftToPointRatio = .40) => {
  const numPoints = 10
  const points = []
  const slice = 2 * Math.PI / numPoints
  // -2 just to make start position more friendly
  for (let i = -2; i < numPoints - 2; i++) {
    const angle = slice * i
    const factor = i % 2 === 0 ? radius : radius * cleftToPointRatio
    const ptX = factor * Math.cos(angle)
    const ptY = factor * Math.sin(angle)
    points.push(
      {
        x: ptX * (1 - cleftToPointRatio) + x,
        y: ptY * (1 - cleftToPointRatio) + y,
      })
  }
  return {
    points,
    isCollision: (otherThing) => { // dirty  impl borrowed from regularPolygon
      let collides = false
      for (let j = 0; j < otherThing.points.length; j++) {
        if (isPointWithinCircle(otherThing.points[j].x,
          otherThing.points[j].y, x, y, radius)) {
          return true
        }
      }
      return collides
    },
  }
}

const square = (x = 0, y = 0, width = 2) => {
  const halfWidth = width / 2
  const points = []
  points.push({x: x - halfWidth, y: y + halfWidth}) // start at top left
  points.push({x: x + halfWidth, y: y + halfWidth}) // top right
  points.push({x: x + halfWidth, y: y - halfWidth}) // bottom right
  points.push({x: x - halfWidth, y: y - halfWidth}) // bottom left
  /* istanbul ignore next */
  return {
    points,
    isCollision: (otherThing) => {
      throw NOT_IMPLEMENTED
    },
  }
}

const triangle = (x = 0, y = 0, base = 2, height = 2) => {
  const halfHeight = height / 2
  const halfBase = base / 2
  const points = []
  points.push({x: x, y: y + halfHeight}) // start at top
  points.push({x: x + halfBase, y: y - halfHeight}) // bottom right
  points.push({x: x - halfBase, y: y - halfHeight}) // bottom left
  /* istanbul ignore next */
  return {
    points,
    isCollision: (otherThing) => {
      throw NOT_IMPLEMENTED
    },
  }
}

/**
 * Generates a set of points for a heart where the origin is the bottom point
 * of the cleft.
 *
 * @param x
 * @param y
 * @returns {{pointsShifted: Array, sCollision: (function(*): boolean)}}
 *
 * @see https://www.quora.com/What-is-the-equation-that-gives-you-a-heart-on-the-graph
 */
const heart = (x = 0, y = 0) => {

  // heart top curve
  const fx1 = x => Math.sqrt(1 - Math.pow((Math.abs(x) - 1), 2))
  // heart bottom curve
  const fx2 = x => Math.acos(1 - Math.abs(x)) - Math.PI

  const r2 = n => +(n.toFixed(2))
  const add = (a, b) => parseFloat(a) + parseFloat(b)

  // point resolution
  const Z = .1

  // top curves
  const topRightPoints = []
  const topLeftPoints = []
  for (let i = 0.0 - Z; i <= 2; i += Z) {
    let x = r2(add(i, Z))
    topRightPoints.push(x, fx1(x))
    topLeftPoints.unshift(x * -1, fx1(x))
  }

  // bottom curves
  const bottomRightPoints = []
  const bottomLeftPoints = []
  for (let i = 2 - Z; i > 0.0 - Z * 2; i -= Z) {
    let x = r2(add(i, Z))
    bottomRightPoints.push(x, fx2(x))
    bottomLeftPoints.unshift(x * -1, fx2(x))
  }

  // put them all together
  const points = [
    ...bottomLeftPoints,
    ...topLeftPoints,
    ...topRightPoints,
    ...bottomRightPoints,
  ]

  // shift into drawable area
  const pointsShifted = []
  for (let j = 0; j < points.length; j += 2) {
    pointsShifted.push({x: points[j] + x, y: points[j + 1] + y})
  }

  return {
    points: pointsShifted,
    /* istanbul ignore next */
    sCollision: (otherThing) => {
      throw NOT_IMPLEMENTED
    },
  }
}

// public API
module.exports = {

  // shapes
  regularPolygon,
  circle,
  square,
  triangle,
  star,
  heart,

  // utility
  distance,
  isPointWithinCircle,

}
