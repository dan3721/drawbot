const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.drawPolygon(geometry.triangle(0, 5, 3, 4).points)
drawbot.execute()