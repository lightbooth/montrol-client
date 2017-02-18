const cp = require('child_process')

const emptyMac = '000000000000'
    , nonHex = /[^a-f0-9]/g
    , macRegex = /([0-9a-f]{2}[:-]){5}([0-9a-f]{2})/g
    , mac = process.platform === 'win32'
      ? cp.execFileSync('ipconfig', ['/all'], { encoding: 'utf8' })
      : cp.execFileSync('ifconfig', { encoding: 'utf8' })

module.exports = mac.toLowerCase().match(macRegex)
.map(results => results.replace(nonHex, ''))
.find(mac => mac !== emptyMac)
