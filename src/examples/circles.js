/**
 * Draw a few circles
 */
const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.drawPolygon(geometry.circle(0, 5, 1).points)
drawbot.drawPolygon(geometry.circle(0, 5, 2).points)
drawbot.drawPolygon(geometry.circle(0, 5, 3).points)
drawbot.execute()