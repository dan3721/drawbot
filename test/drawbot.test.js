// disable logging
process.env.TESTING = true

const drawbot = require('../src/drawbot2')

const spyError = jest.spyOn(console, 'error')
const spyWarn = jest.spyOn(console, 'warn')

beforeEach(() => {
  spyError.mockReset()
  spyWarn.mockReset()
})

describe('getPulseWidth', () => {

// check conversion of degrees to pulse width
// NOTE: current servos are reversed; see drawbot.PWM_RANGE_REVERSED
// 0°
  test('2500 @ 0°', () => expect(drawbot.getPulseWidth(0)).toBe(2500))
  test('500  @ 0° (flip)',
    () => expect(drawbot.getPulseWidth(0, true)).toBe(500))
// 90°
  test('1500 @ 90°', () => expect(drawbot.getPulseWidth(90)).toBe(1500))
  test('1500 @ 90° (flip)',
    () => expect(drawbot.getPulseWidth(90, true)).toBe(1500))
// 180°
  test('500  @ 180°', () => expect(drawbot.getPulseWidth(180)).toBe(500))
  test('2500 @ 180° (flip)',
    () => expect(drawbot.getPulseWidth(180, true)).toBe(2500))
// 45°
  test('2000 @ 45°', () => expect(drawbot.getPulseWidth(45)).toBe(2000))
  test('1000 @ 45° (flip)',
    () => expect(drawbot.getPulseWidth(45, true)).toBe(1000))
// 20°
  test('2278 @ 20°', () => expect(drawbot.getPulseWidth(20)).toBe(2278))
  test('722  @ 20° (flip)',
    () => expect(drawbot.getPulseWidth(20, true)).toBe(722))

  test('warn > 108°', () => expect(() => drawbot.getPulseWidth(181)).toThrow())

})

describe('utility', () => {
  test('distance', () => expect(drawbot.distance(3, 3, 6, 7)).toBe(5))
  test('valid point 3,3', () => expect(drawbot.isValidPoint(3, 3)).toBe(true))
  test('invalid point 0,just a bit less than min_y', () => expect(
    drawbot.isValidPoint(0, drawbot.min_y - .01)).toBe(false)) // just a bit outside
  test('invalid point 4,9',
    () => expect(drawbot.isValidPoint(4, 8)).toBe(false)) // out top right

  // from circle-partially-out-of-bounds.js
  const POINTS_HALF_IN_HALF_OUT = `-2,8,-2.08,8.38,-2.29,8.71,-2.62,8.92,-3,9,-3.38,8.92,-3.71\
    8.71,-3.92,8.38,-4,8,-3.92,7.62,-3.71,7.29,-3.38,7.08,-3,7,-2.62,7.08,\
    -2.29,7.29,-2.08,7.62`.split(',')

  it('ploylineContainsBadPoint',
    () => expect(drawbot.ploylineContainsBadPoint(POINTS_HALF_IN_HALF_OUT)).
      toBe(true))
  // since the circle is half in and half out of the drawable area, it should
  // be split into two moves to the transition though the points which are
  // out of bounds is handled as a move
  it('splitIntoContiguousMoves',
    () => expect(
      drawbot.splitIntoContiguousMoves(POINTS_HALF_IN_HALF_OUT).length).toBe(2))

  test('duty < 500', () => {
    drawbot.protect(499)
    expect(spyWarn).not.toHaveBeenCalled()
  })
  test('duty cycle > 2500', () => {
    drawbot.protect(2501)
    expect(spyWarn).not.toHaveBeenCalled()
  })

  test('random point',
    () => {
      let p = drawbot.getRandomPoint()
      expect(drawbot.isValidPoint(p.x, p.y)).toBeTruthy()
    })
})

describe('calcServoAngles', () => {

  // check servo degrees @ max reach (5,8.8)
  const MAX_X = 8.8
  const positions = drawbot.calcServoAngles(0, MAX_X)
  test('A angle @ max reach', () => expect(positions[0]).toBe(158.82))
  test('B angle @ max reach', () => expect(positions[1]).toBe(21.18))

  // check servo degrees @ min reach (5,1)
  const MIN_X = 1.5
  const positions2 = drawbot.calcServoAngles(0, MIN_X)
  test('A angle @ min reach', () => expect(positions2[0]).toBe(107.26))
  test('B angle @ min reach', () => expect(positions2[1]).toBe(72.74))

})

describe('move', () => {
  test('move home', () => drawbot.moveHome())
  test('move invalid point 4,9 does not throw an error by default',
    () => expect(drawbot.move(4, 8)).toBeUndefined())
  test('move invalid point 4,9 does throw an error if directed to',
    () => expect(() => drawbot.move(4, 8, false, true)).toThrow())
})

describe('draw', () => {
  test('square',
    () => expect(() => drawbot.drawPolyline([-3, -2, 3, 4])).not.toThrow())
  test('square', () => expect(() => drawbot.drawSquare(2, 4, 2)).not.toThrow())
  test('square',
    () => expect(() => drawbot.drawTrangle(2, 4, 4, 4)).not.toThrow())
  test('square', () => expect(() => drawbot.drawCircle(2, 4, 3)).not.toThrow())
})

describe('calcTranslation', () => {

// calcTranslation vertical
  const VERTICAL_TRANSLATION = drawbot.calcTranslation(0, 5, 0, 6)
// console.log(VERTICAL_TRANSLATION)
  test('calcTranslation vertical',
    () => expect(VERTICAL_TRANSLATION).toEqual({
      CURRENT_POSITION: [124.62, 55.38],
      TARGET_POSITION: [131.65, 48.35],
      DELTA_X: 0,
      DELTA_Y: 1,
      CURRENT_PULSE_A: 1115,
      CURRENT_PULSE_B: 1885,
      TARGET_PULSE_A: 1037,
      TARGET_PULSE_B: 1963,
      DELTA_DEGREES_A: 7.03,
      DELTA_DEGREES_B: 7.03,
      DELTA_PULSE_A: 78,
      DELTA_PULSE_B: 78,
      NUM_STEPS: 78,
      PULSE_INCREMENT_A: -1,
      PULSE_INCREMENT_B: 1,
    }))

// calcTranslation horizontal
  const HORIZANTAL_TRANSLATION = drawbot.calcTranslation(-2, 6, 2, 6)
// console.log(HORIZANTAL_TRANSLATION)
  test('calcTranslation horizontal',
    () => expect(HORIZANTAL_TRANSLATION).toEqual({
      CURRENT_POSITION: [112.72, 25.45],
      TARGET_POSITION: [154.55, 67.28],
      DELTA_X: 4,
      DELTA_Y: 0,
      CURRENT_PULSE_A: 1248,
      CURRENT_PULSE_B: 2217,
      TARGET_PULSE_A: 783,
      TARGET_PULSE_B: 1752,
      DELTA_DEGREES_A: 41.83,
      DELTA_DEGREES_B: 41.83,
      DELTA_PULSE_A: 465,
      DELTA_PULSE_B: 465,
      NUM_STEPS: 465,
      PULSE_INCREMENT_A: -1,
      PULSE_INCREMENT_B: -1,
    }))

// calcTranslation diagonal (/)
  const DIAGONAL_TRANSLATION = drawbot.calcTranslation(-2, 3, 2, 6)
// console.log(DIAGONAL_TRANSLATION)
  test('calcTranslation diagonal /',
    () => expect(DIAGONAL_TRANSLATION).toEqual({
      CURRENT_POSITION: [75.92, 29.57],
      TARGET_POSITION: [154.55, 67.28],
      DELTA_X: 4,
      DELTA_Y: 3,
      CURRENT_PULSE_A: 1656,
      CURRENT_PULSE_B: 2171,
      TARGET_PULSE_A: 783,
      TARGET_PULSE_B: 1752,
      DELTA_DEGREES_A: 78.63,
      DELTA_DEGREES_B: 37.71,
      DELTA_PULSE_A: 873,
      DELTA_PULSE_B: 419,
      NUM_STEPS: 419,
      PULSE_INCREMENT_A: -2.08,
      PULSE_INCREMENT_B: -1,
    }))

// calcTranslation diagonal
  const DIAGONAL_TRANSLATION2 = drawbot.calcTranslation(-2, 6, 2, 3)
// console.log(DIAGONAL_TRANSLATION2)
  test('calcTranslation diagonal2 \\',
    () => expect(DIAGONAL_TRANSLATION2).toEqual({
      CURRENT_POSITION: [112.72, 25.45],
      TARGET_POSITION: [150.43, 104.08],
      DELTA_X: 4,
      DELTA_Y: 3,
      CURRENT_PULSE_A: 1248,
      CURRENT_PULSE_B: 2217,
      TARGET_PULSE_A: 829,
      TARGET_PULSE_B: 1344,
      DELTA_DEGREES_A: 37.71,
      DELTA_DEGREES_B: 78.63,
      DELTA_PULSE_A: 419,
      DELTA_PULSE_B: 873,
      NUM_STEPS: 419,
      PULSE_INCREMENT_A: -1,
      PULSE_INCREMENT_B: -2.08,
    }))

})
