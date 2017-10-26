const MCMessage = require('./mcmessage');
const MCWebSocket = require("./MCWebSocket");
const MCWebSocketServer = require("./MCWebSocketServer");

var args = process.argv.slice(2);
var port = args[0];

var clients = {};

mcproxy = new MCWebSocketServer({port: port});

mcproxy.on('listening', function() {
    console.log("Server Listening\n");
    console.log("Connect with: /connect ws://127.0.0.1:" + port + "\n");
});

mcproxy.on('connection', function(mcclient) {
    var self = this;

    console.log("Client connected\n");

    clients[mcclient.playersessionuuid] = mcclient;

    mcclient.on('end', function() {
        delete clients[mcclient.playersessionuuid];
    });

    var msg = new MCMessage();
    msg.header.messagePurpose = "commandRequest";
    msg.body.origin = {type : "player"};
    msg.body.commandLine = "geteduclientinfo";
    msg.body.version = 1;

    mcclient.MessageProcessor.registerResponseHandler(msg.header.requestId, function(msg) {
        //console.log(msg);
        mcclient.uuid = msg.body.clientuuid;
        mcclient.playersessionuuid = msg.body.playersessionuuid;
        mcclient.userId = msg.body.userId;

        var msg = new MCMessage();
        msg.header.messagePurpose = "commandRequest";
        msg.body.origin = { type : "player" };
        msg.body.commandLine = "enableencryption \"" + mcclient.publicKeyX509 + "\" \"" + mcclient.salt.toString('base64') + "\"";

        mcclient.MessageProcessor.registerResponseHandler(msg.header.requestId, function(msg) {
            //console.log(msg);
            mcclient.enableEncryption(msg.body.publicKey, null);
        });
        mcclient.send(msg.toJson());
    });
    mcclient.send(msg.toJson());

    var forwardToServer = function(msg) {
        //console.log("Client -> Server\n" + msg.toString());
        self.mcserver.send(msg);
    }

    var forwardToClient = function(msg) {
        //console.log("Server -> Client\n" + msg.toString());
        mcclient.send(msg);
    }

    mcclient.on('ready', function() {
        console.log("Client Ready");

        /* Connect to server */
        self.mcserver = new MCWebSocket("ws://127.0.0.1:" + args[1], {
          perMessageDeflate: false
        });

        self.mcserver.MessageProcessor.registerCommandHandler('geteduclientinfo', function(msg) {
            //console.log("geteduclientinfo: " + JSON.stringify(msg));

            var resp = new MCMessage();
            resp.header.requestId = msg.header.requestId;
            resp.header.messagePurpose = "commandResponse";
            //resp.body.clientuuid = self.mcserver.uuid;
            resp.body.clientuuid = mcclient.uuid;
            resp.body.companionProtocolVersion = 3;
            resp.body.isEdu = true;
            resp.body.isHost = true;
            //resp.body.playersessionuuid = self.mcserver.playersessionuuid;
            resp.body.playersessionuuid = mcclient.playersessionuuid;
            resp.body.statusCode = 0;
            //resp.body.userId = self.mcserver.userId;
            resp.body.userId = mcclient.userId;
            resp.body.tenantId = 'a82cd1c1-d2a6-4217-9e1a-18dd5fdb4cf2';

            self.mcserver.send(resp.toJson());
        });

        self.mcserver.MessageProcessor.registerCommandHandler('enableencryption', function(msg) {
            //console.log("enableencryption: " + JSON.stringify(msg));

            var encData = msg.body.commandLine.split(" ");
            var peerPublicKey = encData[1];
            var salt = encData[2];

            var resp = new MCMessage();
            resp.header.requestId = msg.header.requestId;
            resp.header.messagePurpose = "commandResponse";
            resp.body.publicKey = self.mcserver.publicKeyX509;
            resp.body.statusCode = 0;
            resp.body.statusMessage = self.mcserver.publicKeyX509;

            self.mcserver.send(resp.toJson());

            self.mcserver.enableEncryption(peerPublicKey, salt);
        });

        self.mcserver.on('ready', function() {
            console.log("Server Ready");

            mcclient.on('message', forwardToServer);        
            self.mcserver.on('message', forwardToClient);
        });

        self.mcserver.on('open', function() {
            console.log("Server Connected\n");
        });

        self.mcserver.on('error', function(err) {
            console.log("server Error: " + err + "\n");
        });
    });
});

mcproxy.on('close', function() {
    console.log("Proxy Shutdown\n");
});

