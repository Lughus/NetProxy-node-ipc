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




