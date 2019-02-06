const drawbot = require('../drawbot')

// paste points from shetcher.html here then run me and redirect stdout to an sh file and execute it!
let points = [36,71,36,71,36,71,37,70,38,69,38,69,39,68,40,68,41,67,42,66,43,65,44,65,45,64,46,63,47,62,48,61,50,60,51,59,53,58,55,56,57,55,59,53,61,52,63,51,64,50,66,49,68,48,70,47,72,47,73,46,75,46,77,45,79,45,82,44,85,44,87,43,89,43,91,43,92,43,94,43,95,43,96,43,97,43,98,44,99,44,100,45,101,46,101,46,102,47,103,48,104,49,105,50,105,51,106,52,107,53,107,54,107,55,108,55,108,56,108,57,108,58,108,59,108,59,108,60,108,61,108,63,108,64,108,66,108,69,108,71,107,73,107,75,106,77,105,80,104,82,103,85,102,87,101,90,100,92,98,94,97,97,95,100,93,103,91,106,90,108,88,110,87,112,85,115,84,117,82,121,81,124,79,126,78,127,78,129,77,131,76,133,75,135,75,138,74,140,74,143,73,145,73,148,73,150,73,152,73,155,73,157,73,159,73,161,73,162,73,163,73,165,73,166,74,168,75,170,75,171,76,172,77,173,78,174,79,175,80,176,81,177,83,179,85,180,87,181,89,181,90,182,92,182,94,182,96,182,99,182,101,182,103,182,105,181,107,180,108,180,110,179,111,178,113,177,115,176,117,174,120,172,123,170,126,168,129,166,131,165,133,163,135,161,136,159,139,157,141,154,143,151,146,148,149,145,152,141,156,138,160,133,163,130,166,126,170,122,174,117,177,114,183,109,188,105,192,103,198,99,204,96,208,93,213,91,218,90,223,88,228,88,232,87,239,87,247,87,250,87,258,87,263,88,267,89,271,91,274,93,277,95,279,97,280,100,281,102,282,104,282,107,282,109,282,112,282,115,281,118,280,122,278,126,277,130,275,134,273,139,270,146,268,152,266,158,263,164,258,172,254,180,249,187,244,195,239,202,235,209,232,214,228,221,224,227,221,232,216,237,213,242,209,247,206,250,202,256,199,262,195,268,192,274,187,283,183,290,180,295,177,301,175,308,171,316,169,324,167,329,166,334,165,338,165,342,165,344,165,347,165,349,165,350,166,352,167,353,169,355,171,357,173,359,175,361,179,363,183,365,186,366,191,367,195,367,200,367,206,367,212,367,215,366,222,364,227,361,230,359,237,355,240,352,246,348,250,344,254,341,258,336,261,333,266,328,271,324,277,319,283,314,288,310,292,305,297,300,301,296,307,290,314,283,322,275,330,268,337,261,342,258,347,255,353,252,357,250,361,248,365,247,369,246,374,246,380,245,384,245,390,245,394,245,400,247,403,249,406,251,408,252,410,254,411,256,412,258,414,259,414,261,415,264,416,265,416,268,416,271,416,275,416,281,414,287,412,294,410,301,408,306,405,313,403,318,399,326,398,330,396,334,395,338,393,342,391,347,389,350,388,353,386,357,384,360,382,366,380,370,378,376,376,383,374,390,373,394,372,399,371,403,371,407,371,409,371,410,371,411,371,412,371,412,371,413,371,413,371,413,372,413]

let maxX = points.reduce((accumulator, val, idx)=> idx%2===0 && val>accumulator ? val : accumulator)
let maxY = points.reduce((accumulator, val, idx)=> idx%2!==0 && val>accumulator ? val : accumulator)
// console.log(maxX, maxY)

let scale = 25
points = points.map((val, idx)=> drawbot.r2(idx%2===0 ? val/scale: val/scale))

console.log('#!/bin/sh')

// move to first position and wait 10s then run...
let startAngles = drawbot.calcServoAngles(points[0], points[1])
console.log(`pigs s 10 ${drawbot.getPulseWidth(startAngles[0])} s 9 ${drawbot.getPulseWidth(startAngles[1])} millis 10000`)

const mils = 100
for (let i=0; i<=points.length/2; i+=2) {
  // console.log(`${points[i]} ${points[i+1]}`)
  let angles = drawbot.calcServoAngles(points[i], points[i+1])
  let pwA = drawbot.getPulseWidth(angles[0])
  let pwB = drawbot.getPulseWidth(angles[1])
  console.log(`pigs s 10 ${pwA} s 9 ${pwB} mils ${mils}`)
}

// turn em all off
console.log('pigs s 10 0 s 9 0')