# NetProxy - node-ipc

Implementation of node-ipc in this module

## Getting started

- install `npm i @lug/netproxy-node-ipc`
- use it 
```js
const {
  NetClientProxyNodeIpc,
  NetServerProxyNodeIpc
} = require('../netProxy')

const client = new NetClientProxyNodeIpc()
const server = new NetServerProxyNodeIpc()


server.ev.on('socket.data', (socket, data) => {
  server.send(socket, `I received your message : """${data}"""`)
})
server.ev.on('start', ()=>{
  setTimeout(client.disconnect.bind(client),1000)
  setTimeout(server.stop.bind(server),2500)
})

client.ev.on('connected', ()=>{
  client.send('Hey srv its me')
})

client.connect('localhost', 9999)
server.listen(9999)
```

## Methods

At the end you will have this

- Server
  - listen(port)
  - stop()
  - send(socket,data)
- Client
  - connect(ip,port)
  - disconnect()
  - send(data)

and some events that are triggered when it needs to

## Events

An event is fired with `this.ev.emit('event'[,arg])`

### Server

| event             | arg          | type        | description                     |
| ----------------- | ------------ | ----------- | ------------------------------- |
| error             | error        | any         | when an error happen            |
| start             | -            | -           | when the server start listening |
| stop              | -            | -           | when the server stop            |
| socket.connect    | socket       | socket      | when a client connect           |
| socket.disconnect | socket       | socket      | when a client disconnect        |
| socket.data       | socket, data | socket, any | when a client send data         |

### Client

| event             | arg    | type        | description                       |
| ----------------- | ------ | ----------- | --------------------------------- |
| error             | error  | any         | when an error happen              |
| connect           | -      | -           | when the client is connecting     |
| connected         | socket | socket      | when the client is connected stop |
| disconnect        | -      | -           | when a client disconnect          |
| destroy           | -      | -           | when a client is destroyed        |
| data              | data   | any         | when a client recieve data        |


