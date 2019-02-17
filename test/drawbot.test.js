// disable logging
process.env.TESTING = true

const drawbot = require('../src/drawbot2')
const geometry = require('../src/geometry')

const spyError = jest.spyOn(console, 'error')
const spyWarn = jest.spyOn(console, 'warn')

beforeEach(() => {
  spyError.mockReset()
  spyWarn.mockReset()
})

describe('duty cycles', () => {

  // 0°
  test('2500 @ 0°', () => expect(drawbot.getPulseWidth(0)).toBe(2500))
  test('500 @ 0° (flip)',
    () => expect(drawbot.getPulseWidth(0, true)).toBe(500))
  // 90°
  test('1500 @ 90°', () => expect(drawbot.getPulseWidth(90)).toBe(1500))
  test('1500 @ 90° (flip)',
    () => expect(drawbot.getPulseWidth(90, true)).toBe(1500))
  // 180°
  test('500 @ 180°', () => expect(drawbot.getPulseWidth(180)).toBe(500))
  test('2500 @ 180° (flip)',
    () => expect(drawbot.getPulseWidth(180, true)).toBe(2500))
  // 45°
  test('2000 @ 45°', () => expect(drawbot.getPulseWidth(45)).toBe(2000))
  test('1000 @ 45° (flip)',
    () => expect(drawbot.getPulseWidth(45, true)).toBe(1000))
  // 20°
  test('2278 @ 20°', () => expect(drawbot.getPulseWidth(20)).toBe(2278))
  test('722 @ 20° (flip)',
    () => expect(drawbot.getPulseWidth(20, true)).toBe(722))

  test('warn > 108°', () => expect(() => drawbot.getPulseWidth(181)).toThrow())

  test('standard range @ 500/0°',
    () => expect(drawbot.mapPulseWidthToRange(500, 500, 2500)).toBe(500))
  test('standard range @ 1500/90°',
    () => expect(drawbot.mapPulseWidthToRange(1500, 500, 2500)).toBe(1500))
  test('standard range @ 2500/180°',
    () => expect(drawbot.mapPulseWidthToRange(2500, 500, 2500)).toBe(2500))

  test('600 - 2400 @ 500/0°',
    () => expect(drawbot.mapPulseWidthToRange(500, 600, 2400)).toBe(600))
  test('1500 - 2400 @ 1500/90°',
    () => expect(drawbot.mapPulseWidthToRange(1500, 600, 2400)).toBe(1500))
  test('600 - 2400 @ 2500/180°',
    () => expect(drawbot.mapPulseWidthToRange(2500, 600, 2400)).toBe(2400))

})

describe('utility', () => {
  test('valid point 2,2', () => expect(drawbot.isValidPoint(2, 2)).toBe(true))
  test('invalid point 0,just a bit less than min_y', () => expect(
    drawbot.isValidPoint(0, drawbot.min_y - .01)).toBe(false)) // just a bit outside
  test('invalid point 4,9',
    () => expect(drawbot.isValidPoint(4, 8)).toBe(false)) // out top right

  // from circle-partially-out-of-bounds.js
  const POINTS_HALF_IN_HALF_OUT = `-0.5,8,-0.58,8.38,-0.79,8.71,-1.12,\
  8.92,-1.5,9,-1.88,8.92,-2.21,8.71,-2.42,8.38,-2.5,8,-2.42,7.62,-2.21,7.29,\
  -1.88,7.08,-1.5,7,-1.12,7.08,-0.79,7.29,-0.58,7.62`.split(',')

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
  test('A angle @ max reach', () => expect(positions[0]).toMatchSnapshot())
  test('B angle @ max reach', () => expect(positions[1]).toMatchSnapshot())

  // check servo degrees @ min reach (5,1)
  const MIN_X = 1.5
  const positions2 = drawbot.calcServoAngles(0, MIN_X)
  test('A angle @ min reach', () => expect(positions2[0]).toMatchSnapshot())
  test('B angle @ min reach', () => expect(positions2[1]).toMatchSnapshot())

})

describe('move', () => {
  test('move home', () => drawbot.moveHome())
  test('move invalid point 4,9 does not throw an error by default',
    () => expect(drawbot.move(4, 8)).toBeUndefined())
  test('move invalid point 4,9 does throw an error if directed to',
    () => expect(() => drawbot.move(4, 8, false, true)).toThrow())
})

describe('queue', () => {
  test('line',
    () => expect(() => drawbot.queuePolyline([-3, -2, 3, 4])).not.toThrow())
  test('square',
    () => expect(() => drawbot.queuePolygon(geometry.square(2, 4, 2).points)).
      not.
      toThrow())
  test('triangle', () => expect(
    () => drawbot.queuePolygon(geometry.triangle(2, 4, 4, 4).points)).
    not.
    toThrow())
  test('circle',
    () => expect(() => drawbot.queuePolygon(geometry.circle(2, 4, 3).points)).
      not.
      toThrow())
})

describe('calcTranslation', () => {

// calcTranslation vertical
  const VERTICAL_TRANSLATION = drawbot.calcTranslation(0, 5, 0, 6)
// console.log(VERTICAL_TRANSLATION)
  test('calcTranslation vertical',
    () => expect(VERTICAL_TRANSLATION).toMatchSnapshot())

// calcTranslation horizontal
  const HORIZANTAL_TRANSLATION = drawbot.calcTranslation(-2, 6, 2, 6)
// console.log(HORIZANTAL_TRANSLATION)
  test('calcTranslation horizontal',
    () => expect(HORIZANTAL_TRANSLATION).toMatchSnapshot())

// calcTranslation diagonal (/)
  const DIAGONAL_TRANSLATION = drawbot.calcTranslation(-2, 3, 2, 6)
// console.log(DIAGONAL_TRANSLATION)
  test('calcTranslation diagonal /',
    () => expect(DIAGONAL_TRANSLATION).toMatchSnapshot())

// calcTranslation diagonal
  const DIAGONAL_TRANSLATION2 = drawbot.calcTranslation(-2, 6, 2, 3)
// console.log(DIAGONAL_TRANSLATION2)
  test('calcTranslation diagonal2 \\',
    () => expect(DIAGONAL_TRANSLATION2).toMatchSnapshot())

})
