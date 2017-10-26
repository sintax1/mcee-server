const MCSocket = require("./mcsocket");
const MCMessage = require('./mcmessage');
const mcutils = require('./mcutils');
const util = require('util');

var args = process.argv.slice(2);

var port = args[0];

mcproxy = new MCSocket.Server({port: port});

mcproxy.on('listening', function() {
    console.log("Proxy Listening");
    console.log("Connect with: /connect ws://127.0.0.1:" + port);
});

mcproxy.on('connection', function(mcclient) {
    console.log("Client Connected");

    var mcserver = new MCSocket.Client("ws://" + args[1] + ":" + args[2]);

    mcserver.on('open', function() {
        console.log("Server Connected");
    });

    mcserver.on('message', function(msg) {

        console.log("XXXXXXXXXXXXXXXXXX Message XXXXXXXXXXXXXX");
        console.log(msg);
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

        msg = JSON.parse(msg);

        var purpose = msg.header.messagePurpose;

        /*
        if (purpose == "commandRequest") {
            var command = msg.body.commandLine.split(" ")[0];

            if (command == "geteduclientinfo") {
                console.log("[proxy] geteduclientinfo");

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
    
                console.log("sending to mcserver: " + resp.toJson());
                mcserver.send(resp.toJson());

            } else if (command == "enableencryption") {
                console.log("[proxy] enableencryption");

                var resp = new MCMessage();
                resp.header.requestId = msg.header.requestId;
                resp.header.messagePurpose = "commandResponse";
                resp.body.publicKey = mcclient.publicKeyX509;
                resp.body.statusCode = 0;
                resp.body.statusMessage = mcclient.publicKeyX509;

                console.log("sending to mcserver: " + resp.toJson());
                mcserver.send(resp.toJson());
            }
        }
        */
    });

    /*
    var mcserveremit = mcserver.emit;
    var mcclientemit = mcclient.emit;

    mcserver.emit = function(thisArg) {
        console.log("mcserver hooked emitter");
        var args = Array.prototype.slice.call(arguments, 0);
        console.log(args);
        mcclientemit.apply(mcclient, args);
    }

    mcclient.emit = function(thisArg) {
        console.log("mcclient hooked emitter");
        var args = Array.prototype.slice.call(arguments, 0);
        console.log(args);
        mcserveremit.apply(mcserver, args);
    }
    */

});

mcproxy.on('close', function() {
    console.log("Server Shutdown");
});

/*
var wssemit = this.wss.emit;
this.wss.emit = function(thisArg) {
    console.log("hooked emitter");
    var args = Array.prototype.slice.call(arguments, 0);
    self.emit.apply(self, args);
    wssemit.apply(self.wss, args);
}
*/
