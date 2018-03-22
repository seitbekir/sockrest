const _ = require('lodash')

/* Definition */
module.exports = User

// TMP: make a transport for this using redis
const connections = {}

/* Public */
/**
 * User instance. Has to be returned by auth function.
 * @param {SockrestConnection} connection 
 * @param {string} id 
 * @param {{}} data 
 */
function User(connection, id, data = {}) {
    _.assign(this, data)

    setConnection(id, connection.id)

    Object.defineProperties(this, {
        connection: { writable: false, value: connection },
        connections: { get: () => getConnections(id) },
        id: { writable: false, value: id },
    })
}

User.prototype.close = function() {
    unsetConnection(this.id, this.connection.id)
}

/* Private */
function setConnection(id, connectionId) {
    if (!connections[id]) {
        connections[id] = []
    }
    connections[id].push(connectionId)
}
function unsetConnection(id, connectionId) {
    if (!connections[id]) {
        return
    }
    const index = connections[id].indexOf(connectionId)
    if (index >= 0) {
        _.pullAt(connections[id], index)
    }
}
function getConnections(id) {
    if (connections[id]) {
        return connections[id]
    }
    return []
}
