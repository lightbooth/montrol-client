const fs = require('fs-extra')
    , log = require('../log')
    , path = require('path')
    , config = require('../config')
    , request = require('request')
    , device = require('./device')

const handler = new Map()

handler.set('upload', upload)
handler.set('download', download)
handler.set('readdir', readdir)
handler.set('stat', (data, cb) => fs.stat(data.path, cb))
handler.set('remove', (data, cb) => fs.remove(data.path, cb))
handler.set('move', (data, cb) => fs.move(data.path, data.destination, cb))
handler.set('copy', (data, cb) => fs.copy(data.path, data.destination, cb))
handler.set('mkdir', (data, cb) => fs.ensureDir(data.path, cb))
handler.set('create', (data, cb) => fs.ensureFile(data.path, cb))

device.on('fs', data => {
  const id = data.slice(0, 32)

  try {
    data = JSON.parse(data.slice(33))
  } catch (err) {
    return log.error(err)
  }

  handler.forEach((value, key) => {
    data.type === key
    && value(data, (err, result) => {
      if (err) {
        data.error = err
        log.error(err)
      } else {
        data.result = result
      }
      const reply = 'fs.' + id + '.' + JSON.stringify(data)
      device.send(reply)
    })
  })
})

function readdir(data, cb) {
  const readPath = path.resolve.apply(path, data.path)
  fs.readdir(readPath, (err, results) => {
    if (err)
      return cb(err)

    Promise.all(results.map(filename => {
      return new Promise((resolve, reject) => {
        fs.lstat(path.join(readPath, filename), (_, stats) => {
          const file = { name: filename, type: getType(stats) }
          if (!stats.isSymbolicLink())
            return resolve(file)

          fs.readlink(path.join(readPath, filename), (_, stringPath) => {
            if (stringPath)
              file.path = stringPath
            resolve(file)
          })
        })
      })
    })).then(results => cb(null, results))
  })
}

function getType(stats) {
  return stats.isFile()
       ? 'file'
       : stats.isDirectory()
       ? 'folder'
       : stats.isBlockDevice()
       ? 'block'
       : stats.isCharacterDevice()
       ? 'character'
       : stats.isSymbolicLink()
       ? 'symlink'
       : stats.isFIFO()
       ? 'fifo'
       : stats.isSocket()
       ? 'socket'
       : 'unknown'
}

function upload(data, cb) {
  fs.stat(data.path, (err, stat) => {
    if (err)
      return cb(err)

    fs.createReadStream(data.path)
    .on('error', cb)
    .pipe(request.post({
      url: config.httpProtocol + config.host + data.destination,
      headers: {
        'Content-Length': stat.size
      }
    }, cb))
  })
}

function download(data, cb) {
  if (data.destination.startsWith('~'))
    data.destination = data.destination.replace('~', config.home)

  request.get({
    url: config.httpProtocol + config.host + data.path,
    encoding: null
  })
  .on('error', cb)
  .pipe(fs.createWriteStream(data.destination))
}
