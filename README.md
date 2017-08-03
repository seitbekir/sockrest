# sockrest
Realtime socket server that works inhibiting expressJS philosophy

## Features

Sockrest enables real-time bidirectional HTTP like communication. It consists in:

* a Node.js server (this repository)
* a Javascript client library for the browser (or a Node.js client)

# How to use

Server-side implementation

```js
const _ = require('lodash')
const sockrest = require('sockrest')()

sockrest.on('connection', client => {
    // Some code here
})

// middleware applies on each REST query from client
sockrest.use((req, res, next) => {
    console.info(req.body)

    next()
})

sockrest.get('/', (req, res, next) => {
    console.info(`GET: ${req.path}`)

    res.send(200, { message: 'Hello, World!' });
})

sockrest.post('/posts', (req, res, next) => {
    console.info(`POST: ${req.path}`)

    res.send(201, { message: 'Awsome', object: req.body });
})
// middleware that hendle errors
sockrest.use((err, req, res, next) => {
    console.error(err.message)
});

setInterval(() => {
    sockrest.broadcast('message', { message: 'You`ve just got update from server' })
}, 10 * 1000)

sockrest.listen(3000)
```

Client side implementation (Coming soon...)

```js
import SockrestClient from 'sockrest-client'

let client = SockrestClient('ws://127.0.0.1:3000')

client.on('error', (err) => {
    console.error('connection error', err.message)
})

client.on('open', () => {
    client.on('message', res => console.info(res.body.message))

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
