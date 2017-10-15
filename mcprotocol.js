const MCEvents = require('./mcevents');
const mcutils = require('./mcutils');
const crypto = require('crypto');

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

var MCProtocol = function() {
    var self = this;
    
    this.ec = crypto.createECDH('secp384r1');
    this.ec.generateKeys();

    this.requestHandlers = {};
    this.responseHandlers = {};
    this.events = new MCEvents();
    this.encryptionEnabled = false;
    this.uuid = mcutils.uuid();
    this.publicKey = this.ec.getPublicKey();
    this.publicKeyX509 = mcutils.writeX509PublicKey(this.publicKey);
    this.salt = crypto.randomBytes(16);
    this.cipher = null;
    this.decipher = null;

    MCRequestCommands.forEach(function(commandName) {
        self.requestHandlers[commandName] = function(msg) {
            console.log("Generic Request Handler: " + JSON.stringify(msg));
        };
    });
}

MCProtocol.prototype.enableEncryption = function(peerPublicKey, salt) {
    if(!salt) salt = this.salt;

    var sharedSecret = this.ec.computeSecret(mcutils.readX509PublicKey(peerPublicKey));
    var secretKey = crypto.createHash('sha256').update(salt).update(sharedSecret).digest();
    this.cipher = crypto.createCipheriv('aes-256-cfb8', secretKey, secretKey.slice(0,16));
    this.decipher = crypto.createDecipheriv('aes-256-cfb8', secretKey, secretKey.slice(0,16));

    this.encryptionEnabled = true;
}

MCProtocol.prototype.processMessage = function(msg) {

    if (this.encryptionEnabled) {
        msg = this.decipher.update(msg);
    }
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

MCProtocol.prototype.formatMessage = function(msg) {
    console.log(msg.toJson());
    if (this.encryptionEnabled) {
        return this.cipher.update(msg.toJson());    
    }
    return msg.toJson();
}

MCProtocol.prototype.registerRequestHandler = function(commandName, handler) {
    console.log("Registering Request handler for Command: " + commandName);
    this.requestHandlers[commandName] = handler;
}

MCProtocol.prototype.registerResponseHandler = function(requestId, handler) {
    console.log("Registering Response handler for Command: " + requestId);
    this.responseHandlers[requestId] = handler;
}

MCProtocol.prototype.processRequest = function(commandName, msg) {
    if(commandName in this.requestHandlers) {
        console.log("MC Request handler found: " + commandName);
        return this.requestHandlers[commandName](msg);
    }
     
    console.log("MC Request Handler not found: " + commandName);
}

MCProtocol.prototype.processResponse = function(msg) {
    var requestId = msg.header.requestId;
    if(requestId in this.responseHandlers) {
        console.log("MC Response handler found: " + requestId);
        return this.responseHandlers[requestId](msg);
    }
     
    console.log("MC Response Handler not found: " + requestId);
}

module.exports = MCProtocol;
