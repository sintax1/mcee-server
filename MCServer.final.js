const MCWebSocketServer = require("./MCWebSocketServer");
const MCMessageProcessor = require("./MCMessageProcessor");
const MCMessage = require('./mcmessage');

var args = process.argv.slice(2);
var port = args[0];

var clients = {};

mcserver = new MCWebSocketServer({port: port});

mcserver.on('listening', function() {
    console.log("Server Listening");
    console.log("Connect with: /connect ws://127.0.0.1:" + port);
});

mcserver.on('connection', function(mcclient) {
    console.log("Client connected");

    clients[mcclient.playersessionuuid] = mcclient;

    //mcclient.MessageProcessor = new MCMessageProcessor(mcclient);

    mcclient.on('message', function(msg) {
        console.log("MCClient Message:");
        console.log(msg);
    });

    mcclient.on('end', function() {
        console.log("Client Disconnected");
        delete clients[mcclient.playersessionuuid];
    });

    mcclient.on('error', function(err) {
        console.log("Error:" + err);
    });

    var msg = new MCMessage();
    msg.header.messageType = "commandRequest";
    msg.header.messagePurpose = "commandRequest";
    msg.body.origin = {type : "player"};
    msg.body.commandLine = "geteduclientinfo";
    msg.body.version = 1;

    mcclient.on('ready', function() {
        console.log("Client Ready");

        setInterval(sendPing, 1000);

        var msg = new MCMessage();
        msg.header.messagePurpose = "commandRequest";
        msg.header.messageType = "commandRequest";
        msg.body.origin = {type : "player"};
        msg.body.commandLine = "listd";
        msg.body.version = 1;
        
        mcclient.send(msg.toJson());

        var msg = new MCMessage();
        msg.header.messagePurpose = "subscribe";
        msg.body.eventName = "PlayerMessage";
        
        mcclient.send(msg.toJson());
    });

    mcclient.MessageProcessor.registerResponseHandler(msg.header.requestId, function(msg) {
        var msg = new MCMessage();
        msg.header.messagePurpose = "commandRequest";
        msg.body.origin = { type : "player" };
        msg.body.commandLine = "enableencryption \"" + mcclient.publicKeyX509 + "\" \"" + mcclient.salt.toString('base64') + "\"";

        mcclient.MessageProcessor.registerResponseHandler(msg.header.requestId, function(msg) {
            mcclient.enableEncryption(msg.body.publicKey, null);
        });

        mcclient.send(msg.toJson());
    });

    mcclient.send(msg.toJson());

    const sendPing = function() {
        const tsBuff = Buffer.allocUnsafe(8);
        var date = new Date();
        var timestamp = date * 10000 + 621355968000000000;
        tsBuff.writeUIntLE(timestamp, 0, 8);

        console.log("send: " + tsBuff.toString('hex'));
        mcclient.emit('ping', tsBuff);
    };
});

mcserver.on('close', function() {
    console.log("Server Shutdown");
});

