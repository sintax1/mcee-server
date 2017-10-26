const WebSocket = require('ws');
const util = require('util');
const MCMessage = require('./mcmessage');
const mcutils = require('./mcutils');
const crypto = require('crypto');
const MCMessageProcessor = require("./MCMessageProcessor");

function MCWebSocket() {
    var args = Array.prototype.slice.call(arguments, 0);
    var ws = Reflect.construct(WebSocket, args, new.target||MCWebSocket);

    ws.MessageProcessor = new MCMessageProcessor(ws);

    ws.on('ready', function() {
        var onmessageOrig = ws._receiver.onmessage;
        ws._receiver.onmessage = function(data) {
            if(ws.encryptionEnabled) {
                data = ws.decipher.update(data);
            }
            console.log("Recv: " + data);
            onmessageOrig(data);
        };
    });

    ws.on('end', function() {
        console.log("Client Disconnected\n");
    });

    ws.on('error', function(err) {
        console.log("Error:" + err + "\n");
    });

    ws.on('ping', function(msg) {
        console.log("ping: " + msg);
    });
    ws.on('pong', function(msg) {
        console.log("pong: " + msg);
    });

    return ws;
}
util.inherits(MCWebSocket, WebSocket);

MCWebSocket.prototype.userId = mcutils.uuid();
MCWebSocket.prototype.playersessionuuid = mcutils.uuid();

MCWebSocket.prototype.uuid = mcutils.uuid();
MCWebSocket.prototype.encryptionEnabled = false;
MCWebSocket.prototype.ec = crypto.createECDH('secp384r1');
MCWebSocket.prototype.ec.generateKeys();
MCWebSocket.prototype.publicKey = MCWebSocket.prototype.ec.getPublicKey();
MCWebSocket.prototype.publicKeyX509 = mcutils.writeX509PublicKey(MCWebSocket.prototype.publicKey);
MCWebSocket.prototype.salt = new Buffer(crypto.randomBytes(16), 'base64');
MCWebSocket.prototype.cipher = null;
MCWebSocket.prototype.decipher = null;

MCWebSocket.prototype.peerPublicKey = null;

MCWebSocket.prototype.send = function(msg) {
    var args = Array.prototype.slice.call(arguments, 0);

    msg = JSON.parse(msg);

    /*
    if (msg.body && msg.body.userId) {
        console.log("Switching userId " + msg.body.userId + " -> " + this.userId);
        msg.body.userId = this.userId;
    }

    if (msg.body && msg.body.clientuuid) {
        console.log("Switching clientuuid " + msg.body.clientuuid + " -> " + this.userId);
        msg.body.clientuuid = this.userId;
    }

    if (msg.body && msg.body.playersessionuuid) {
        console.log("Switching playersessionuuid " + msg.body.playersessionuuid + " -> " + this.playersessionuuid);
        msg.body.playersessionuuid = this.playersessionuuid;
    }

    if (msg.body.properties && msg.body.properties.AppSessionID) {
        console.log("Switching AppSessionID " + msg.body.properties.AppSessionID + " -> " + this.playersessionuuid);
        msg.body.properties.AppSessionID = this.playersessionuuid;
    }

    if (msg.body.properties && msg.body.properties.UserId) {
        console.log("Switching UserId " + msg.body.properties.UserId + " -> " + this.userId);
        msg.body.properties.UserId = this.userId;
    }
    */

    msg = JSON.stringify(msg);

    console.log("Send: " + msg);

    if (this.encryptionEnabled) {
        msg = this.cipher.update(msg);
    }

    MCWebSocket.super_.prototype.send.apply(this, [msg]);
}

MCWebSocket.prototype.enableEncryption = function(peerPublicKey, salt) {
    if(!salt) salt = this.salt;

    this.peerPublicKey = peerPublicKey;
    this.salt = salt;

    var sharedSecret = this.ec.computeSecret(mcutils.readX509PublicKey(peerPublicKey));
    var secretKey = crypto.createHash('sha256').update(new Buffer(salt, 'base64')).update(sharedSecret).digest();
    this.cipher = crypto.createCipheriv('aes-256-cfb8', secretKey, secretKey.slice(0,16));
    this.decipher = crypto.createDecipheriv('aes-256-cfb8', secretKey, secretKey.slice(0,16));

    this.encryptionEnabled = true;
    this.emit('ready');
}

module.exports = MCWebSocket;

