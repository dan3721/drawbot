/**
 * This circle is partially and partially out of bounds.
 */
const drawbot = require('../drawbot2')
const geometry = require('../geometry')

let polygon = geometry.regularPolygon(-1.5, 8, 16, 1).
  points.map(p => {return {x: drawbot.r2(p.x), y: drawbot.r2(p.y)}})

// for drawbot utility test cases "ploylineContainsBadPoint" and
// "splitIntoContiguousMoves"
// let points = polygon.reduce((accum, point) => {
//   accum.push(point.x)
//   accum.push(point.y)
//   return accum
// }, [])
// console.log(points.join(','))

drawbot.queuePolygon(polygon)
drawbot.execute()

