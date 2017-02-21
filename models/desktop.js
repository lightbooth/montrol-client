const device = require('./device')
    , screenshot = require('../utils/screenshot')
    , log = require('../log')
    , robot = require('robotjs')
    , config = require('../config')

robot.setKeyboardDelay(0)
robot.setMouseDelay(0)

let active = false
  , previousBuffer = null
  , lastSent = Date.now()

const handler = new Map()
    , maxUpdateFrequency = 1000 / config.fps

handler.set('mouse.move.', data => robot.moveMouse.apply(robot, data.split(',')))
handler.set('mouse.click.', data => robot.mouseClick(data))
handler.set('mouse.down.', data => robot.mouseToggle('down', data))
handler.set('mouse.up.', data => robot.mouseToggle('down', data))
handler.set('keyboard.press.', key => robot.keyTap(key === '' ? '.' : key))
handler.set('keyboard.down.', key => robot.keyToggle(key === '' ? '.' : key, 'down'))
handler.set('keyboard.up.', key => robot.keyToggle(key === '' ? '.' : key, 'up'))
handler.set('off', () => active = false)
handler.set('on', activate)

device.on('disconnected', () => active = false)

device.on('desktop', data => {
  handler.forEach((value, key) =>
    data.startsWith(key) &&
    value(data.slice(key.length))
  )
})

function activate() {
  if (!active) {
    send()
    active = true
  }
}

function send() {
  active = true
  screenshot((err, buffer) => {
    if (err) {
      log.error(err)
      return device.send('desktop.error.' + err)
    }

    if (!active || buffer === previousBuffer)
      return

    previousBuffer = buffer

    device.send(buffer, { binary: true }, err => {
      if (err)
        return log.ifError(err)

      setTimeout(send, lastSent + maxUpdateFrequency - Date.now())
      lastSent = Date.now()
    })
  })
}
