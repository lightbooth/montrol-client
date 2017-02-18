/* eslint no-console: 0 */

module.exports = log

function log() {
  console.log.apply(console, arguments)
}

log.error = function() {
  console.error.apply(console, arguments)
}

log.debug = function() {
  console.log.apply(console, arguments)
}

log.ifError = function(err) {
  if (err)
    console.error.apply(console, arguments)
}
