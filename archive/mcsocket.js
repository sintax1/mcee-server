//const MCEvents = require('./mcevents');
const EventEmitter = require('events').EventEmitter;
const MCMessage = require('./mcmessage');
const mcutils = require('./mcutils');
const crypto = require('crypto');
const util = require('util');

const WebSocket = require('ws');

function MCWebSocket() {

}
util.inherits(MCProtocol, EventEmitter);

/*
function MCProtocol() {

    /*
    this.ws.on('message', function(msg) {
        //console.log("MCProtocol message");
        this.emit('message', this.decrypt(msg));
    });

    this.ws.on('error', function(err) {
        this.emit('error', err);
    });
    */
}
util.inherits(MCProtocol, EventEmitter);

MCProtocol.prototype.send = function(data, option){
    try{
        this.ws.send(this.encrypt(data), option);
    } catch (e){
        this.ws.emit('error', e);
    }
}

MCProtocol.prototype.decrypt = function (msg) {
    console.log("MCProtocol.prototype.decrypt");

    if (this.encryptionEnabled) {
        msg = this.decipher.update(msg);
    }

    console.log(this.publicKeyX509);

    return msg;
}

MCProtocol.prototype.encrypt = function (msg) {
    console.log("MCProtocol.prototype.encrypt");

    //console.log(msg);

    if (this.encryptionEnabled) {
        msg = this.cipher.update(msg);
    }

    return msg;
}

MCProtocol.prototype.enableEncryption = function(peerPublicKey, salt) {
    console.log("Enable Encryption");
    if(!salt) salt = this.salt;

    var sharedSecret = this.ec.computeSecret(mcutils.readX509PublicKey(peerPublicKey));
    var secretKey = crypto.createHash('sha256').update(salt).update(sharedSecret).digest();
    this.cipher = crypto.createCipheriv('aes-256-cfb8', secretKey, secretKey.slice(0,16));
    this.decipher = crypto.createDecipheriv('aes-256-cfb8', secretKey, secretKey.slice(0,16));

    this.encryptionEnabled = true;
}

MCProtocol.prototype.processMessage = function(msg) {

    msg = JSON.parse(this.decrypt(msg));

    console.log("> Received:" + JSON.stringify(msg));

    var purpose = msg.header.messagePurpose;

    switch(purpose) {
        case "commandRequest":
            var commandLine = msg.body.commandLine.split(" ");

            if (commandLine[0] == "enableencryption") {

                // Enable encryption as Server

                //console.log("Enabling Encryption");

                var resp = new MCMessage();
                resp.header.requestId = msg.header.requestId;
                resp.header.messagePurpose = "commandResponse";
                resp.body.publicKey = this.publicKeyX509;
                resp.body.statusCode = 0;
                resp.body.statusMessage = this.publicKeyX509;

                this.send(resp.toJson());
                this.enableEncryption(commandLine[1], commandLine[2]);
            } else if (commandLine[0] == "geteduclientinfo") {

                // Get client info

                var resp = new MCMessage();
                resp.header.requestId = msg.header.requestId;
                resp.header.messagePurpose = "commandResponse";
                resp.body.clientuuid = this.uuid;
                resp.body.companionProtocolVersion = 3;
                resp.body.isEdu = true;
                resp.body.isHost = true;
                resp.body.playersessionuuid = this.playersessionuuid;
                resp.body.statusCode = 0;
                resp.body.userId = this.userId;
                resp.body.tenantId = 'a82cd1c1-d2a6-4217-9e1a-18dd5fdb4cf2';

                this.send(resp.toJson());
            } else if (commandLine[0] == "closewebsocket") {

                // Close session

                //console.log("Closing socket");
                this.ws.close();
            };

            break;

        case "commandResponse":

            // Enable encryption as Client

            if (msg.body.publicKey) {
                //console.log("Enabling Encryption");
                this.enableEncryption(msg.body.publicKey);
            }
            break;

        case "subscribe":
            //console.log("subscribe");
            //this.events.subscribe(msg.body.eventName);
            break;

        case "unsubscribe":
            //console.log("unsubscribe");
            //this.events.unsubscribe(msg.body.eventName);
            break;

        case "event":
            //console.log("event");
            //this.events.processEvent(msg.body.eventName, msg);
            break;

        case "error":
            //console.log("error");
            ////console.log("Received Error: " + JSON.stringify(msg));
            break;
    
        default:
            //console.log("Unknown messagePurpose: " + purpose);
    }

    this.emit('message', JSON.stringify(msg));
}

MCProtocol.prototype.uuid = mcutils.uuid();
MCProtocol.prototype.encryptionEnabled = false;
MCProtocol.prototype.ec = crypto.createECDH('secp384r1');
MCProtocol.prototype.ec.generateKeys();
MCProtocol.prototype.publicKey = MCProtocol.prototype.ec.getPublicKey();
MCProtocol.prototype.publicKeyX509 = mcutils.writeX509PublicKey(MCProtocol.prototype.publicKey);
MCProtocol.prototype.salt = new Buffer(crypto.randomBytes(16), 'base64');
MCProtocol.prototype.cipher = null;
MCProtocol.prototype.decipher = null;

function MCClient(arg) {
    const WebSocket = require('ws');

    var self = this;

    this.userId = mcutils.uuid();
    this.playersessionuuid = mcutils.uuid();

    if (arg instanceof WebSocket) {
        // Wrap existing websocket
        //console.log("MCClient received socket");
        this.ws = arg;
    } else {
        // Create new websocket
        this.ws = new WebSocket(arg, '', {protocol:'com.microsoft.minecraft.wsencrypt', perMessageDeflate: false});
    }

    this.ws.on('open', function() {
        //console.log("MCClient open");
        self.emit('open');
    });

    this.ws.on('message', function (msg) {
        //console.log("MCClient message");
        self.processMessage(msg);
        //self.emit('message', msg);
    });

    this.ws.on('end', function() {
        //console.log("MCClient end");
    });

    this.ws.on('error', function(err) {
        //console.log("MCClient Client Error:" + err);
    });
}
util.inherits(MCClient, MCProtocol);

function MCServer(options) {

    const WebSocketServer = require('ws').Server;

    var self = this;

    this.wss = new WebSocketServer(options);

    var wssemit = this.wss.emit;
    this.wss.emit = function(thisArg) {
        //console.log("hooked emitter");
        var args = Array.prototype.slice.call(arguments, 0);

        //console.log(args[0]);

        if(args[0] == 'connection') {
            //console.log("Connection received: " + args[1]._socket.remoteAddress);

            var mcs = new MCClient(args[1]);

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

            args[1] = mcs;
        }

        self.emit.apply(self, args);
        //wssemit.apply(self.wss, args);
    }
}
util.inherits(MCServer, EventEmitter);

exports.Server = MCServer;
exports.Client = MCClient;
*/
