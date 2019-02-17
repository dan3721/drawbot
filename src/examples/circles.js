/**
 * Draw a few circles
 */
const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.queuePolygon(geometry.circle(0, 5, 1).points)
drawbot.queuePolygon(geometry.circle(0, 5, 2).points)
drawbot.queuePolygon(geometry.circle(0, 5, 3).points)
drawbot.execute()