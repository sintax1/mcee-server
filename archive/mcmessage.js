const mcutils = require("./mcutils");

var MCMessage = function() {
    this.body = {}
    this.header = {
        requestId : mcutils.uuid(),
        version : 1
    }
}

MCMessage.prototype.toJson = function() {
    return JSON.stringify(this);
}

MCMessage.prototype.createRequestMessage = function(messagePurpose) {
    return MCRequests[messagePurpose];
}

module.exports = MCMessage;
