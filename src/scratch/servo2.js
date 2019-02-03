const Gpio = require('pigpio').Gpio;

 // const motor1 = new Gpio(10, {mode: Gpio.OUTPUT});
const motor2 = new Gpio(10, {mode: Gpio.OUTPUT});


const DUTY = Number(process.argv[2])
const DUTY2= Number(process.argv[3])

console.log(`${DUTY} ${DUTY2}`)


setInterval(()=>{
  // motor1.servoWrite(DUTY);
  motor2.servoWrite(DUTY);
}, 1000)


setInterval(()=>{
  // motor1.servoWrite(DUTY2);
  motor2.servoWrite(DUTY2);
}, 1000)




