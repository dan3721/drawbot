/**
 * Draw Bot 2.0
 *
 * The general usage pattern is to queue some commands and then invoke execute).
 *
 * See the example drawings...
 *
 * @version 2.0
 * @module drawbot
 * @see module:drawbot
 */

const FS = require('fs')
const PATH = require('path')
const DATEFORMAT = require('dateformat')
const Handlebars = require('handlebars')
const _ = require('lodash')

const CFG = {
  home: {x: 0, y: 1.5},
  servoOffset: 1,
  arm1Length: 4,
  arm2Length: 5.75,
  gigpoA: 9,  // servo A (left)
  gigpoB: 10, // servo B (right)
  gigpoC: 11,  // servo C (wrist)
}

const min_x = 0 + CFG.servoOffset - CFG.arm2Length
const max_x = 0 - CFG.servoOffset + CFG.arm2Length

const min_y = CFG.servoOffset + CFG.servoOffset / 2 // swag
const max_y = Math.sqrt(
  (Math.pow(CFG.arm2Length, 2) - Math.pow(CFG.servoOffset, 2))) + CFG.arm1Length

const getRandomPoint = () => {
  for (; ;) {
    let x = _.random(min_x, max_x, true)
    let y = _.random(min_y, max_y, true)
    if (isValidPoint(x, y)) {
      return {x, y}
    }
  }
}

/**
 * Determins the distance of a point from origin
 * @param x
 * @param y
 * @returns {number}
 */
const distance = (originX, originY, x, y) => Math.sqrt(
  Math.pow(originX - x, 2) + Math.pow(originY - y, 2))

const isPointWithinCircle = (x, y, originX, originY, radius) =>
  distance(originX, originY, x, y) <= radius

const isValidPoint = (x, y) => {
  let valid = false
  if (y >= min_y) { // greater than the y min
    // and within the circle sweeps of both second arm segments
    if (isPointWithinCircle(x, y, 0 - CFG.servoOffset, CFG.arm1Length,
      CFG.arm2Length) &&
      isPointWithinCircle(x, y, 0 + CFG.servoOffset, CFG.arm1Length,
        CFG.arm2Length)) {
      valid = true
    }
  }
  return valid
}

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
    console.warn(`*** WARN: ${msg} ***`)
  }
}

const error = (msg) => {
  if (!process.env.TESTING) {
    console.error(`!!! ERROR: ${msg} !!!`)
  }
}

// setup
const CENTER = 0
const PWM_STEP_SIZE = 1
const SERVO_MAX_DEG = 180
const SERVO_MIN_PULSE_WIDTH = 500
const SERVO_MAX_PULSE_WIDTH = 2500
const DEG_PER_PULSE = (SERVO_MAX_DEG /
  (SERVO_MAX_PULSE_WIDTH - SERVO_MIN_PULSE_WIDTH))

// when you setup the servo turned around such that 500 is most clockwise and
// 2500 is most anti-clockwise.
const SERVO_REVERSED = true

// TODO: temporary till we can test on hardware
const ENABLE_DRAW_ON_OFF = false

const PULSE_LOWER = 500
const PULSE_RAISE = PULSE_LOWER + 200

let _drawEnabled = false

const CMD_QUEUE = []

// current position
let _currentPosition = CFG.home

// point stack
const POINTS = []

// pigs cmds
let _pigs = []

/**
 * Converts the specified radians to degrees.
 * @param radians
 * @returns {number}
 */
const radians2Degrees = (radians) => {
  return radians * 180 / Math.PI
}

/**
 * Round to two decimal places.
 * @param n
 * @returns {number}
 */
const r2 = n => +(n.toFixed(2))
// const r2 = n => n

// pad and pad Left
const p4 = n => ('' + n).padEnd(4, ' ')
const p4L = n => ('' + n).padStart(4, ' ')
const p6 = n => ('' + n).padEnd(6, ' ')

// /**
//  * Smart padding for values fixed to 2. If the value ends with two digits the
//  * padding is added to the beginning else it's added to the end. This nicely
//  * pads values like 96.78 and 158.7 so they are left aligned.
//  * @private
//  */
// const padDeg = (val) => {
//   val += ''
//   // return val.match(/^\.\d\d$/) ? val.padStart(6, ' ') : val.padEnd(6, ' ')
//   return val.padStart(6, ' ')
// }

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
 * Activate drawing by lowering.
 */
const drawOn = () => {
  if (ENABLE_DRAW_ON_OFF) {
    if (!_drawEnabled) {
      CMD_QUEUE.push({action: 'lower'})
      _drawEnabled = true
    }
  }
}

/**
 * Disable drawing by raising.
 */
const drawOff = () => {
  if (ENABLE_DRAW_ON_OFF) {
    if (_drawEnabled) {
      CMD_QUEUE.push({action: 'raise'})
      _drawEnabled = false
    }
  }
}

/**
 * Queues a move to a point.
 * @param {number} x
 * @param {number} y
 */
const move = (x, y, drawMove = false, throwErrorIfInvalid = false) => {
  if (!isValidPoint(x, y)) {
    let error = `${x},${y} is outside the drawable area!`
    if (throwErrorIfInvalid) {
      throw error
    }
    else {
      error += ' SKIPPING POINT!'
      warn(error)
    }
  }
  else {
    drawMove ? drawOn() : drawOff()
    CMD_QUEUE.push({action: 'move', x: r2(x), y: r2(y)})
  }
}

const moveHome = () => move(CFG.home.x, CFG.home.y)

/**
 * Queues multiple moves.
 * @param points {number[]} one or more points
 */
const drawPolyline = points => {

  // move to starting location (without drawing)
  move(points.shift(), points.shift())

  // draw to all points
  for (let i = 0; i < points.length; i += 2) {
    move(points[i], points[i + 1], true)
  }

  drawOff()
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

  points = points.reduce((accum, point) => {
    accum.push(point.x)
    accum.push(point.y)
    return accum
  }, [])

  drawPolyline(points)
}

const drawSquare = (x, y, width) => {
  const halfWidth = width / 2
  move(x - halfWidth, y + halfWidth) // start at top left
  move(x + halfWidth, y + halfWidth, true) // top right
  move(x + halfWidth, y - halfWidth, true) // bottom right
  move(x - halfWidth, y - halfWidth, true) // bottom left
  move(x - halfWidth, y + halfWidth, true) // back top left
}

const drawTrangle = (x, y, base, height) => {
  const halfHeight = height / 2
  const halfBase = base / 2
  move(x, y + halfHeight) // start at top
  move(x + halfBase, y - halfHeight, true) // bottom right
  move(x - halfBase, y - halfHeight, true) // bottom left
  move(x, y + halfHeight, true) // back to top
}

const CIRCLE_RESOLUTION = .20 // lower = more points of resolution
const drawCircle = (x, y, radius) => {
  const numPoints = Math.round((2 * Math.PI / CIRCLE_RESOLUTION) * radius)
  drawRegularPolygon(x, y, numPoints, radius)
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
  // if (!process.env.TESTING) {
  //   process.stdout.write(
  //     `\n${fmtPoint(x2)} ${fmtPoint(y2)} ${padDeg(
  //       TARGET_POSITION[0])}° ${padDeg(
  //       TARGET_POSITION[1])}° ${padPulse(TARGET_PULSE_A)} ${padPulse(
  //       TARGET_PULSE_B)} ${('' + NUM_STEPS).padEnd(3, ' ')} `) // ${EXECUTION_TIME_IN_MILLIS}(${LARGEST_DELTA_DEGREES}°)
  // }

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

const protect = (pulse) => {
  if (pulse < SERVO_MIN_PULSE_WIDTH) {
    warn(
      `Normalized pulse ${pulse} to the minimum because it is less than ${SERVO_MIN_PULSE_WIDTH}!`)
    pulse = SERVO_MIN_PULSE_WIDTH
  }
  else if (pulse > SERVO_MAX_PULSE_WIDTH) {
    pulse = SERVO_MAX_PULSE_WIDTH
    warn(
      `Normalized pulse ${pulse} to the maximum because it is less than ${SERVO_MAX_PULSE_WIDTH}!`)
  }
  return pulse
}

const execute = () => {

  const NOW = new Date()
  let startDateFormatted = DATEFORMAT(NOW, 'dddd, mmmm dS, yyyy, h:MM:ss TT')

  log(`input: ${module.parent.filename}`)

  moveHome() // reset to starting position (appends to end)
  CMD_QUEUE.forEach(cmd => {

    const action = cmd.action

    // each cmd is responsible for managing isExecuting !
    switch (action) {
      case 'raise' :
        _pigs.push(
          `pigs s ${CFG.gigpoC} ${PULSE_RAISE} s ${CFG.gigpoC} 0 # raise`)
        break
      case 'lower' :
        _pigs.push(
          `pigs s ${CFG.gigpoC} ${PULSE_LOWER} s ${CFG.gigpoC} 0 # lower`)
        break
      case  'move':
        const TRANSLATION_INFO = calcTranslation(_currentPosition.x,
          _currentPosition.y, cmd.x, cmd.y)
        // console.log(TRANSLATION_INFO)

        let PULSE_A = TRANSLATION_INFO.CURRENT_PULSE_A
        let PULSE_B = TRANSLATION_INFO.CURRENT_PULSE_B

        // TODO: temporary until we figure out smoothing (interpolation)
        let DO_TRANSITION = true // set to false to go direct to point

        if (!DO_TRANSITION) {

          writePigsS(
            TRANSLATION_INFO.TARGET_PULSE_A,
            TRANSLATION_INFO.TARGET_PULSE_B,
            cmd.x, cmd.y,
            TRANSLATION_INFO.TARGET_POSITION[0],
            TRANSLATION_INFO.TARGET_POSITION[1])

        }
        else {
          for (let steps = 0; steps < TRANSLATION_INFO.NUM_STEPS; steps++) {

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

            // round the actual pulses
            const ACTUAL_PULSE_A = protect(Math.round(PULSE_A))
            const ACTUAL_PULSE_B = protect(Math.round(PULSE_B))

            writePigsS(
              ACTUAL_PULSE_A, ACTUAL_PULSE_B,
              cmd.x, cmd.y,
              TRANSLATION_INFO.TARGET_POSITION[0],
              TRANSLATION_INFO.TARGET_POSITION[1],
              steps !== TRANSLATION_INFO.NUM_STEPS - 1)

          }
        }

        // update and record location
        _currentPosition = {x: cmd.x, y: cmd.y}
        POINTS.push(_currentPosition)

        break
      default:
        throw `${action} is an unsupported action!`
    }
  })

  // write html and pigs files
  Promise.all([
    writeHtml(module.parent.filename, POINTS),
    writePigsScript(module.parent.filename, startDateFormatted)]).then(() => {
  })

}

const writePigsS = (
  PULSE_A, PULSE_B, x, y, degreesA, degreesB, isTransitional = false) => {

  let pcmd = `pigs s 10 ${p4(PULSE_A)} s 9 ${p4(PULSE_B)} mils $MILS`
  let line = `${pcmd} # `
  if (!isTransitional) {
    line += `${p6(degreesA)}° ${p6(degreesB)}° ${x},${y}`
  }
  else {
    line += '*' // transitional step
  }
  _pigs.push(line)
}

const writePigsScript = (filename, startDate) => {
  return new Promise((resolve, reject) => {
    FS.readFile(PATH.join(__dirname, './templates/pigpoints.sh'),
      function (err, data) {
        if (err) {
          reject(err)
        }
        const template = Handlebars.compile(data.toString())
        const CTX = {
          startDate,
          filename: PATH.basename(filename),
          numPoints: POINTS.length,
          cmds: _pigs,
        }
        const script = template(CTX)
        const scriptFilename = filename.replace('.js', '.sh')
        const stream = FS.createWriteStream(scriptFilename)
        stream.write(script)
        stream.end()
        log(`pigs:  ${scriptFilename}`)
        resolve()
      })
  })
}
/**
 * Dumps drawing as an SVG HTML file.
 */
const writeHtml = (filename, _coordinates) => {

  return new Promise((resolve, reject) => {

    const SCALE = 75

    const helpers = require('handlebars-helpers')
    const math = helpers.math()

    Handlebars.registerHelper('json', function (context) {
      return JSON.stringify(context, null, 2)
    })

    const width = max_x * 2 * SCALE
    const height = Math.ceil((CFG.arm1Length + CFG.arm2Length) * SCALE)
    const offsetX = width / 2

    const servoAx = offsetX - CFG.servoOffset * SCALE
    const servoBx = offsetX + CFG.servoOffset * SCALE
    const arm2Radius = CFG.arm2Length * SCALE

    const yMin = height - min_y * SCALE
    const yH = min_y * SCALE

    const CTX = {
      math,
      SCALE,
      CFG,
      object: helpers.object(),
      MAX_X: max_x, MIN_X: min_x,
      MAX_Y: max_y, MIN_Y: min_y,
      height,
      width,
      yMin,
      yH,
      title: PATH.parse(filename).name,
      servoAx,
      servoBx,
      arm2AMaxReachCoordinate: {x: servoAx, y: height - CFG.arm1Length * SCALE},
      arm2BMaxReachCoordinate: {x: servoBx, y: height - CFG.arm1Length * SCALE},
      arm2Radius,
      coordinates: _coordinates.map(coordinate => {
        return {
          xO: coordinate.x,
          yO: coordinate.y,
          x: coordinate.x * SCALE + offsetX,
          y: height - coordinate.y * SCALE,
        }
      }),
      labelPoints: _coordinates.length <= 16, // only show labels if legible
    }

    FS.readFile(PATH.join(__dirname, './templates/virtual.html'),
      function (err, data) {
        if (err) {
          reject(err)
        }
        const template = Handlebars.compile(data.toString())
        const script = template(CTX)
        const virtualFilename = filename.replace('.js', '.html')
        const stream = FS.createWriteStream(virtualFilename)
        stream.write(script)
        stream.end()
        log(`html:  ${virtualFilename}`)
        resolve()
      })
  })

}

move(CFG.home.x, CFG.home.y) // reset to starting position

// public API
module.exports = {

  // derived
  min_x, max_x,
  min_y, max_y,

  // calculations
  distance,
  isValidPoint,
  radians2Degrees,
  calcServoAngle,
  calcServoAngles,
  calcTranslation,
  getPulseWidth,

  // cmds
  move,
  moveHome,
  drawPolyline,
  drawRegularPolygon,
  drawSquare,
  drawTrangle,
  drawCircle,
  execute,

  // utility
  r2, p4, p6,
  getRandomPoint,
  isPointWithinCircle,
}
