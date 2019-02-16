/**
 * Heart
 */
const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.drawPolygon(geometry.heart(0, 6).points)
drawbot.execute()