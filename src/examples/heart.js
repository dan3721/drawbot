/**
 * Heart
 */
const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.queuePolygon(geometry.heart(0, 6).points)
drawbot.execute()