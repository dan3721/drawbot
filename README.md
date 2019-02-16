Drawbot is a DIY project consisting of a Raspberry Pi and two arms which can produce 
drawings.

Check out the [Drawbot Gallery](https://photos.app.goo.gl/QHCGD5CoiTJ2aDMZA)!

### Hardware Setup

The setup consist of A Raspberry Pi three servos and two arms. The two for the arms(A/B) 
provide the actual drawing movements and the third provides the wrist movement to lift the 
drawing implement from the drawing surface.

1. Choose arm servos which have a deadband less than 5 usec or lines will not be smooth. I 
    chose [TowerPro MG995](https://www.towerpro.com.tw/product/mg995/)(s) which have a
    deadband of 1 usec. 
1. Calibrate the servos.
1. The wrist servo is less of a concern but having a bracket to do the mounting is handy. I 
    chose [Hobbypark HDR315M](https://www.amazon.com/Hobbypark-HDR315M-Digital-Torque-Mouting/dp/B01H6IR7T0).
1. Build the arms and configure their detentions in drawbot.CFG.

#### Generalisms

1. In general arm segment 2 should be greater than arm segment 1.
1. Choose servos with a deadband less than 5usec or lines will not be smooth.

### Software

The primary module is `drawbot2.js` and it contains all the smarts for directing the arms. All
the geometric related stuff is located in `geometry.js`. Test cases are under `test`.

The basic usage is to create some points and queue them by invoking `drawbot.draw` operations. 
The invoke `drawbot.execute()` which produces both a virtual render and a shell scrip of the 
[pigs](http://abyz.me.uk/rpi/pigpio/pigs.html) cmds to actual perform the render.

Check out all the examples under `src/examples` and run `npm run examples` to freshen them.
 
### NPM Scripts

* `api` execute jsdoc to produce the api documentation
* `test` execute test cases
* `testupdate` refresh snapshots and re-execute test cases
* `diagnostics` run diagnostic tests (intended to run with just primary arms attached) 
* `examples` run all the example drawings

## Reference

1. [pigpio](http://abyz.me.uk/rpi/pigpio/). Do **NOT** start the daemon.
1. [Installing gcc/g++ 4.8 on Raspbian Wheezy for the Raspberry Pi](https://github.com/fivdi/onoff/wiki/Node.js-v4-and-native-addons#installing-gccg-48-on-raspbian-wheezy-for-the-raspberry-pi)

