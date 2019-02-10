const drawbot = require('./drawbot2')

// disable logging
process.env.TESTING = true

let numFailed = 0

const assert = (description, expected, actual) => {

  // const originalExpected = expected
  // const originalActual = actual

  if ((Array.isArray(expected) && Array.isArray(actual)) ||
    (expected instanceof Object && actual instanceof Object)) {
    expected = JSON.stringify(expected)
    actual = JSON.stringify(actual)
  }

  if (expected !== actual) {
    console.error(
      `*** FAILED *** ${description} expected:[${expected}] actual:[${actual}]`)
    numFailed++
  }
  else {
    console.log(`PASSED: ${description}`)
  }
}

// TESTS BEGIN

// check conversion of degrees to pulse width
// NOTE: current servos are reversed; see drawbot.PWM_RANGE_REVERSED
// 0°
assert('2500 @ 0°', 2500, drawbot.getPulseWidth(0))
assert('500  @ 0° (flip)', 500, drawbot.getPulseWidth(0, true))
// 90°
assert('1500 @ 90°', 1500, drawbot.getPulseWidth(90))
assert('1500 @ 90° (flip)', 1500, drawbot.getPulseWidth(90, true))
// 180°
assert('500  @ 180°', 500, drawbot.getPulseWidth(180))
assert('2500 @ 180° (flip)', 2500, drawbot.getPulseWidth(180, true))
// 45°
assert('2000 @ 45°', 2000, drawbot.getPulseWidth(45))
assert('1000 @ 45° (flip)', 1000, drawbot.getPulseWidth(45, true))
// 20°
assert('2278 @ 20°', 2278, drawbot.getPulseWidth(20))
assert('722  @ 20° (flip)', 722, drawbot.getPulseWidth(20, true))

assert('distance', drawbot.distance(3, 3, 6, 7), 5)

assert('valid point 3,3', true, drawbot.isValidPoint(3, 3))
assert('valid point 0,just a bit less than min_y', false,
  drawbot.isValidPoint(0, drawbot.min_y - .01)) // just a bit outside
assert('valid point 4,9', false, drawbot.isValidPoint(4, 8)) // out top right

// check servo degrees @ max reach (5,8.8)
const MAX_X = 8.8
const positions = drawbot.calcServoAngles(0, MAX_X)
assert('A angle @ max reach', 156.51, positions[0])
assert('B angle @ max reach', 23.49, positions[1])

// check servo degrees @ min reach (5,1)
const MIN_X = 1.5
const positions2 = drawbot.calcServoAngles(0, MIN_X)
assert('A angle @ min reach', 50.41, positions2[0])
assert('B angle @ min reach', 129.59, positions2[1])

// calcTranslation vertical
const VERTICAL_TRANSLATION = drawbot.calcTranslation(0, 5, 0, 6)
// console.log(VERTICAL_TRANSLATION)
assert('calcTranslation vertical',
  {
    CURRENT_POSITION: [113.97, 66.03],
    TARGET_POSITION: [123.65, 56.35],
    DELTA_X: 0,
    DELTA_Y: 1,
    CURRENT_PULSE_A: 1234,
    CURRENT_PULSE_B: 1766,
    TARGET_PULSE_A: 1126,
    TARGET_PULSE_B: 1874,
    DELTA_DEGREES_A: 9.68,
    DELTA_DEGREES_B: 9.68,
    DELTA_PULSE_A: 108,
    DELTA_PULSE_B: 108,
    NUM_STEPS: 108,
    PULSE_INCREMENT_A: -1,
    PULSE_INCREMENT_B: 1,
  },
  VERTICAL_TRANSLATION)

// calcTranslation horizontal
const HORIZANTAL_TRANSLATION = drawbot.calcTranslation(-2, 6, 2, 6)
// console.log(HORIZANTAL_TRANSLATION)
assert('calcTranslation horizontal',
  {
    CURRENT_POSITION: [104.72, 32.06],
    TARGET_POSITION: [147.94, 75.28],
    DELTA_X: 4,
    DELTA_Y: 0,
    CURRENT_PULSE_A: 1336,
    CURRENT_PULSE_B: 2144,
    TARGET_PULSE_A: 856,
    TARGET_PULSE_B: 1664,
    DELTA_DEGREES_A: 43.22,
    DELTA_DEGREES_B: 43.22,
    DELTA_PULSE_A: 480,
    DELTA_PULSE_B: 480,
    NUM_STEPS: 480,
    PULSE_INCREMENT_A: -1,
    PULSE_INCREMENT_B: -1,
  },
  HORIZANTAL_TRANSLATION)

// calcTranslation diagonal (/)
const DIAGONAL_TRANSLATION = drawbot.calcTranslation(-2, 3, 2, 6)
// console.log(DIAGONAL_TRANSLATION)
assert('calcTranslation diagonal (/)',
  {
    CURRENT_POSITION: [55.35, 43.42],
    TARGET_POSITION: [147.94, 75.28],
    DELTA_X: 4,
    DELTA_Y: 3,
    CURRENT_PULSE_A: 1885,
    CURRENT_PULSE_B: 2018,
    TARGET_PULSE_A: 856,
    TARGET_PULSE_B: 1664,
    DELTA_DEGREES_A: 92.59,
    DELTA_DEGREES_B: 31.86,
    DELTA_PULSE_A: 1029,
    DELTA_PULSE_B: 354,
    NUM_STEPS: 354,
    PULSE_INCREMENT_A: -2.91,
    PULSE_INCREMENT_B: -1,
  },
  DIAGONAL_TRANSLATION,
)

// calcTranslation diagonal
const DIAGONAL_TRANSLATION2 = drawbot.calcTranslation(-2, 6, 2, 3)
// console.log(DIAGONAL_TRANSLATION2)
assert('calcTranslation diagonal2 (\\)',
  {
    CURRENT_POSITION: [104.72, 32.06],
    TARGET_POSITION: [136.58, 124.65],
    DELTA_X: 4,
    DELTA_Y: 3,
    CURRENT_PULSE_A: 1336,
    CURRENT_PULSE_B: 2144,
    TARGET_PULSE_A: 982,
    TARGET_PULSE_B: 1115,
    DELTA_DEGREES_A: 31.86,
    DELTA_DEGREES_B: 92.59,
    DELTA_PULSE_A: 354,
    DELTA_PULSE_B: 1029,
    NUM_STEPS: 354,
    PULSE_INCREMENT_A: -1,
    PULSE_INCREMENT_B: -2.91,
  }/**/,
  DIAGONAL_TRANSLATION2,
)

// // wow using +() and toFixed(2) to round without trailing zeros!
// let actual = +(33.446).toFixed(2)
// assert('+() produces a numeric', true, !Number.isNaN(actual))
// assert('+() rounds up properly', 33.45, actual)
// assert('+() rounds down properly', 11.44, +(11.443).toFixed(2))

// TESTS END

// RESULTS
console.log()
console.info(numFailed === 0
  ? '*** ALL TESTS PASSED ***'
  : `*** ${numFailed} FAILURES ***`)