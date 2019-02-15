const drawbot = require('../drawbot2')
const shapes = require('../shapes')

const points = shapes.star(-.5, 5.5, 2.5)
drawbot.drawPolygon(points)
drawbot.execute()