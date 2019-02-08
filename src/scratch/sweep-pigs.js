const Gpio = require('pigpio').Gpio;

const motor = new Gpio(10, {mode: Gpio.OUTPUT});


for (let i = 500; i<2500; i++) {
  console.log(`pigs s 10 ${i}`);
}
