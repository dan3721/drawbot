/**
 * Mr. Draw Bot.
 *
 * _Auto detects [pigpio](https://github.com/fivdi/pigpio) availability and
 * disables hardware support if not available._
 *
 * The general usage pattern is to queue some commands and then invoke draw().
 * See the example drawings...
 *
 * @module drawbot
 * @see module:drawbot
 */

const FS = require('fs')
const PATH = require('path')
const DATEFORMAT = require('dateformat')

/**
 * Log message
 * @param msg message
 * @private
 */
const log = (msg) => {
  if (!process.env.TESTING) {
    console.log(msg)
  }
}

// load pigpio module
let pigpio
try {
  pigpio = require('pigpio')
}
catch (e) {
  // console.warn(e.message)
  console.warn('\
*********************************************************************\n\
* pigpio module not available so there will be no hardware support! *\n\
*                                                                   *\n\
* To resolve install pigpio: npm i pigpio                           *\n\
*********************************************************************')
}

// bind output pins
let SERVO_A, SERVO_B
if (!!pigpio) {
  Gpio = pigpio.Gpio
  SERVO_A = new Gpio(10, {mode: Gpio.OUTPUT}) // TODO: flip and or re-assign pins?
  SERVO_B = new Gpio(9, {mode: Gpio.OUTPUT})
}

// setup
const ARM_1_LENGTH = 4          // length of arm 1
const ARM_2_LENGTH = 5          // length of arm 2
const CENTER = 5                // center point
const PIVIOT_DIST_FROM_CENT = 1 // distance from servo axel from CENTER
const START_X = 5
const START_Y = 5

// servo specs
const SERVO_MAX_DEG = 180
const SERVO_MIN_PULSE_WIDTH = 500
const SERVO_MAX_PULSE_WIDTH = 2500
const DEG_PER_PULSE = (SERVO_MAX_DEG /
  (SERVO_MAX_PULSE_WIDTH - SERVO_MIN_PULSE_WIDTH))
const SERVO_SPEED_DEGREES_PER_SECONDS = .18 / 60   // degrees per second

/* Standard servos are supposed to be 0 (off), 500 (most anti-clockwise) to
* 2500 (most clockwise). However the ones I'm working with are reversed!
 */
const PWM_RANGE_REVERSED = true

const CMD_QUEUE = []

// interval between cmd execution attempts
const CMD_EXECUTION_INTERVAL_IN_MILLIS = 10

// current position
let _x = START_X
let _y = START_Y

// point stack
const POINTS = []

/**
 * Converts the specified radians to degrees.
 * @param radians
 * @returns {number}
 */
const radians2Degrees = (radians) => {
  return radians * 180 / Math.PI
}

/**
 * Given a point returns the corresponding angles in degrees for both
 * servos. Note we are leveraging {@link calcServoAngle} for both the A and B
 * servos by flipping the SAME flag!
 *
 * @param x
 * @param y
 * @returns {number[]} an array where idx:
 * * 0 = Servo A angel
 * * 1 = Servo B angle
 */
const calcServoAngles = (x, y) => {
  const SAME = x < CENTER
  return SAME ?
    [
      +((180 - calcServoAngle(x, y, SAME)).toFixed(2)),
      calcServoAngle(x, y, !SAME)] : // A
    [
      +((180 - calcServoAngle(x, y, !SAME)).toFixed(2)),
      calcServoAngle(x, y, SAME)]   // B
}

/**
 * Given a point returns the corresponding angle in degrees for a servo. The
 * same parameter indicates whether or not we are dealing with a servo that is
 * in the same quadrant as the x coordinate. This is because we do some things
 * just a bit differently depending so that we can make use of the same
 * approach.
 *
 * @param x {number}
 * @param y {number}
 * @param true if servo is on the same side as the point.
 * @returns {number} degrees
 */
const calcServoAngle = (x, y, same) => {

  const OFFSET = same ?
    CENTER - PIVIOT_DIST_FROM_CENT : // offset is left of center
    CENTER + PIVIOT_DIST_FROM_CENT // offset is right of center

  const OPPOSITE = OFFSET - x
  const ADJACENT = y

  // step 1: solve hypotenuse
  const HYPOTENUSE = Math.sqrt(Math.pow(OPPOSITE, 2) + Math.pow(ADJACENT, 2))

  // step 2: solve angle 1
  const ANGLE1 = radians2Degrees(Math.atan(OPPOSITE / ADJACENT))

  // step 3: solve angle 2
  const A = HYPOTENUSE
  const B = ARM_1_LENGTH
  const C = ARM_2_LENGTH
  const ANGLE2 = radians2Degrees(
    Math.acos((Math.pow(A, 2) + Math.pow(B, 2) - Math.pow(C, 2)) / (2 * A * B)))

  // step 4: add angles
  const ANGLE = (same ? ANGLE1 + ANGLE2 : ANGLE2 - ANGLE1).toFixed(2)

  return +(ANGLE)
}

/**
 * Queues a move to a point.
 * @param {number} x
 * @param {number} y
 */
const move = (x, y) => {
  CMD_QUEUE.push(`move ${x} ${y}`)
}

/**
 * Queues multiple moves.
 * @param points {number[]} one ore more points
 */
const mmove = points => {
  for (let i = 0; i < points.length; i += 2) {
    move(points[i], points[i + 1])
  }
}

/**
 * Dumps drawing as an SVG HTML file.
 */
const dumpSVG = () => {

  const SCALE = 50

  // filename based on drawing js
  let filename = module.parent.filename
  filename = filename.replace('.js', '.html')

  const SVG = FS.createWriteStream(filename)

  SVG.write(`<html>`)
  SVG.write(`<head><title>${PATH.parse(filename).name}</title></head>`)
  SVG.write(`<body>`)
  SVG.write(
    `<svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">`)
  SVG.write(`<g transform="translate(0,500)">`)

  // x axis
  SVG.write(`<line x1="0" y1="0" x2="${10 *
  SCALE}" y2="0" style="stroke:red;stroke-width:1" />`)

  // y axis
  SVG.write(
    `<line x1="${CENTER * SCALE}" y1="0" x2="${CENTER * SCALE}" y2="${-10 *
    SCALE}" style="stroke:green;stroke-width:1" />`)

  // servo A
  SVG.write(`<circle cx="${4 *
  SCALE}" cy="0" r="10" stroke="black" stroke-width="2" fill="cyan" />`)
  SVG.write(`<text x="${4 *
  SCALE}" y="5" text-anchor="middle" stroke="black" stroke-width="1px">A</text>`)

  // servo B
  SVG.write(`<circle cx="${6 *
  SCALE}" cy="0" r="10" stroke="black" stroke-width="2" fill="yellow" />`)
  SVG.write(`<text x="${6 *
  SCALE}" y="5" text-anchor="middle" stroke="black" stroke-width="1px">B</text>`)

  // path
  SVG.write('<polyline points="')
  POINTS.forEach(point => {
    SVG.write(`${point[0] * SCALE},${-point[1] * SCALE} `)
  })
  SVG.write('" style="fill:none;stroke:black;stroke-width:1" />')

  // points and labels
  POINTS.forEach((point, index) => {
    // point
    SVG.write(`<circle cx="${point[0] * SCALE}" cy="${-point[1] *
    SCALE}" r="2" stroke="blue" stroke-width="2" fill="blue" />`)
    // label
    SVG.write(`<text x="${point[0] * SCALE + 3}" y="${-point[1] *
    SCALE -
    8}" fill="blue" style="font-size:85%">${index} (${point[0]},${point[1]})</text>`)
  })

  SVG.write('</g>')
  SVG.write('</svg>')
  SVG.write(`</body>`)
  SVG.write(`</html>`)

  SVG.end()

  log(`SVG captured to file: ${filename}`)

}

/**
 * Calculates the pulse width for the specified degrees.
 * @param degrees
 * @returns {number} pulse width
 */
const getPulseWidth = (degrees) => {
  let width = (degrees / DEG_PER_PULSE) + SERVO_MIN_PULSE_WIDTH
  width = +(width.toFixed(0))
  if (PWM_RANGE_REVERSED) {
    width = width + (1500 - width) * 2
  }
  return width
}

/**
 * Smart padding for values fixed to 2. If the value ends with two digits the
 * padding is added to the beginning else it's added to the end. This nicely
 * pads values like 96.78 and 158.7 so they are left aligned.
 * @private
 */
const padDeg = (val) => {
  val += ''
  // return val.match(/^\.\d\d$/) ? val.padStart(6, ' ') : val.padEnd(6, ' ')
  return val.padStart(6, ' ')
}

/**
 * @private
 */
const fmtPoint = (n) => (`${n}`).padEnd(4, ' ')

/**
 * @private
 */
const padPulse = (val) => {
  val += ''
  return val.padStart(5, ' ')
}

/**
 * Given origin and target points, calculates all the relevant information.
 *
 * @param x1 {number} origin x
 * @param y1 {number} origin y
 * @param x2 {number} target x
 * @param y2 {number} target y
 * @returns {number[]} an array where idx:
 * * 0 = number - pulse A
 * * 1 = number - pulse B
 * * 2 = number - execution time in millis
 * * 3 = number[] - current positions in degrees of both servos
 * * 4 = number[] - target positions in degrees of both servos
 */
const calcTranslation = (x1, y1, x2, y2) => {

  const CURRENT_POSITION = calcServoAngles(x1, y1)
  const TARGET_POSITION = calcServoAngles(x2, y2)

  const DELTA_DEGREES_A = Math.abs(
    CURRENT_POSITION[0] - TARGET_POSITION[0])
  const DELTA_DEGREES_B = Math.abs(
    CURRENT_POSITION[1] - TARGET_POSITION[1])

  const LARGEST_DELTA_DEGREES = +((DELTA_DEGREES_A > DELTA_DEGREES_B
    ? DELTA_DEGREES_A
    : DELTA_DEGREES_B).toFixed(2))
  const EXECUTION_TIME_IN_MILLIS = +(((LARGEST_DELTA_DEGREES *
    SERVO_SPEED_DEGREES_PER_SECONDS) * 1000).toFixed())

  // const DELTA_X = Math.abs(CURRENT_POSITION[0] - TARGET_POSITION[0]).
  //   toFixed(2)
  // const DELTA_Y = Math.abs(CURRENT_POSITION[1] - TARGET_POSITION[1]).
  //   toFixed(2)

  const PULSE_A = getPulseWidth(TARGET_POSITION[0])
  const PULSE_B = getPulseWidth(TARGET_POSITION[1], true)

  // feedback
  if (!process.env.TESTING) {
    process.stdout.write(
      `\n${fmtPoint(x2)} ${fmtPoint(y2)} ${padDeg(
        TARGET_POSITION[0])}° ${padDeg(
        TARGET_POSITION[1])}° ${padPulse(PULSE_A)} ${padPulse(
        PULSE_B)} ${('' + EXECUTION_TIME_IN_MILLIS).padEnd(3, ' ')} `) // ${EXECUTION_TIME_IN_MILLIS}(${LARGEST_DELTA_DEGREES}°)
  }

  return [
    PULSE_A,
    PULSE_B,
    EXECUTION_TIME_IN_MILLIS,
    CURRENT_POSITION,
    TARGET_POSITION]
}

/**
 * Initiates the drawing cycle which executes all the commands and terminates.
 */
const draw = (dumpSvg = false) => {

  move(START_X, START_Y) // reset to starting position

  const START_DATE = new Date()
  const START_TIME = START_DATE.getTime()
  log(DATEFORMAT(START_DATE, 'dddd, mmmm dS, yyyy, h:MM:ss TT'))

  let isExecuting = false
  const CMD_EXECUTOR = setInterval(() => {

    if (isExecuting) {
      process.stdout.write('.')
    }
    else {

      const CMD = CMD_QUEUE.shift()
      if (!!CMD) {

        const CMD_SEGMENTS = CMD.split(' ')
        const ACTION = CMD_SEGMENTS[0]

        // each cmd is responsible for managing isExecuting !
        switch (ACTION) {
          case  'move':

            const x = CMD_SEGMENTS[1]
            const y = CMD_SEGMENTS[2]

            const TRANSLATION_INFO = calcTranslation(x, _y, x, y)

            // start pwm for both servos
            if (!!pigpio) {
              SERVO_A.servoWrite(TRANSLATION_INFO[0])
              SERVO_B.servoWrite(TRANSLATION_INFO[1])
            }

            isExecuting = true

            setTimeout(() => {

              // stop pwm for both servos
              if (!!pigpio) {
                SERVO_A.servoWrite(0)
                SERVO_B.servoWrite(0)
              }

              // update and record location
              _x = x
              _y = y
              POINTS.push([_x, _y])

              isExecuting = false
            }, TRANSLATION_INFO[2] + 1000) // TODO: temp padd

            break
          default:
            throw `${ACTION} is an unsupported action!`
        }

      }

      // no more cmds so shut it all down...
      else {
        clearInterval(CMD_EXECUTOR)
        log('\n')
        if (dumpSvg) {
          dumpSVG()
        }
        log(`DONE Total execution time was ${new Date().getTime() -
        START_TIME} milliseconds.`)
      }
    }
  }, CMD_EXECUTION_INTERVAL_IN_MILLIS)

}

move(START_X, START_Y)

// public API
module.exports = {

  // calculations
  calcServoAngle,
  calcServoAngles,
  calcTranslation,
  getPulseWidth,

  // cmds
  move,
  mmove,
  draw,

  // utility
}
