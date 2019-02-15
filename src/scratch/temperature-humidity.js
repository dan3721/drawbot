/**
 * Humidity/Temperature Sensor(1125) https://www.phidgets.com/?tier=3&catid=14&pcid=12&prodid=96
 *
 * https://www.npmjs.com/package/mcp-spi-adc
 *
 * http://www.hertaville.com/interfacing-an-spi-adc-mcp3008-chip-to-the-raspberry-pi-using-c.html
 */
const mcpadc = require('mcp-spi-adc')

const r2 = n => +(n.toFixed(2))

let tempSensorP = new Promise((resolve, reject) => {
  const tempSensor = mcpadc.open(5, {speedHz: 20000}, err => {
    err ? reject(err) : resolve(tempSensor)
  })
})

let humiditySensorP = new Promise((resolve, reject) => {
  const humiditySensor = mcpadc.open(6, {speedHz: 20000}, err => {
    err ? reject(err) : resolve(humiditySensor)
  })
})

Promise.all([tempSensorP, humiditySensorP]).then(sensors => {
  const [tempSensor, humiditySensor] = sensors
  let tempF, rh
  setInterval(() => {

    tempSensor.read((err, reading) => {
      if (err) throw err
      const tempC = (reading.value * 222.2) - 61.111
      tempF = r2((tempC * 9 / 5) + 32)
    })

    humiditySensor.read((err, reading) => {
      if (err) throw err
      rh = r2((reading.value * 190.6) - 40.2)
    })

    if (!!tempF && rh) {
      console.log(
        `The temperature is ${tempF}°F with a relative humidity of ${rh}%`)
    }

  }, 1000)
})

// const tempSensor = mcpadc.open(5, {speedHz: 20000}, (err) => {
//   if (err) throw err
//   setInterval(() => {
//     tempSensor.read((err, reading) => {
//       if (err) throw err
//       // console.log(reading.value)
//       let tempC = (reading.value * 222.2) - 61.111
//       let tempF = r2((tempC* 9/5) + 32)
//       console.log(`${tempF}°`)
//     })
//   }, 1000)
// })

// const humiditySensor = mcpadc.open(6, {speedHz: 20000}, (err) => {
//   if (err) throw err
//   setInterval(() => {
//     humiditySensor.read((err, reading) => {
//       if (err) throw err
//       // console.log(reading.value)
//       let rh = r2((reading.value*190.6) - 40.2)
//       console.log(`${rh}°`)
//     })
//   }, 1000)
// })