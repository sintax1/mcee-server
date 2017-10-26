const MCWebSocket = require("./MCWebSocket");
const MCMessage = require('./mcmessage');

//const MCMessageProcessor = require("./MCMessageProcessor");

var args = process.argv.slice(2);
var port = args[0];

var mcclient = new MCWebSocket("ws://127.0.0.1:" + port, {
  perMessageDeflate: false
});

//var mp = new MCMessageProcessor(mcclient);

mcclient.on('open', function() {
    console.log("open");

    mcclient.MessageProcessor.registerCommandHandler('geteduclientinfo', function(msg) {
        console.log("geteduclientinfo: " + JSON.stringify(msg));

        var resp = new MCMessage();
        resp.header.requestId = msg.header.requestId;
        resp.header.messagePurpose = "commandResponse";
        resp.body.clientuuid = mcclient.uuid;
        resp.body.companionProtocolVersion = 3;
        resp.body.isEdu = true;
        resp.body.isHost = true;
        resp.body.playersessionuuid = mcclient.playersessionuuid;
        resp.body.statusCode = 0;
        resp.body.userId = mcclient.userId;
        resp.body.tenantId = 'a82cd1c1-d2a6-4217-9e1a-18dd5fdb4cf2';

        mcclient.send(resp.toJson());
    });

    mcclient.MessageProcessor.registerCommandHandler('enableencryption', function(msg) {
        console.log("enableencryption: " + JSON.stringify(msg));

        var encData = msg.body.commandLine.split(" ");
        var peerPublicKey = encData[1];
        var salt = encData[2];

        var resp = new MCMessage();
        resp.header.requestId = msg.header.requestId;
        resp.header.messagePurpose = "commandResponse";
        resp.body.publicKey = mcclient.publicKeyX509;
        resp.body.statusCode = 0;
        resp.body.statusMessage = mcclient.publicKeyX509;

        mcclient.send(resp.toJson());

        mcclient.enableEncryption(peerPublicKey, salt);
    });
});

mcclient.on('error', function(err) {
    console.log("error: " + err);
});

