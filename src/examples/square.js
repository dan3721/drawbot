const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.queuePolygon(geometry.square(0,5,3).points)
drawbot.execute()