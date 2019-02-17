const drawbot = require('../drawbot2')
const geometry = require('../geometry')

drawbot.queuePolygon(geometry.star(0, 5.5, 3).points)
drawbot.execute()