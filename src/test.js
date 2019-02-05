const drawbot = require('./drawbot')

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
assert('pulse width is 500 @ 0°', 2500, drawbot.getPulseWidth(0))
assert('pulse width is 1500 @ 90°', 1500, drawbot.getPulseWidth(90))
assert('pulse width is 2500 @ 180°', 500, drawbot.getPulseWidth(180))

// check servo degrees @ max reach (5,8.8)
const MAX_X = 8.8
const positions = drawbot.calcServoAngles(5, MAX_X)
assert('A angle is 175.02° at max reach (5,8.8)', 175.02, positions[0])
assert('B angle is 4.98° when @ max reach (5,8.8)', 4.98, positions[1])

// check servo degrees @ min reach (5,1)
const MIN_X = 1
const positions2 = drawbot.calcServoAngles(5, MIN_X)
assert('A angle is 96.78° @ min reach (5,1)', 96.78, positions2[0])
assert('B angle is 83.22° @ min reach (5,1)', 83.22, positions2[1])

// calcTranslation vertical
const VERTICAL_TRANSLATION = drawbot.calcTranslation(5, 5, 5, 6)
console.log(VERTICAL_TRANSLATION)
assert('calcTranslation vertical',
  {
    CURRENT_POSITION: [125.94, 54.06],
    TARGET_POSITION: [134.59, 45.41],
    DELTA_X: 0,
    DELTA_Y: 1,
    CURRENT_PULSE_A: 1101,
    CURRENT_PULSE_B: 1899,
    TARGET_PULSE_A: 1005,
    TARGET_PULSE_B: 1995,
    DELTA_DEGREES_A: 8.65,
    DELTA_DEGREES_B: 8.65,
    DELTA_PULSE_A: 96,
    DELTA_PULSE_B: 96,
    PULSE_STEP_A: 1,
    PULSE_STEP_B: 1,
    PULSE_RATIO: '1:1',
    NUM_STEPS: 0.96,
    PULSE_INCREMENT_A: -100,
    PULSE_INCREMENT_B: 100,
  },
  VERTICAL_TRANSLATION)

// calcTranslation horizontal
const HORIZANTAL_TRANSLATION = drawbot.calcTranslation(3, 6, 7, 6)
console.log(HORIZANTAL_TRANSLATION)
assert('calcTranslation horizontal',
  {
    CURRENT_POSITION: [115.67, 21.3],
    TARGET_POSITION: [158.7, 64.33],
    DELTA_X: 4,
    DELTA_Y: 0,
    CURRENT_PULSE_A: 1215,
    CURRENT_PULSE_B: 2263,
    TARGET_PULSE_A: 737,
    TARGET_PULSE_B: 1785,
    DELTA_DEGREES_A: 43.03,
    DELTA_DEGREES_B: 43.03,
    DELTA_PULSE_A: 478,
    DELTA_PULSE_B: 478,
    PULSE_STEP_A: 1,
    PULSE_STEP_B: 1,
    PULSE_RATIO: '1:1',
    NUM_STEPS: 4.78,
    PULSE_INCREMENT_A: -100,
    PULSE_INCREMENT_B: -100,
  },
  HORIZANTAL_TRANSLATION,
)

// calcTranslation diagonal
const DIAGONAL_TRANSLATION = drawbot.calcTranslation(3, 3, 6, 3)
console.log(DIAGONAL_TRANSLATION)
assert('calcTranslation diagonal',
  {
    CURRENT_POSITION: [73.83, 29.62],
    TARGET_POSITION: [131.66, 90],
    DELTA_X: 3,
    DELTA_Y: 0,
    CURRENT_PULSE_A: 1680,
    CURRENT_PULSE_B: 2171,
    TARGET_PULSE_A: 1037,
    TARGET_PULSE_B: 1500,
    DELTA_DEGREES_A: 57.83,
    DELTA_DEGREES_B: 60.38,
    DELTA_PULSE_A: 643,
    DELTA_PULSE_B: 671,
    PULSE_STEP_A: 0.96,
    PULSE_STEP_B: 1,
    PULSE_RATIO: '0.96:1',
    NUM_STEPS: 6.71,
    PULSE_INCREMENT_A: -95.83,
    PULSE_INCREMENT_B: -100,
  },
  DIAGONAL_TRANSLATION,
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