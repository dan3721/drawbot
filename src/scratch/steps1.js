const Gpio = require('pigpio').Gpio;

const servo = new Gpio(10, {mode: Gpio.OUTPUT});

const sweep = range => {

  // for (let i=0; i<range; i++) {
  //   servo.pwmWrite(i);
  // }

  let dutyCycle = 0
  let interval = setInterval(() => {
    servo.pwmWrite(dutyCycle);
    dutyCycle += 1;
    if (dutyCycle > range) {
      clearInterval(interval)
    }
  }, 10);

}

servo.servoWrite(500);
servo.servoWrite(0);

console.log('getPwmRange', servo.getPwmRange())
console.log('getPwmRealRange', servo.getPwmRealRange())
sweep(250)

