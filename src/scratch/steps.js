let pigpio = require('pigpio')
const Gpio = pigpio.Gpio;

// pigpio.configureClock(2, pigpio.CLOCK_PWM)

const servo1 = new Gpio(9, {mode: Gpio.OUTPUT});
const servo2 = new Gpio(10, {mode: Gpio.OUTPUT});

const servo2PwmRange = servo1.getPwmRange()*2
servo2.pwmRange(servo2PwmRange)

const sweep = (servo, range, intervalMillis) => {

  console.log(`${range} ${intervalMillis}`)

  let dutyCycle = 0
  let interval = setInterval(() => {
    servo.pwmWrite(dutyCycle);
    dutyCycle += 1;
    if (dutyCycle > range) {
      clearInterval(interval)
    }
  }, intervalMillis);

}

console.log('------------------ sevo1 -------------------')
console.log('getPwmRange', servo1.getPwmRange())
console.log('getPwmRealRange', servo1.getPwmRealRange())
console.log('------------------ sevo2 -------------------')
console.log('getPwmRange', servo2.getPwmRange())
console.log('getPwmRealRange', servo2.getPwmRealRange())
console.log('-------------------------------------')

servo1.servoWrite(500);
servo1.servoWrite(0);
servo2.servoWrite(500);
servo2.servoWrite(0);

setTimeout(()=>{
  sweep(servo1, servo1.getPwmRange(), 10)
  sweep(servo2, servo2.getPwmRange(), 10 * (servo1.getPwmRange()/servo2.getPwmRange()))
}, 1000)


