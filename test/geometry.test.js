// disable logging
process.env.TESTING = true

const geometry = require('../src/geometry')

describe('utility', () => {
  test('distance', () => expect(geometry.distance(3, 3, 6, 7)).toBe(5))
})

describe('shapes', () => {
  test('regularPolygon',
    () => expect(geometry.regularPolygon()).toMatchSnapshot())
  test('circle', () => expect(geometry.circle()).toMatchSnapshot())
  test('square', () => expect(geometry.square()).toMatchSnapshot())
  test('triangle', () => expect(geometry.triangle()).toMatchSnapshot())
  test('star', () => expect(geometry.star()).toMatchSnapshot())
  test('heart', () => expect(geometry.heart()).toMatchSnapshot())
})
