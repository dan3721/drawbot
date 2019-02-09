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
const Handlebars = require('handlebars')

const CFG = {
  home: {x: 0, y: 1.5},
  servoOffset: 1,
  arm1Length: 4,
  arm2Length: 5.75,
  gigpoA: 9,
  gigpoB: 10,
}

// TODO: derive
const MAX_X = 4.2
const MIN_X = -4.2
const MIN_Y = 1.5
const MAX_Y = 8.8

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

const warn = (msg) => {
  if (!process.env.TESTING) {
    console.warn(`*** ${msg}! ***`)
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
  SERVO_A = new Gpio(CFG.gigpoA, {mode: Gpio.OUTPUT})
  SERVO_B = new Gpio(CFG.gigpoB, {mode: Gpio.OUTPUT})
}

// setup
const CENTER = 0
const PWM_STEP_SIZE = 1
const PWM_STEP_DURATION_IN_MILLIS = !!pigpio ? 1 : 0
// const PWM_STEPS_PER_MILLIS = 100 / PWM_STEP_DURATION_IN_MILLIS
const SERVO_MAX_DEG = 180
const SERVO_MIN_PULSE_WIDTH = 500
const SERVO_MAX_PULSE_WIDTH = 2500
const DEG_PER_PULSE = (SERVO_MAX_DEG /
  (SERVO_MAX_PULSE_WIDTH - SERVO_MIN_PULSE_WIDTH))
// const SERVO_SPEED_DEGREES_PER_SECOND = .18 / 60
// const SERVO_SPEED_DEGREES_PER_MILLIS = SERVO_SPEED_DEGREES_PER_SECOND / 1000

// when you setup the servo turned around such that 500 is most clockwise and
// 2500 is most anti-clockwise.
const SERVO_REVERSED = true

const CMD_QUEUE = []

// interval between cmd execution attempts
const CMD_EXECUTION_INTERVAL_IN_MILLIS = !!pigpio ? 100 : 5

// current position
let _currentPosition = CFG.home

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
 * Calculates the pulse width for the specified degrees.
 * @param degrees
 * @param flip {boolean} flips when servo is used in opposite orientation
 * @returns {number} pulse width
 */
const getPulseWidth = (degrees, flip = false) => {

  if (degrees < 0 || degrees > 180) {
    const error = `ERROR: ${degrees} is outside the range 0° - 180° (inclusive)!`
    throw error
  }

  if (flip) {
    degrees = 180 - degrees
  }

  let width = (degrees / DEG_PER_PULSE) + SERVO_MIN_PULSE_WIDTH
  width = Math.round(width)

  width = protect(width)

  if (SERVO_REVERSED) {
    width = width + (1500 - width) * 2
  }

  return width
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
      r2(180 - calcServoAngle(x, y, SAME)),
      calcServoAngle(x, y, !SAME)] : // A
    [
      r2(180 - calcServoAngle(x, y, !SAME)),
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
    CENTER - CFG.servoOffset : // offset is left of center
    CENTER + CFG.servoOffset // offset is right of center

  const OPPOSITE = OFFSET - x
  const ADJACENT = y

  // step 1: solve hypotenuse
  const HYPOTENUSE = Math.sqrt(Math.pow(OPPOSITE, 2) + Math.pow(ADJACENT, 2))

  // step 2: solve angle 1
  const ANGLE1 = radians2Degrees(Math.atan(OPPOSITE / ADJACENT))

  // step 3: solve angle 2
  const A = HYPOTENUSE
  const B = CFG.arm1Length
  const C = CFG.arm2Length
  const ANGLE2 = radians2Degrees(
    Math.acos((Math.pow(A, 2) + Math.pow(B, 2) - Math.pow(C, 2)) / (2 * A * B)))

  // step 4: add angles
  const ANGLE = (same ? ANGLE1 + ANGLE2 : ANGLE2 - ANGLE1)

  // console.log(
  //   `x:[${x}] y:[${y}] OFFSET:[${OFFSET}] OPPOSITE:[${OPPOSITE}] ADJACENT:[${ADJACENT}] HYPOTENUSE:[${HYPOTENUSE}] ANGLE1:[${ANGLE1}] ANGLE2:[${ANGLE2}] ANGLE:[${ANGLE2}]`)

  return r2(ANGLE)
}

/**
 * Queues a move to a point.
 * @param {number} x
 * @param {number} y
 */
const move = (x, y) => {
  CMD_QUEUE.push({action: 'move', x: r2(x), y: r2(y)})
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
 * Draws a regular polygon. a regular polygon is a polygon that is equiangular
 * (all angles are equal in measure) and equilateral (all sides have the same
 * length)
 * @param x origin
 * @param y origin
 * @param numPoints
 * @param radius
 *
 * @see https://en.wikipedia.org/wiki/Regular_polygon
 * @see https://stackoverflow.com/questions/5300938/calculating-the-position-of-points-in-a-circle
 */
const drawRegularPolygon = (x, y, numPoints, radius) => {
  let points = []
  let slice = 2 * Math.PI / numPoints
  for (let i = 0; i < numPoints; i++) {
    let angle = slice * i
    let ptX = radius * Math.cos(angle)
    let ptY = radius * Math.sin(angle)
    points.push({x: ptX + x, y: ptY + y})
  }

  // move from last point to the first point so the final edge is drawn
  points.push(points[0])

  let moves = points.reduce((accum, point) => {
    accum.push(point.x)
    accum.push(point.y)
    return accum
  }, [])

  // start and end at the center until we have the ability to lift
  move(x, y) // TODO: remove when we have lift capabilities
  mmove(moves)
  move(x, y) // TODO: remove when we have lift capabilities
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

  let DELTA_DEGREES_A = Math.abs(CURRENT_POSITION[0] - TARGET_POSITION[0])
  let DELTA_DEGREES_B = Math.abs(CURRENT_POSITION[1] - TARGET_POSITION[1])

  // const LARGEST_DELTA_DEGREES = DELTA_DEGREES_A > DELTA_DEGREES_B
  //   ? DELTA_DEGREES_A : DELTA_DEGREES_B
  // const EXECUTION_TIME_IN_MILLIS = (LARGEST_DELTA_DEGREES *
  //   SERVO_SPEED_DEGREES_PER_SECONDS) * 1000

  let DELTA_X = Math.abs(x2 - x1)
  let DELTA_Y = Math.abs(y2 - y1)

  // current, target, and delta for A
  const CURRENT_PULSE_A = getPulseWidth(CURRENT_POSITION[0])
  const TARGET_PULSE_A = getPulseWidth(TARGET_POSITION[0])
  const DELTA_PULSE_A = Math.abs(TARGET_PULSE_A - CURRENT_PULSE_A)

  // current, target, and delta for B (don't need to flip because degrees already flipped by calcServoAngles)
  const CURRENT_PULSE_B = getPulseWidth(CURRENT_POSITION[1])
  const TARGET_PULSE_B = getPulseWidth(TARGET_POSITION[1])
  const DELTA_PULSE_B = Math.abs(TARGET_PULSE_B - CURRENT_PULSE_B)

  // pulse rates for equal transition time. servos move to the target duty cycle
  // as fast as they can so all we can do is let the one that is moving the
  // shorter distance go along at its native rate and then slow down the one
  // which has a longer way to go
  let PULSE_STEP_A = DELTA_PULSE_A <= DELTA_PULSE_B ? (DELTA_PULSE_A /
    DELTA_PULSE_B) : 1
  let PULSE_STEP_B = DELTA_PULSE_A >= DELTA_PULSE_B ? (DELTA_PULSE_B /
    DELTA_PULSE_A) : 1

  // const PULSE_RATIO = `${r2(PULSE_STEP_A)}:${r2(PULSE_STEP_B)}`

  const NUM_STEPS = Math.ceil(
    (PULSE_STEP_A >= PULSE_STEP_B ? DELTA_PULSE_B : DELTA_PULSE_A) /
    PWM_STEP_SIZE)

  let PULSE_INCREMENT_A = DELTA_PULSE_A / NUM_STEPS
  if (TARGET_PULSE_A <= CURRENT_PULSE_A) {
    PULSE_INCREMENT_A = PULSE_INCREMENT_A * -1
  }
  let PULSE_INCREMENT_B = DELTA_PULSE_B / NUM_STEPS
  if (TARGET_PULSE_B <= CURRENT_PULSE_B) {
    PULSE_INCREMENT_B = PULSE_INCREMENT_B * -1
  }

  DELTA_X = r2(DELTA_X)
  DELTA_Y = r2(DELTA_Y)

  DELTA_DEGREES_A = r2(DELTA_DEGREES_A)
  DELTA_DEGREES_B = r2(DELTA_DEGREES_B)

  // PULSE_STEP_A = r2(PULSE_STEP_A)
  // PULSE_STEP_B = r2(PULSE_STEP_B)

  PULSE_INCREMENT_A = r2(PULSE_INCREMENT_A)
  PULSE_INCREMENT_B = r2(PULSE_INCREMENT_B)

  // feedback
  if (!process.env.TESTING) {
    process.stdout.write(
      `\n${fmtPoint(x2)} ${fmtPoint(y2)} ${padDeg(
        TARGET_POSITION[0])}° ${padDeg(
        TARGET_POSITION[1])}° ${padPulse(TARGET_PULSE_A)} ${padPulse(
        TARGET_PULSE_B)} ${('' + NUM_STEPS).padEnd(3, ' ')} `) // ${EXECUTION_TIME_IN_MILLIS}(${LARGEST_DELTA_DEGREES}°)
  }

  return {
    CURRENT_POSITION, TARGET_POSITION,
    DELTA_X, DELTA_Y,
    CURRENT_PULSE_A, CURRENT_PULSE_B,
    TARGET_PULSE_A, TARGET_PULSE_B,
    DELTA_DEGREES_A, DELTA_DEGREES_B,
    DELTA_PULSE_A, DELTA_PULSE_B,
    NUM_STEPS,
    PULSE_INCREMENT_A, PULSE_INCREMENT_B,
  }
}

/**
 * Round to two decimal places.
 * @param n
 * @returns {number}
 */
const r2 = n => +(n.toFixed(2))
// const r2 = n => n

const protect = (pulse) => {
  if (pulse < SERVO_MIN_PULSE_WIDTH) {
    warn(
      `normalized pulse ${pulse} to the minimum because it is less than ${SERVO_MIN_PULSE_WIDTH}`)
    pulse = SERVO_MIN_PULSE_WIDTH
  }
  else if (pulse > SERVO_MAX_PULSE_WIDTH) {
    pulse = SERVO_MAX_PULSE_WIDTH
    warn(
      `normalized pulse ${pulse} to the maximum because it is less than ${SERVO_MAX_PULSE_WIDTH}`)
  }
  return pulse
}

/**
 * Initiates the drawing cycle which executes all the commands and terminates.
 */
const draw = (dumpSvg = false) => {

  move(CFG.home.x, CFG.home.y) // reset to starting position (appends to end)

  // log(CMD_QUEUE)

  const START_DATE = new Date()
  const START_TIME = START_DATE.getTime()
  log(DATEFORMAT(START_DATE, 'dddd, mmmm dS, yyyy, h:MM:ss TT'))
  log(module.parent.filename)

  let isExecuting = false
  const CMD_EXECUTOR = setInterval(() => {

    if (isExecuting) {
      // log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
      // process.stdout.write('+')
    }
    else {

      const CMD = CMD_QUEUE.shift()
      if (!!CMD) {

        const ACTION = CMD.action

        // each cmd is responsible for managing isExecuting !
        switch (ACTION) {
          case  'move':

            const TRANSLATION_INFO = calcTranslation(_currentPosition.x,
              _currentPosition.y, CMD.x, CMD.y)
            // console.log(TRANSLATION_INFO)

            isExecuting = true

            let PULSE_A = TRANSLATION_INFO.CURRENT_PULSE_A
            let PULSE_B = TRANSLATION_INFO.CURRENT_PULSE_B

            let steps = 0

            const TRANSLATION = setInterval(() => {

              if (steps < TRANSLATION_INFO.NUM_STEPS) {

                // last step then set both pulses to their respective targets
                if (steps - 1 === TRANSLATION_INFO.NUM_STEPS) {
                  PULSE_A = TRANSLATION_INFO.TARGET_PULSE_A
                  PULSE_B = TRANSLATION_INFO.TARGET_PULSE_B
                }
                // otherwise increment
                else {
                  PULSE_A += TRANSLATION_INFO.PULSE_INCREMENT_A
                  PULSE_B += TRANSLATION_INFO.PULSE_INCREMENT_B
                }

                PULSE_A = protect(Math.round(PULSE_A))
                PULSE_B = protect(Math.round(PULSE_B))

                // set pulse
                if (!!pigpio) {
                  SERVO_A.servoWrite(PULSE_A)
                  SERVO_B.servoWrite(PULSE_B)
                  // console.log(`${PULSE_A}\t${PULSE_B}`)
                }

                if (steps % 16 === 0) {
                  process.stdout.write('-') // per step...
                }

                steps++

              }
              else {

                clearInterval(TRANSLATION)

                // stop pwm for both servos
                if (!!pigpio) {
                  SERVO_A.servoWrite(0)
                  SERVO_B.servoWrite(0)
                }

                // update and record location
                _currentPosition = {x: CMD.x, y: CMD.y}
                POINTS.push(_currentPosition)

                isExecuting = false

              }

            }, PWM_STEP_DURATION_IN_MILLIS)

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
          dumpSVG(module.parent.filename, POINTS)
        }
        log(`DONE Total execution time was ${new Date().getTime() -
        START_TIME} milliseconds.`)
      }
    }
  }, CMD_EXECUTION_INTERVAL_IN_MILLIS)

}

/**
 * Dumps drawing as an SVG HTML file.
 */
const dumpSVG = (filename, _coordinates) => {

  // const MAX_X = 4.2
  // const MIN_X = -4.2
  // const MIN_Y = 1
  // const MAX_Y = 8.8

  const SCALE = 75

  const helpers = require('handlebars-helpers')
  const math = helpers.math()

  Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context, null, 2)
  })

  const width = MAX_X * 2 * SCALE
  const height = Math.ceil(MAX_Y * SCALE)
  const offsetX = width / 2

  const CTX = {
    math,
    SCALE,
    CFG,
    object: helpers.object(),
    MAX_X, MIN_X,
    MAX_Y, MIN_Y,
    height,
    width,
    title: PATH.parse(filename).name,
    servoAx: width / 2 - CFG.servoOffset * SCALE,
    servoBx: width / 2 + CFG.servoOffset * SCALE,
    coordinates: _coordinates.map(coordinate => {
      return {
        xO: coordinate.x,
        yO: coordinate.y,
        x: coordinate.x * SCALE + offsetX,
        y: height - coordinate.y * SCALE,
      }
    }),
    labelPoints: _coordinates.length < 200, // only show labels if legible
  }

  FS.readFile(PATH.join(__dirname, './templates/virtual.html'),
    function (err, data) {
      if (err) {
        throw err
      }
      const template = Handlebars.compile(data.toString())
      const script = template(CTX)
      const virtualFilename = filename.replace('.js', '.html')
      const stream = FS.createWriteStream(virtualFilename)
      stream.write(script)
      stream.end()
      log(virtualFilename)
    })

}

move(CFG.home.x, CFG.home.y) // reset to starting position

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
  drawRegularPolygon,

  // utility
  r2,
}
