const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.drawPolygon(geometry.star(-.5, 5.5, 2.5).points)
drawbot.execute()