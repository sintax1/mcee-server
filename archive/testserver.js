const MCWebSocketServer = require("./MCWebSocketServer");
var util = require('util');
var mcutils = require('./mcutils');
const MCMessage = require('./mcmessage');

var args = process.argv.slice(2);
var port = args[0];

var mcserver = new MCWebSocketServer({port: port});

mcserver.on('listening', function() {
    console.log("listening: " + port);
});

mcserver.on('connection', function(mcclient) {

    console.log("Connection received: " + args[1]._socket.remoteAddress);

    var getInfoMsg = new MCMessage();
    getInfoMsg.header.messagePurpose = "commandRequest";
    getInfoMsg.body.origin = { type : "player" };
    getInfoMsg.body.commandLine = "geteduclientinfo";
    getInfoMsg.body.version = 1;
    mcs.send(getInfoMsg.toJson());

    var enableEncryptionMsg = new MCMessage();
    enableEncryptionMsg.header.messagePurpose = "commandRequest";
    enableEncryptionMsg.body.origin = { type : "player" };
    enableEncryptionMsg.body.commandLine = "enableencryption \"" + mcs.publicKeyX509 + "\" \"" + mcs.salt.toString('base64') + "\"";
    mcs.send(enableEncryptionMsg.toJson());


});

mcserver.on('error', function(err) {
    console.log("error: " + err);
});

/*


    this.registerRequestHandler('geteduclientinfo', function(msg) {
        var resp = new MCMessage();
        resp.header.requestId = msg.header.requestId;
        resp.header.messagePurpose = "commandResponse";
        resp.body.clientuuid = self.uuid;
        resp.body.companionProtocolVersion = 3;
        resp.body.isEdu = true;
        resp.body.isHost = true;
        resp.body.playersessionuuid = self.playersessionuuid;
        resp.body.statusCode = 0;
        resp.body.userId = self.userId;
        resp.body.tenantId = 'a82cd1c1-d2a6-4217-9e1a-18dd5fdb4cf2';

        mcserver.send(resp.toJson());
    });

    this.registerRequestHandler('enableencryption', function(msg) {
        var encData = msg.body.commandLine.split(" ");
        var peerPublicKey = encData[1];
        var salt = encData[2];

        var resp = new MCMessage();
        resp.header.requestId = msg.header.requestId;
        resp.header.messagePurpose = "commandResponse";
        resp.body.publicKey = self.mcproto.publicKeyX509;
        resp.body.statusCode = 0;
        resp.body.statusMessage = self.mcproto.publicKeyX509;

        mcserver.send(resp.toJson());

        self.mcproto.enableEncryption(peerPublicKey, salt);
    });


            console.log("init");
            var msg = new MCMessage();
            msg.header.messagePurpose = "commandRequest";
            msg.body.origin = { type : "player" };
            msg.body.commandLine = "geteduclientinfo";
            msg.body.version = 1;
            
            ws.mcproto.registerResponseHandler(msg.header.requestId, function(msg) {
                console.log("enableencryption");
                var msg = new MCMessage();
                msg.header.messagePurpose = "commandRequest";
                msg.body.origin = { type : "player" };
                msg.body.commandLine = "enableencryption \"" + mcutils.writeX509PublicKey(ws.mcproto.publicKey) + "\" \"" + ws.mcproto.salt.toString('base64') + "\"";

                ws.mcproto.registerResponseHandler(msg.header.requestId, function(msg) {
                    ws.mcproto.enableEncryption(msg.body.publicKey, null);
                    self.emit('ready', ws);
                });

                console.log("Sending: " + msg.toJson());
                ws.send(ws.mcproto.formatMessage(msg));
            });

            console.log("Sending: " + msg.toJson());
            ws.send(ws.mcproto.formatMessage(msg));
        });
    }
}
util.inherits(exports.Server, EventEmitter);

const MCEvents = require('./mcevents');
const mcutils = require('./mcutils');
const crypto = require('crypto');
const stream = require("stream");
const util = require('util');

const MCRequestCommands = [
    'listd', 
    'time query daytime',
    'gamerule',
    'globalpause',
    'immutableworld',
    'closewebsocket',
    'geteduclientinfo',
    'enableencryption'
];

function MCClient() {

    MCRequestCommands.forEach(function(commandName) {
        self.requestHandlers[commandName] = function(msg) {
            console.log("Generic Request Handler: " + JSON.stringify(msg));
        };
    });

    if (msg.header.messagePurpose == "commandResponse" && msg.body.publicKey) {
        console.log("Enabling Encryption: " + JSON.stringify(msg));
        this.enableEncryption(msg.body.publicKey);
    }

    if (msg.header.messagePurpose == "commandRequest" && msg.body.commandLine.split(" ")[0] == "enableencryption") {
        console.log("Enabling Encryption: " + JSON.stringify(msg));
        var encData = msg.body.commandLine.split(" ");
        this.enableEncryption(encData[1], encData[2]);
    }

}
util.inherits(MCClient, MCWebSocket);

MCClient.prototype.enableEncryption = function(peerPublicKey, salt) {
    if(!salt) salt = new Buffer(this.salt, 'base64');

    var sharedSecret = this.ec.computeSecret(mcutils.readX509PublicKey(peerPublicKey));
    var secretKey = crypto.createHash('sha256').update(salt).update(sharedSecret).digest();
    this.cipher = crypto.createCipheriv('aes-256-cfb8', secretKey, secretKey.slice(0,16));
    this.decipher = crypto.createDecipheriv('aes-256-cfb8', secretKey, secretKey.slice(0,16));

    this.encryptionEnabled = true;
}

MCClient.prototype.processMessage = function(msg) {

    msg = JSON.parse(msg);

    console.log("> Received:" + JSON.stringify(msg));

    var purpose = msg.header.messagePurpose;

    switch(purpose) {
        case "commandRequest":
            var command = msg.body.commandLine.split(" ")[0];
            return this.processRequest(command, msg);
            break;

        case "commandResponse":
            this.processResponse(msg);
            break;

        case "subscribe":
            this.events.subscribe(msg.body.eventName);
            break;

        case "unsubscribe":
            this.events.unsubscribe(msg.body.eventName);
            break;

        case "event":
            this.events.processEvent(msg.body.eventName, msg);
            break;

        case "error":
            console.log("Received Error: " + JSON.stringify(msg));
            break;
    
        default:
            console.log("Unknown messagePurpose: " + purpose);
    }
}

MCClient.prototype.registerRequestHandler = function(commandName, handler) {
    console.log("Registering Request handler for Command: " + commandName);
    this.requestHandlers[commandName] = handler;
}

MCClient.prototype.registerResponseHandler = function(requestId, handler) {
    console.log("Registering Response handler for Command: " + requestId);
    this.responseHandlers[requestId] = handler;
}

MCClient.prototype.processRequest = function(commandName, msg) {
    if(commandName in this.requestHandlers) {
        console.log("MC Request handler found: " + commandName);
        return this.requestHandlers[commandName](msg);
    }
     
    console.log("MC Request Handler not found: " + commandName);
}

MCClient.prototype.processResponse = function(msg) {
    var requestId = msg.header.requestId;
    if(requestId in this.responseHandlers) {
        console.log("MC Response handler found: " + requestId);
        return this.responseHandlers[requestId](msg);
    }
     
    console.log("MC Response Handler not found: " + requestId);
}

exports.MCClient = MCClient;
