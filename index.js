const _ = require('lodash')

const colors = require('colors/safe')
const router = require('./router/index')
const engine = require('engine.io')

/* Definition */
module.exports = {
    listen,
    attach,
}


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

    'SUBSCRIBE',
    'UNSUBSCRIBE',

    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
]

function startListening(httpServer) {
    let server = engine.attach(httpServer)
    let app = router()

    app.on = server.on

    server.on('connection', function(connection){
        // connection.send('hi') // this can be some information for client

        let abstractReq = {
            server,
            connection,
            app,
        }
        let abstractRes = {
            statusCode: 200,
            headers: [],
        }

        /**
         * Request struct:
         * data[0] is request unique ID. Is created to check if correct response is sending.
         * data[1] is request type [fire, get, post, put, patch, delete]
         * data[2] is request path. Ex.: /us/url
         * data[3] is object of headers { content-type: 'XML', content-length: 500 }
         * data[4] is body, can contain any data client sends
         * 
         * Response struct:
         * data[0] is request unique ID
         * data[1] is response HTTP code
         * data[2] is object of headers { content-type: 'XML', content-length: 500 }
         * data[3] is body, can contain any data client sends
         */
        connection.on('message', data => {
            try {
                data = JSON.parse(data)
            }
            catch(err) {
                return
            }
            let requestType = String(data[1]).toUpperCase()
            let isSupportedRequestType = supportedRequestTypes.indexOf(requestType) !== -1

            if (!isSupportedRequestType) {
                // ignore for now
                return
            }

            let req = _.clone(abstractReq)
            let res = {}

            req.requestId = RequestId(data[0])

            req.method = String(data[1]).toUpperCase()
            req.url = res.path = data[2]
            req.headers = data[3]
            req.body = data[4]
            req.params = []

            if (requestType !== supportedRequestTypes[0]) {
                res = _.clone(abstractRes)

                res.requestId = RequestId(data[0])

                res.headers = {}
                res.send = res.end = function send() {
                    let statusCode = res.statusCode
                    let body = arguments[0]
                    if (arguments.length === 2) {
                        statusCode = arguments[0]
                        body = arguments[1]
                    }

                    let data = []

                    data[0] = res.requestId
                    data[1] = statusCode
                    data[2] = res.headers
                    data[3] = body

                    connection.send(JSON.stringify(data))
                }
                res.setHeader = function(name, value) {
                    res.headers[name] = value
                }
                res.unsetHeader = function(name) {
                    res.headers[name] = undefined
                }
            }
            if (requestType === supportedRequestTypes[0]) {
                res.send = res.end = function() {
                    console.warn('Response sending not supported for NOTIFY')
                }
            }

            console.info(colors.green(req.method + ':'), req.url)
            app.handle(req, res)
        })
    })

    return app
}

// Model
function RequestId(obj) {
    return _.toString(obj)
}
