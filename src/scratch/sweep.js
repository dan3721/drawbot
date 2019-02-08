const Gpio = require('pigpio').Gpio;

const motor = new Gpio(10, {mode: Gpio.OUTPUT});

let pulseWidth = 500;
let increment = 1;

let interval = setInterval(() => {
  motor.servoWrite(pulseWidth);
  pulseWidth += increment
  if (pulseWidth >= 2500) {
    clearInterval(interval)
  }
}, 10);