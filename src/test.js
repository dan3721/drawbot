const drawbot = require('./drawbot')

let numFailed = 0

const assert = (description, expected, actual) => {
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

// check pulse width against degrees
assert('500  @ 0°', 500, drawbot.getPulseWidth(0))
assert('1500 @ 90°', 1500, drawbot.getPulseWidth(90))
assert('2500 @ 180°', 2500, drawbot.getPulseWidth(180))

// check arm 1 degrees @ max reach (5,8.8)
const MAX_X = 8.8
const positions = drawbot.calcServoPositions(5, MAX_X)
assert('A is 175.02° at max reach (5,8.8)', 175.02, positions[0])
assert('B is 4.98° when @ max reach (5,8.8)', 4.98, positions[1])

// check arm 1 degrees @ min reach (5,1)
const MIN_X = 1
const positions2 = drawbot.calcServoPositions(5, MIN_X)
assert('A is 96.78° @ min reach (5,1)', 96.78, positions2[0])
assert('B is 83.22° @ min reach (5,1)', 83.22, positions2[1])

// TESTS END

// RESULTS
console.info(numFailed === 0
  ? '*** ALL TESTS PASSED ***'
  : `*** ${numFailed} FAILURES ***`)