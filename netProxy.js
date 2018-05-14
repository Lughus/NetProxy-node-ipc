const uuidv4 = require('uuid/v4')
const ipc = require('node-ipc')
const debug = require('debug')

const {
  NetClientProxy,
  NetServerProxy
} = require('@lug/netproxy')


class NetClientProxyNodeIpc extends NetClientProxy {
  constructor() {
    super()
    this._server = null
    this._address = uuidv4()
    this._timeout = 1000
    this._onData = this._onData.bind(this)
  }
  get state() {
    return this._server ? 'connected' : 'disconnected'
  }
  _initEvents() {
    super._initEvents()
  }
  get socket() {
    return this._server ? `${this._server}.${this._address}` : null
  }
  connect(ip, port) {
    let socket = `net.${port}.${this._address}`
    let timeout = setTimeout(() => {
      this.ev.emit('error', `Server not found ${ip}:${port}`)
    }, this._timeout)
    netProxyEmul.once(`${socket}.connected`, () => {
      clearTimeout(timeout)
      this._server = `net.${port}`
      this.ev.emit('connected', this.socket)
      netProxyEmul.on(this.socket, this._onData)
    })
    netProxyEmul.emit(`net.${port}.connect`, socket)
  }
  _onData(data) {
    this.ev.emit('data', data)
  }
  disconnect() {
    netProxyEmul.emit(`${this._server}.disconnect`, this.socket)
    this.ev.emit('disconnect')
    netProxyEmul.off(this.socket, this._onData)
    this._server = null
    this.ev.emit('destroy')
  }
  send(data) {
    netProxyEmul.emit(`${this._server}.data`, this.socket, data)
  }
}

class NetServerProxyNodeIpc extends NetServerProxy {
  constructor() {
    super()
    this.port = null
    this._onConnect = this._onConnect.bind(this)
    this._onDisonnect = this._onDisonnect.bind(this)
    this._onData = this._onData.bind(this)
  }
  _initEvents() {
    super._initEvents()
  }
  get state() {
    return this.port ? 'on' : 'off'
  }
  listen(port) {
    this.port = port
    netProxyEmul.on(`net.${port}.connect`, this._onConnect)
    netProxyEmul.on(`net.${port}.disconnect`, this._onDisonnect)
    netProxyEmul.on(`net.${port}.data`, this._onData)
    this.ev.emit('start')
    this.waiter = setInterval(() => {}, 1000)
  }
  _onConnect(socket) {
    let sock = this.sockets.find(s => s === socket)
    if (sock === undefined) {
      this.sockets.push(socket)
      this.ev.emit('socket.connect', socket)
    } else this.ev.emit('error', `Socket already connected : ${socket}`)
    netProxyEmul.emit(`${socket}.connected`)
  }
  _onDisonnect(socket) {
    let index = this.sockets.indexOf(socket)
    if (index !== -1) {
      this.sockets.splice(index, 1)
      this.ev.emit('socket.disconnect', socket)
    } else this.ev.emit('error', `Socket already disconnected : ${socket}`)
  }
  _onData(socket, data) {
    let sock = this.sockets.find(s => s === socket)
    if (sock !== undefined) {
      this.ev.emit('socket.data', socket, data)
    } else
      this.ev.emit(
        'error',
        `Socket try to send data but is not known : ${socket} ; ${data}`
      )
  }
  stop() {
    let port = this.port
    this.port = null
    this.sockets = []
    netProxyEmul.off(`net.${port}.connect`, this._onConnect)
    netProxyEmul.off(`net.${port}.disconnect`, this._onDisonnect)
    netProxyEmul.off(`net.${port}.data`, this._onData)
    this.ev.emit('stop')
    clearInterval(this.waiter)
  }
  send(socket, data) {
    netProxyEmul.emit(socket, data)
  }
}

module.exports = {
  NetClientProxyNodeIpc,
  NetServerProxyNodeIpc
}