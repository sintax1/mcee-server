const MCServer = require("./mc").Server;
const MCMessage = require("./mcmessage");
var mc = new MCServer();

var args = process.argv.slice(2);

var events = [
    "PlayerTransform",
    "ChunkChanged",
    "ChunkLoaded",
    "PlayerJoin",
    "PlayerLeave",
    "PlayerMessage",
    "MultiplayerRoundEnd"
]

var commands = [
    "listd",
    "time query daytime",
    "gamerule",
    "globalpause",
    "immutableworld"
]

mc.on('ready', function(mcclient) {
    events.forEach(function(eventName) {
        mcclient.registerEvent(eventName, function(msg) {
            console.log(JSON.stringify(msg));
        });
    });    
    commands.forEach(function(command) {
        mcclient.sendCommand(command, function(msg) {
            console.log(JSON.stringify(msg));
        });
    });    
});

mc.listen(args[0]);

