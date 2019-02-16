/**
 * 32
 */
const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.drawPolygon(geometry.circle(0, 5.5, 32, 2).points)
drawbot.execute()