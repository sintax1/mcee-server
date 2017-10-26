const util = require('util');
const mcutils = require('./mcutils');
const MCMessage = require('./mcmessage');

function MCMessageProcessor(ws) {

    var self = this;

    this.requestHandlers = {};
    this.responseHandlers = {};

    this.ws = ws;

    this.ws.on('ready', function() {
        // Handshake complete
    });

    this.ws.on('message', function(msg) {
        self.processMessage(msg);
    });

    this.registerRequestHandler('closewebsocket', function(msg) {
        console.log("closing socket");
        self.ws.close();
    });

    this.registerRequestHandler('geteduclientinfo', function(msg) {
        console.log("geteduclientinfo: " + JSON.stringify(msg));

        var resp = new MCMessage();
        resp.header.requestId = msg.header.requestId;
        resp.header.messagePurpose = "commandResponse";
        resp.body.clientuuid = self.ws.uuid;
        resp.body.companionProtocolVersion = 3;
        resp.body.isEdu = true;
        resp.body.isHost = true;
        resp.body.playersessionuuid = self.ws.playersessionuuid;
        resp.body.statusCode = 0;
        resp.body.userId = self.ws.userId;
        resp.body.tenantId = 'a82cd1c1-d2a6-4217-9e1a-18dd5fdb4cf2';

        self.ws.send(resp.toJson());
    });

    this.registerRequestHandler('enableencryption', function(msg) {
        console.log("enableencryption: " + JSON.stringify(msg));

        var encData = msg.body.commandLine.split(" ");
        var peerPublicKey = encData[1];
        var salt = encData[2];

        var resp = new MCMessage();
        resp.header.requestId = msg.header.requestId;
        resp.header.messagePurpose = "commandResponse";
        resp.body.publicKey = self.ws.publicKeyX509;
        resp.body.statusCode = 0;
        resp.body.statusMessage = self.ws.publicKeyX509;

        self.ws.send(resp.toJson());

        self.ws.enableEncryption(peerPublicKey, salt);
    });
}

MCMessageProcessor.prototype.registerRequestHandler = function(commandName, handler) {
    this.requestHandlers[commandName] = handler;
}

MCMessageProcessor.prototype.registerResponseHandler = function(requestId, handler) {
    this.responseHandlers[requestId] = handler;
}

MCMessageProcessor.prototype.processRequest = function(msg) {

    var messagetype = msg.header.messageType;

    switch(messagetype) {
        case "commandRequest":
            var command;
            try {
                command = msg.body.commandLine.split(" ")[0];
            } catch(err) {
                command = msg.body.name.split(" ")[0];
            }

            if(command in this.requestHandlers) {
                this.requestHandlers[command](msg);
            }
            break;
        default:
            break;
    }
}

MCMessageProcessor.prototype.processResponse = function(msg) {
    var requestId = msg.header.requestId;

    if(requestId in this.responseHandlers) {
        this.responseHandlers[requestId](msg);
    }
}

MCMessageProcessor.prototype.processMessage = function(msg) {

    msg = JSON.parse(msg);

    var messagepurpose = msg.header.messagePurpose;

    switch(messagepurpose) {
        case "commandRequest":
            this.processRequest(msg);
            break;

        case "commandResponse":
            this.processResponse(msg);
            break;

        case "error":
            console.log("Error: " + JSON.stringify(msg));
            break;

        default:
            console.log("Unknown messagePurpose: " + messagepurpose);
    }
}

module.exports = MCMessageProcessor;
