const device = require('./models/device')
    , config = require('./config')
    , log = require('./log')
    , mac = require('./utils/mac')

log.debug('Starting with id', mac)

device.connect(config.wsProtocol + config.host + '/devices/' + mac)

require('./models/terminals')
require('./models/desktop')
require('./models/fs')
