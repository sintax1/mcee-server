const MCSocket = require("./mcsocket");

var port = 5000;
var clients = {};

mcserver = new MCSocket.Server({port: port});

mcserver.on('listening', function() {
    console.log("Server Listening");
    console.log("Connect with: /connect ws://127.0.0.1:" + port);
});

mcserver.on('connection', function(mcclient) {
    console.log("Client connected");

    clients[playersessionuuid] = mcclient;

    mcclient.on('message', function(msg) {
        console.log("MCClient Message:");
        console.log(msg);
    });

    mcclient.on('end', function() {
        console.log("Client Disconnected");
        delete clients[mcclient.id];
    });

    mcclient.on('error', function(err) {
        console.log("Error:" + err);
    });
});

mcserver.on('close', function() {
    console.log("Server Shutdown");
});
