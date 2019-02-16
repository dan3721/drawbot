const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.drawPolygon(geometry.star(0, 5.5, 3).points)
drawbot.execute()