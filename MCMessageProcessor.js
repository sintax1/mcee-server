const util = require('util');
const mcutils = require('./mcutils');
const MCMessage = require('./mcmessage');

function MCMessageProcessor(ws) {

    var self = this;

    this.commandHandlers = {};
    this.responseHandlers = {};

    this.ws = ws;

    /*
    this.ws.on('ready', function() {
        // Handshake complete
    });
    */

    this.ws.on('message', function(msg) {
        if (!self.ws.encryptionEnabled) {
            console.log("Recv: " + msg);
        }
        self.processMessage(msg);
    });

    this.registerCommandHandler('closewebsocket', function(msg) {
        console.log("closing socket");
        self.ws.close();
    });
}

MCMessageProcessor.prototype.registerCommandHandler = function(commandName, handler) {
    this.commandHandlers[commandName] = handler;
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
                // Classroom Connection
                command = msg.body.commandLine.split(" ")[0];
            } catch(err) {
                // Code Connection
                command = msg.body.name.split(" ")[0];
            }

            if(command in this.commandHandlers) {
                this.commandHandlers[command](msg);
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
            //console.log("Unknown messagePurpose: " + messagepurpose);
    }
}

module.exports = MCMessageProcessor;
