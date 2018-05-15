const uuidv4 = require('uuid/v4')
const ipc = require('node-ipc')

const {
  NetClientProxy,
  NetServerProxy
} = require('@lug/netproxy')

const dataEvent = '_message_'

ipc.config.id = '_net_proxy_'
ipc.config.silent = true

class NetClientProxyNodeIpc extends NetClientProxy {
  constructor() {
    super()
    this._ipcId = uuidv4()
    this._ipc = ipc
    this._emitter = null
    this._state = null
    this._dataEvent = dataEvent
  }
  get state() {
    return this._state
  }
  _initEvents() {
    super._initEvents()
  }
  get socket() {
    return null
  }
  connect(ip, port) {
    if (this.state !== null)
      return this.ev.emit('error', Error('Cannot connect two times the same client without disconnect'))
    ipc.connectToNet(this._ipcId, ip, port, () => {
      this._emitter = ipc.of[this._ipcId]
      this._initIpcEvents()
      this.ev.emit('connect')
    })

  }
  _initIpcEvents() {
    this._emitter.on('error', err => this.ev.emit('error', err))
    this._emitter.on('connect', () => {
      this._state = 'connected'
      this.ev.emit('connected')
    })
    this._emitter.on('disconnect', () => {
      this._state = 'disconnected'
      this.ev.emit('disconnect')
    })
    this._emitter.on('destroy', () => {
      this._state = null
      this._emitter = null
      this.ev.emit('destroy')
    })
    this._emitter.on(this._dataEvent, this._onData.bind(this))
  }
  _onData(data) {
    this.ev.emit('data', data)
  }
  disconnect() {
    ipc.disconnect(this._ipcId)
  }
  send(data) {
    this._emitter.emit(this._dataEvent, data)
  }
}

class NetServerProxyNodeIpc extends NetServerProxy {
  constructor() {
    super()
    this._port = null
    this._emitter = null
    this._state = null
    this._onConnect = this._onConnect.bind(this)
    this._onDisonnect = this._onDisonnect.bind(this)
    this._onData = this._onData.bind(this)
    this._dataEvent = dataEvent
    this._ipc = ipc
    this._sockets = []
  }
  _initEvents() {
    super._initEvents()
  }
  get state() {
    return this._state
  }
  listen(port) {
    this._port = port
    ipc.serveNet(port, () => {
      this._state = 'listening'
      this._emitter = ipc.server
      this._initIpcEvents()
      this.ev.emit('start')
    })
    ipc.server.start()
  }
  _initIpcEvents() {
    this._emitter.on('connect', this._onConnect)
    this._emitter.on('socket.disconnected', this._onDisonnect)
    this._emitter.on(this._dataEvent, this._onData)
  }
  _onConnect(socket) {
    let sock = this._sockets.find(s => s === socket)
    if (sock === undefined) {
      this._sockets.push(socket)
      this.ev.emit('socket.connect', socket)
    } else this.ev.emit('error', Error(`Socket already in list : ${socket}`))
  }
  _onDisonnect(socket) {
    let index = this._sockets.findIndex(s => s === socket)
    if (index !== -1) {
      this._sockets.splice(index, 1)
      this.ev.emit('socket.disconnect', socket)
    } else this.ev.emit('error', Error(`Socket not in list but fire a disconnect event: ${socket}`))
  }
  _onData(data, socket) {
    this.ev.emit('socket.data', socket, data)
  }
  stop() {
    this._emitter.stop()
    this._emitter = null
    this._port = null
    this._sockets = []
    this._state = null
    this.ev.emit('stop')
  }
  send(socket, data) {
    ipc.server.emit(socket, this._dataEvent, data)
  }
}

module.exports = {
  NetClientProxyNodeIpc,
  NetServerProxyNodeIpc
}