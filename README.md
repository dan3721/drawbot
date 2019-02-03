# Draw Bot

# Run

**Prerequisites**

Download and install the [pigpio](http://abyz.me.uk/rpi/pigpio/). Do **NOT** start the daemon.


Do the usual npm install to get all the dependencies and then run a drawing...

```
npm i
sudo node src/drawings/star.sh
```

_Note(1) **pigpio** is listed as an optional dependency and drawbot is smart 
enough to fall back with no servo support. This is so we can still develop  
and run virtually when we're not actually on the pi._ Durring the install if you are
not on a Raspberry Pi then, you will see a node-gyp error and then a WARN about SKIPPING OPTIONAL DEPENDENCY.

_Note(2) The pigpio C library and therefore the pigpio Node.js package requires root/sudo 
privileges to access hardware peripherals._

# Tools

Execute the test cases with: `npm test`

Run diagnostics with: `npm run diagnostics`

Produce all drawings: `npm run draw-all`. This exercises all the drawings and dumps out an HTML SVG for each.


# Reference

[Installing gcc/g++ 4.8 on Raspbian Wheezy for the Raspberry Pi](https://github.com/fivdi/onoff/wiki/Node.js-v4-and-native-addons#installing-gccg-48-on-raspbian-wheezy-for-the-raspberry-pi)

[pi-blaster.js](https://github.com/sarfata/pi-blaster.js)

