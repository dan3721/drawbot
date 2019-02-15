/**
 * Heart
 *
 * https://www.quora.com/What-is-the-equation-that-gives-you-a-heart-on-the-graph
 */
const drawbot = require('../drawbot2')

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
  ...topRightPoints,
  ...bottomRightPoints,
  ...bottomLeftPoints,
  ...topLeftPoints]

// shift into drawable area
const Y_SHIFT = 6.5
const pointsShifted = []
for (let j = 0; j < points.length; j += 2) {
  pointsShifted.push(points[j], points[j + 1] + Y_SHIFT)
}

drawbot.drawPolyline(pointsShifted)
drawbot.execute()