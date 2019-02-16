const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.drawPolygon(geometry.square(0,5,3).points)
drawbot.execute()