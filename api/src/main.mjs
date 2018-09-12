import crypto from 'crypto'
import http from 'http'
import io from 'socket.io'
import uuid from 'node-uuid'

const isDev = process.env.NODE_ENV !== 'production'
const config = {
  isDev,
  server: {
    port: isDev ? 8888 : 80,
    secure: false,
    key: null,
    cert: null,
    password: null,
  },
  rooms: {
    maxClients: 0,
  },
  stunservers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
  turnservers: [
    // {
    //   "urls": ["turn:your.turn.servers.here"],
    //   "secret": "turnserversharedsecret",
    //   "expiry": 86400
    // }
  ],
}

const server = http.createServer((req, res) => {
  if (req.url === '/healthcheck') {
    console.log(Date.now(), 'healthcheck')
    res.writeHead(200)
    res.end()
    return
  }
  res.writeHead(404)
  res.end()
})
server.listen(process.env.PORT || 80)

const socketServer = io()
socketServer.listen(server)

socketServer.sockets.on('connection', client => {
  client.resources = {
    screen: false,
    video: true,
    audio: false,
  }

  client.on('message', details => {
    if (!details) return

    var otherClient = socketServer.to(details.to)
    if (!otherClient) return

    details.from = client.id
    otherClient.emit('message', details)
  })
  client.on('shareScreen', () => {
    client.resources.screen = true
  })
  client.on('unshareScreen', type => {
    client.resources.screen = false
    removeFeed('screen')
  })
  client.on('join', joinRoom)
  client.on('disconnect', () => {
    removeFeed()
  })
  client.on('leave', () => {
    removeFeed()
  })
  client.on('create', (name, cb) => {
    if (arguments.length == 2) {
      name = name || uuid()
    } else {
      cb = name
      name = uuid()
    }
    // check if exists
    var room = socketServer.nsps['/'].adapter.rooms[name]
    if (room && room.length) {
      safeCb(cb)('taken')
    } else {
      join(name)
      safeCb(cb)(null, name)
    }
  })

  client.emit('stunservers', config.stunservers || [])

  // create shared secret nonces for TURN authentication
  // the process is described in draft-uberti-behave-turn-rest
  var credentials = []
  // allow selectively vending turn credentials based on origin.
  var origin = client.handshake.headers.origin
  if (!config.turnorigins || config.turnorigins.indexOf(origin) !== -1) {
    config.turnservers.forEach(function(server) {
      var hmac = crypto.createHmac('sha1', server.secret)
      // default to 86400 seconds timeout unless specified
      var username =
        Math.floor(new Date().getTime() / 1000) +
        parseInt(server.expiry || 86400, 10) +
        ''
      hmac.update(username)
      credentials.push({
        username: username,
        credential: hmac.digest('base64'),
        urls: server.urls || server.url,
      })
    })
  }
  client.emit('turnservers', credentials)

  function joinRoom(name, cb) {
    // sanity check
    if (typeof name !== 'string') return
    // check if maximum number of clients reached
    if (
      config.rooms &&
      config.rooms.maxClients > 0 &&
      clientsInRoom(name) >= config.rooms.maxClients
    ) {
      safeCb(cb)('full')
      return
    }
    // leave any existing rooms
    removeFeed()
    safeCb(cb)(null, describeRoom(name))
    client.join(name)
    client.room = name
  }

  function removeFeed(type) {
    if (client.room) {
      socketServer.sockets.in(client.room).emit('remove', {
        id: client.id,
        type: type,
      })
      if (!type) {
        client.leave(client.room)
        client.room = undefined
      }
    }
  }

  function describeRoom(name) {
    var result = {
      clients: {},
    }
    for (const [id, client] of Object.entries(socketServer.sockets.connected)) {
      if (Array.isArray(client.rooms) && client.rooms.includes(name)) {
        result.clients[id] = client.resources
      }
    }
    return result
  }

  function clientsInRoom(name) {
    return socketServer.sockets.clients(name).length
  }
})

function safeCb(cb) {
  if (typeof cb === 'function') {
    return cb
  } else {
    return () => {}
  }
}

export default server
