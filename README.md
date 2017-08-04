# sockrest
Realtime socket server that works inhibiting expressJS philosophy

## Features

Sockrest enables real-time bidirectional HTTP like communication. It consists in:

* a Node.js server (this repository)
* a Javascript client [library](https://github.com/seitbekir/sockrest-client) for the browser (or a Node.js client)

# How to use

Server-side implementation

```js
const sockrest = require('sockrest')()

const app = sockrest.listen(3000)

app.on('connection', client => {
    // Some code here
})

// middleware applies on each REST query from client
app.use((req, res, next) => {
    console.info(req.body)

    next()
})

app.get('/', (req, res, next) => {
    console.info(`GET: ${req.path}`)

    res.send(200, { message: 'Hello, World!' })
})

app.post('/posts', (req, res, next) => {
    console.info(`POST: ${req.path}`)

    res.send(201, { message: 'Awsome', object: req.body })
})
// middleware that hendle errors
app.use((err, req, res, next) => {
    console.error(err.message)
})

setInterval(() => {
    app.broadcast('message', { message: 'You`ve just got update from server' })
}, 10 * 1000)
```

Client side implementation

```js
import SockrestClient from 'sockrest-client'

let client = SockrestClient('ws://127.0.0.1:3000')

client.on('error', (err) => {
    console.error('connection error', err.message)
})

client.on('open', () => {
    client
        .get('/')
        // 2xx
        .then(res => {
            console.info('Just got response')
            console.info('Status Code:', res.statusCode)
            console.info('Body:', res.body)
        })
        // 4xx
        .catch(err => {
            console.error('Response was not get')
            console.error('Status Code:', err.statusCode);
        })

    client
        .post('/posts', { robot: 'I`m a client' })
        // 2xx
        .then(res => {
            console.info('Just got response')
            console.info('Status Code:', res.statusCode)
            console.info('Body:', res.body)
        })
        // 4xx
        .catch(err => {
            console.error('Response was not get')
            console.error('Status Code:', err.statusCode);
        })
})
```

# ToDo

* HTTP queryies support

* Transparent transfer protocol

* Fire message (client send message to server, bot not waiting for response)

* Client response to server query
