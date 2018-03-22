const _ = require('lodash')
const sockrest = require('../index.js')
const { User } = sockrest

const app = sockrest.listen(3000)

app.auth(connection => {
    const user = {
        name: 'Default Username',
    }
    const token = connection.token || _.uniqueId()
    return new User(connection, token, user)
})
app.on('user-connected', connection => {
    console.info('User connected')
})
app.on('user-disconnected', connection => {
    console.info('User disconnected')
})
app.on('user-allowed', connection => {
    console.info(`User allowed: ${connection.user.id}, ${connection.user.name}`)
})

app.use((req, res, next) => {
    console.info('first middleware', req.body)
    next()
})

app.get('/', (req, res, next) => {
    console.info(`GET: ${req.url}`)

    res.send(200, { message: 'Hello, World!' })
})

app.post('/posts', (req, res, next) => {
    console.info(`POST: ${req.url}`)

    res.send(201, { message: 'Awsome', object: req.body })
})
app.notify('/yes', (req, res, next) => {
    console.info(req.body)
})
// middleware that hendle errors
app.use((err, req, res, next) => {
    console.error(err.message)
})

console.log('App runs')