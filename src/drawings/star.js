const drawbot = require('../drawbot')

// https://www.w3schools.com/graphics/svg_polygon.asp
let points = [100,10,40,198,190,78,10,78,160,198]

// translate up 100 and right 5
points = points.map((p, idx)=> idx%2===0 ? p+5 : p+100)

// scale to fit within drawable area
points = points.map(p=> +(p-(p*.98)).toFixed(2))

// move to starting position
drawbot.move(points[points.length-2], points[points.length-1])

// draw star
drawbot.mmove(points)

drawbot.draw(true)