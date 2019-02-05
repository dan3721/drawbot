const drawbot = require('../drawbot')

// https://www.w3schools.com/graphics/svg_polygon.asp
let points = [0,0,-1,2,-4,2,-2.5,3.5,-4,5,-1,5,0,7,1,5,4,5,2.5,3.5,4,2,1,2,0,0]

// translate up 150 and right 150 to center up
points = points.map((p, idx)=> idx%2===0 ? p+10 : p+4)

points = points.map((p, idx)=> p/2)

// move to starting position
drawbot.move(points[points.length-2], points[points.length-1])

// draw star
drawbot.mmove(points)

drawbot.draw(true)