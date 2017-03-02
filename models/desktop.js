const device = require('./device')
    , screenshot = require('../utils/screenshot')
    , log = require('../log')
    , robot = require('robotjs')
    , config = require('../config')

robot.setKeyboardDelay(0)
robot.setMouseDelay(0)

let lastSent = Date.now()
  , active = false
  , running = false
  , timer

const handler = new Map()
    , maxUpdateFrequency = 1000 / config.fps

handler.set('mouse.move.', data => robot.moveMouse.apply(robot, data.split(',')))
handler.set('mouse.click.', data => robot.mouseClick(data))
handler.set('mouse.down.', data => robot.mouseToggle('down', data))
handler.set('mouse.up.', data => robot.mouseToggle('up', data))
handler.set('keyboard.press.', key => robot.keyTap(key === '' ? '.' : key))
handler.set('keyboard.down.', key => robot.keyToggle(key === '' ? '.' : key, 'down'))
handler.set('keyboard.up.', key => robot.keyToggle(key === '' ? '.' : key, 'up'))
handler.set('off', off)
handler.set('on', on)

device.on('disconnected', off)

device.on('desktop', data => {
  handler.forEach((value, key) =>
    data.startsWith(key) &&
    value(data.slice(key.length))
  )
})

function off() {
  active = false
  running = false
  clearTimeout(timer)
}

function on() {
  active = true
  send()
}

function send(force) {
  if (!active || running)
    return

  lastSent = Date.now()
  screenshot((err, buffer) => {
    if (err || !active)
      return log.ifError(err) && off()

    device.send(buffer, { binary: true }, err => {
      if (err || !active)
        return log.error(err) && off()

      timer = setTimeout(() => {
        running = false
        send()
      }, maxUpdateFrequency - (Date.now() - lastSent), true)
    })
  })
}
