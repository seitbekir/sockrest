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
    app.emit = server.emit;

    server.on('connection', function(connection){
        app.emit('connection', connection);

        let abstractReq = {
            server,
            connection,
            app,
        }
        const abstractRes = {
            statusCode: 200,
            headers: {},
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

            let req = _.clone(abstractReq)
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
                ]));
            }
            res.setHeader = function(name, value) {
                res.headers[name] = value
            }
            res.unsetHeader = function(name) {
                res.headers[name] = undefined
            }

            if (requestType === supportedRequestTypes[0]) {
                res.send = res.end = function() {
                    connection.send(JSON.stringify([
                        res.requestId,
                        202,
                        res.headers,
                        '',
                    ]));
                }
            }

            console.info(colors.green(req.method + ':'), req.url)

            if (supportedRequestTypes.indexOf(requestType) === -1) {
                res.statusCode = 501;
                res.send();
            } else {
                app.handle(req, res);
            }
        })
    })

    return app
}

// Model
function RequestId(obj) {
    return _.toString(obj)
}
