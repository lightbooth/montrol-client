/* eslint no-process-env: 0 */

module.exports = {
  production   : process.env.NODE_ENV === 'production',
  shell        : process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : 'bash'),
  env          : process.env,
  home         : process.env.HOME,
  host         : process.env.HOST || 'localhost:5000',
  maxTimeout   : process.env.MAX_TIMEOUT || 5 * 60 * 1000,
  fps          : process.env.DESKTOP_FPS || 10,
  wsProtocol   : process.env.INSECURE_WS ? 'ws://' : 'wss://',
  httpProtocol : process.env.INSECURE_HTTP ? 'http://' : 'https://'
}
