const {
  NetClientProxyNodeIpc,
  NetServerProxyNodeIpc
} = require('../netProxy')

const client = new NetClientProxyNodeIpc()
const server = new NetServerProxyNodeIpc()

server.listen(9999)

server.ev.on('socket.data', (socket, data) => {
  server.send(socket, `I received your message : """${data}"""`)
})

client.connect('localhost', 9999)

client.send('Hey srv its me')

client.disconnect()

server.stop()