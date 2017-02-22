const WebSocket = require('uws')
    , PWS = require('pws')
    , log = require('../log')
    , events = require('events')
    , pkg = require('../package.json')

const device = new events.EventEmitter()
    , connection = module.exports = PWS(null, WebSocket)
    , emits = ['ping', 'fs', 'terminal', 'desktop']

device.connect = connection.connect
device.send = connection.send

device.on('ping', data => device.send('pong.' + data))
module.exports = device

connection.onopen = () => {
  device.emit('connected')
  connection.send('version.' + pkg.version)
  log.debug('Connected')
}

connection.onmessage = ({ data }) => {
  emits.forEach(emit =>
    data.startsWith(emit + '.') &&
    device.emit(emit, data.slice(emit.length + 1))
  )
}

connection.onclose = event => {
  device.emit('disconnected')
  log.debug('Connection closed - reconnecting in', event.reconnectDelay / 1000 + 's')
}

connection.onerror = err => log.debug('Connection error', err.code || err.message || err, err.reason)
