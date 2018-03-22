const sockrest = require('../index.js')

const app = sockrest.listen(3000)

app.on('user-connected', connection => {
    console.info('User connected')

    const token = connection.token
    if (!token) {
        connection.deny()
    }
    const user = {
        name: 'Default Username',
    }

    connection.setUser(token, user)
    connection.allow()
})
app.on('user-disconnected', connection => {
    console.info(`User disconnected: ${connection.user.id} has now ${connection.user.connections.length} connections`)
})
app.on('user-allowed', connection => {
    console.info(`User allowed: ${connection.user.id}, ${connection.user.name} has now ${connection.user.connections.length} connections`)
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