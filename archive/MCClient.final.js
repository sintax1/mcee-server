const MCWebSocket = require("./MCWebSocket");
const MCMessageProcessor = require("./MCMessageProcessor");

var args = process.argv.slice(2);
var port = args[0];

var mcclient = new MCWebSocket("ws://127.0.0.1:" + port, {
  perMessageDeflate: false
});

var mp = new MCMessageProcessor(mcclient);

mcclient.on('open', function() {
    console.log("open");
});

mcclient.on('error', function(err) {
    console.log("error: " + err);
});

