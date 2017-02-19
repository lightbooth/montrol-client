const device = require('./models/device')
    , config = require('./config')
    , log = require('./log')
    , mac = require('./utils/mac')

const url = config.wsProtocol + config.host + '/devices/' + mac

log.debug('Starting with id', mac)
log.debug('Connecting to', url)

device.connect(url)

require('./models/terminals')
require('./models/desktop')
require('./models/fs')
