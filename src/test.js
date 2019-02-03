const drawbot = require('./drawbot')

// disable logging
process.env.TESTING = true

let numFailed = 0

const assert = (description, expected, actual) => {

  if (Array.isArray(expected) && Array.isArray(actual)) {
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
assert('pulse width is 500 @ 0°', 500, drawbot.getPulseWidth(0))
assert('pulse width is 1500 @ 90°', 1500, drawbot.getPulseWidth(90))
assert('pulse width is 2500 @ 180°', 2500, drawbot.getPulseWidth(180))

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

// ensure calcTranslation return information sane
const TRANSITION_INFO = drawbot.calcTranslation(5, 5, 5, 6)
assert('calcTranslation: pulse A is 1995', 1995, TRANSITION_INFO[0])
assert('calcTranslation: pulse B is 1005', 1005, TRANSITION_INFO[1])
assert('calcTranslation: execution time is 26', 26, TRANSITION_INFO[2])
assert('calcTranslation: origin point', [125.94, 54.06], TRANSITION_INFO[3])
assert('calcTranslation: target point', [134.59, 45.41], TRANSITION_INFO[4])

// // wow using +() and toFixed(2) to round without trailing zeros!
// let actual = +(33.446).toFixed(2)
// assert('+() produces a numeric', true, !Number.isNaN(actual))
// assert('+() rounds up properly', 33.45, actual)
// assert('+() rounds down properly', 11.44, +(11.443).toFixed(2))

// TESTS END

// RESULTS
console.info(numFailed === 0
  ? '*** ALL TESTS PASSED ***'
  : `*** ${numFailed} FAILURES ***`)