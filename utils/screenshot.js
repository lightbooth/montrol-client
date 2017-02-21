const os = require('os')
    , fs = require('fs')
    , path = require('path')
    , log = require('../log')
    , cp = require('child_process')
    , config = require('./config')

const platforms = {
  linux: (fn) => {
    cp.execFile('screenshot', [config.desktopQuality], {
      encoding: 'buffer',
      maxBuffer: 10 * 1024 * 1024
    }, fn)
  },
  darwin: (fn) => {
    const file = path.join(os.tmpdir(), 'montrol_screenshot.jpg')
    return cp.execFile('screencapture', ['-xa', '-t', 'jpg', file], err => {
      if (err)
        return fn(err)

      fs.readFile(file, (err, buffer) => {
        fs.unlink(file, log.ifError)
        fn(err, buffer)
      })
    })
  },
  win32: () => {
    // Todo
  }
}

module.exports = platforms[process.platform]
