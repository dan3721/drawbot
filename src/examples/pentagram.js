const drawbot = require('../drawbot2')

let points = [0, 3.5, -2, 10, 3, 6, -3, 6, 2, 10, 0, 3.5]

points = points.map(point => point * .75)

drawbot.queuePolyline(points)
drawbot.execute()