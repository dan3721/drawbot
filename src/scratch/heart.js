



// heart top curve
const fx1 = x => Math.sqrt(1-Math.pow((Math.abs(x)-1),2))
// heart bottom curve
const fx2 = x => Math.acos(1 - Math.abs(x)) - Math.PI

const l = m => console.log(m)

l(fx2(0))
l(fx2(1))
l(fx2(2))

