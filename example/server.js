const sockrest = require('../index.js')

const app = sockrest.listen(3000)

// app.user('connection', connection => {
//     console.info('User connected')
// })
// app.user('disconnect', connection => {
//     console.info('User disconnected')
// })

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