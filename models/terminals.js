const pty = require('node-pty')
    , log = require('../log')
    , fs = require('fs')
    , childProcess = require('child_process')
    , config = require('../config')
    , device = require('./device')

const sessions = new Map()
    , handler = new Map()

handler.set('input.', (session, data) => session.write(data))
handler.set('cwd', sendCWD)
handler.set('resize.', (session, data) => session.resize.apply(session, data.split(',').map(parseInt)))
handler.set('close.', (session, data) => session.destroy())

device.on('connected', () => {
  sessions.forEach(session => {
    if (!session.backlog)
      return

    device.send('terminal.' + session.id + '.output.' + session.backlog, err => {
      if (!err)
        session.backlog = ''
    })
  })
})

device.on('terminal', data => {
  const id = data.slice(0, 32)
      , session = sessions.get(id) || createSession(id)
      , content = data.slice(33)

  handler.forEach((value, key) =>
    content.startsWith(key) && value(session, content.slice(key.length))
  )
})

function createSession(id) {
  log.debug('create terminal session', id)
  const session = pty.spawn(config.shell, [], {
    name  : 'xterm-color',
    cwd   : config.home,
    env   : config.env
  })

  session.id = id
  session.backlog = ''

  sessions.set(session.id, session)

  device.send('terminal.' + session.id +
    '.output.\r\n\r\nTerminal session started\r\n' +
    '===================================\r\n\r\n')

  session.on('data', data => {
    if (session.backlog)
      return session.backlog += data

    device.send('terminal.' + session.id + '.output.' + data, err => {
      if (err)
        session.backlog += data
    })
  })

  session.on('exit', () => {
    sessions.delete(session.id)
    device.send('terminal.' + session.id + '.closed')
  })

  return session
}

function sendCWD(session, data) {
  getCWD(session.pid, (err, path) => {
    if (err || !path)
      return log.error(err || 'Could not get cwd')

    log(session.pid, 'cwd', path)
    device.send('terminal.' + session.id + '.cwd.' + path.replace(/\n/g, ''))
  })
}

function getCWD(pid, callback) {
  if (process.platform === 'linux')
    fs.readlink('/proc/' + pid + '/cwd', callback)
  else if (process.platform === 'darwin')
    childProcess.exec('lsof -a -d cwd -p ' + pid + ' | tail -1 | awk \'{print $9}\'', callback)
  else
    callback('unsupported OS')
}
