const _ = require('lodash')
const parseUrl = require('url-parse')

const User = require('./user/index.js')

const colors = require('colors/safe')
const router = require('./router/index')
const engine = require('engine.io')

/* Definition */
module.exports = {
    listen,
    attach,
    User,
}

let AUTH_TIME = 3000

/* Public */
function listen(port) {
    let httpServer = require('http').createServer().listen(port)
    return startListening(httpServer)
}
function attach(httpServer) {
    return startListening(httpServer)
}

/* Private */
const supportedRequestTypes = [
    'NOTIFY',

    // 'SUBSCRIBE',
    // 'UNSUBSCRIBE',

    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
]

function startListening(httpServer) {
    const app = router()
    const server = engine.attach(httpServer, {
        allowRequest: (params, cb) => {
            params.token = null
            if (params.url.indexOf('?') >= 0) {
                const urlData = parseUrl(params.url, true)
                params.token = urlData.query.token || null
            }

            return cb(undefined, true)
        }
    })

    app.on = server.on
    app.emit = server.emit

    app.setAuthTime = setAuthTime

    server.on('connection', function(connection){
        connection.allow = () => allow()
        connection.deny = () => deny()
        connection.token = connection.request.token
        connection.setUser = (id, user) => {
            const _user = new User(connection, id, user)
            attachUser(connection, _user)
        }

        let timer = null
        if (AUTH_TIME) {
            timer = setTimeout(() => connection.close(), AUTH_TIME)
        }
        
        app.emit('user-connected', connection)

        function allow() {
            app.emit('user-allowed', connection)
            fakeAuth(connection)
            connection.on('message', message)

            clearTimeout(timer)

            connection.allow = connection.deny = () => {}
        }
        function deny() {
            app.emit('user-denied', connection)
            connection.close()

            connection.allow = connection.deny = () => {}
        }

        connection.on('close', disconnect)

        let abstractReq = {
            server,
            app,
        }
        
        const abstractRes = {
            statusCode: 200,
            headers: {},
        }

        /**
         * Request struct:
         * data[0] is request unique ID. Is created to check if correct response is sending.
         * data[1] is request type [NOTIFY, GET, POST, PUT, PATCH, DELETE]
         * data[2] is request path. Ex.: /us/url
         * data[3] is object of headers { content-type: 'XML' }
         * data[4] is body, can contain any data client sends
         *
         * Response struct:
         * data[0] is request unique ID
         * data[1] is response HTTP code
         * data[2] is object of headers { content-type: 'application/json' }
         * data[3] is body, can contain any data client sends
         */
        function message(data) {
            try {
                data = JSON.parse(data)
            }
            catch(err) {
                return
            }
            const requestType = String(data[1]).toUpperCase()

            let req = _.clone(abstractReq)
            Object.defineProperties(req, {
                connection: { get: () => connection },
                user: { get: () => connection.user },
            })
            req.requestId = RequestId(data[0])
            req.method = String(data[1]).toUpperCase()
            req.url = req.path = data[2]
            req.headers = data[3]
            req.body = data[4]
            req.params = []

            let res = _.clone(abstractRes)
            res.requestId = RequestId(data[0])
            res.send = res.end = function send() {
                let statusCode = res.statusCode
                let body = arguments[0]
                if (arguments.length === 2) {
                    statusCode = arguments[0]
                    body = arguments[1]
                }

                connection.send(JSON.stringify([
                    res.requestId,
                    statusCode,
                    res.headers,
                    body,
                ]))
            }
            res.setHeader = function setHeader(name, value) {
                res.headers[name] = value
            }
            res.unsetHeader = function unserHeader(name) {
                res.headers[name] = undefined
            }

            if (requestType === supportedRequestTypes[0]) {
                res.send = res.end = function() {
                    connection.send(JSON.stringify([
                        res.requestId,
                        202,
                        res.headers,
                        '',
                    ]))
                }
            }

            console.info(colors.green(req.method + ':'), req.url)

            if (supportedRequestTypes.indexOf(requestType) === -1) {
                res.statusCode = 501
                res.send()
            } else {
                app.handle(req, res)
            }
        }

        function disconnect(reason, description) {
            connection.user.close()
            app.emit('user-disconnected', connection, reason, description)
        }
    })

    return app
}

// Model
function RequestId(obj) {
    return _.toString(obj)
}

function fakeAuth(connection) {
    if (!connection.user) {
        let user = new User(connection, _.uniqueId(), {})
        attachUser(connection, user)
    }
}

function setAuthTime(time) {
    AUTH_TIME = Number(time)
}

function attachUser(connection, user) {
    if (user instanceof User) {
        Object.defineProperties(connection, {
            user: { writable: false, value: user },
            userId: { get: () => user.id },
        })
        return connection
    } else {
        throw new Error('Authorization requires User instance to be returned by callback')
    }
}
