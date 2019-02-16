### Hardware Setup

The setup consist of A Raspberry Pi three servos and two arms. The two for the arms(A/B) 
provide the actual drawing movements and the third provides the wrist movement to lift the 
drawing implement from the drawing surface.

1. Choose arm servos which have a deadband less than 5 usec or lines will not be smooth. I 
    chose [TowerPro MG995|https://www.towerpro.com.tw/product/mg995/](s) which have a
    deadband of 1 usec. 
1. Calibrate the servos.
1. The wrist servo is less of a concern but having a bracket to do the mounting is handy. I 
    chose [Hobbypark HDR315M|https://www.amazon.com/Hobbypark-HDR315M-Digital-Torque-Mouting/dp/B01H6IR7T0].
1. Build the arms and configure their detentions in drawbot.CFG.

#### Specifics

1. In general arm segment 2 should be greater than arm segment 1.
1. Choose servos with a deadband less than 5usec or lines will not be smooth.
 
### NPM Scripts

* `api` execute jsdoc to produce the api documentation
* `test` execute test cases
* `testupdate` refresh snapshots and re-execute test cases
* `diagnostics` run diagnostic tests (intended to run with just primary arms attached) 
* `examples` run all the example drawings

## Reference

1. [pigpio](http://abyz.me.uk/rpi/pigpio/). Do **NOT** start the daemon.
2. [Installing gcc/g++ 4.8 on Raspbian Wheezy for the Raspberry Pi](https://github.com/fivdi/onoff/wiki/Node.js-v4-and-native-addons#installing-gccg-48-on-raspbian-wheezy-for-the-raspberry-pi)

