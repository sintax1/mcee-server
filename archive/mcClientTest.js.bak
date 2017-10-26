const MCClient = require("./mc").Client;
const MCMessage = require("./mcmessage");
var mc = new MCClient();

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


mc.on('ready', function(mcclient) {

    mc.mcproto.registerRequestHandler('listd', function(msg) {
        var msg = new MCMessage();
        msg.header.requestId = msg.header.requestId;
        msg.header.messagePurpose = "commandResponse";
        msg.body.clientuuid = mc.uuid;
        msg.body.statusCode = 0;
        msg.body.currentPlayerCount = 1;
        msg.body.details = "###* {\"command\":\"listd\",\"result\":[{\"color\":\"ffff5454\",\"name\":\"CraigK\",\"randomId\":1306486932,\"uuid\":\"84ec40f4-3a87-3d25-80d2-392f694fc5f5\"}]}\n *###";
        msg.body.maxPlayerCount = 30;
        msg.body.players = "CraigK";
        msg.body.statusMessage = "There are 1/30 players online:\nCraigK\n###* {\"command\":\"listd\",\"result\":[{\"color\":\"ffff5454\",\"name\":\"CraigK\",\"randomId\":1306486932,\"uuid\":\"84ec40f4-3a87-3d25-80d2-392f694fc5f5\"}]}\n *###";

        msg = mc.mcproto.formatMessage(msg);
        return msg
    });

    mc.mcproto.registerRequestHandler('time', function(msg) {
        var msg = new MCMessage();
        msg.header.requestId = msg.header.requestId;
        msg.header.messagePurpose = "commandResponse";
        msg.body.clientuuid = mc.uuid;
        msg.body.body = "Daytime is 5000";
        msg.body.statusCode = 0;
        msg.body.statusMessage = "Daytime is 5000";
        
        msg = mc.mcproto.formatMessage(msg);
        return msg
    });

    mc.mcproto.registerRequestHandler('gamerule', function(msg) {
        var msg = new MCMessage();
        msg.header.requestId = msg.header.requestId;
        msg.header.messagePurpose = "commandResponse";
        msg.body.clientuuid = mc.uuid;
        msg.body.statusCode = 0;
        msg.body.details = {
            allowdestructiveobjects: false,
            allowmobs : false,
            commandblockoutput : true,
            dodaylightcycle : false,
            doentitydrops : true,
            dofiretick : true,
            domobloot : true,
            domobspawning : true,
            dotiledrops : true,
            doweathercycle : false,
            drowningdamage : false,
            falldamage : false,
            firedamage : false,
            globalmute : false,
            keepinventory : false,
            mobgriefing : true,
            naturalregeneration : true,
            pvp : false,
            sendcommandfeedback : true,
            showcoordinates : true,
            tntexplodes : true
        } 
        msg.body.statusMessage = "sendcommandfeedback, tntexplodes, naturalregeneration, showcoordinates, allowmobs, pvp, globalmute, mobgriefing, allowdestructiveobjects, doweathercycle, firedamage, domobspawning, drowningdamage, falldamage, domobloot, dotiledrops, dofiretick, doentitydrops, dodaylightcycle, keepinventory, commandblockoutput";

        msg = mc.mcproto.formatMessage(msg);
        return msg
    });

    mc.mcproto.registerRequestHandler('globalpause', function(msg) {
        var msg = new MCMessage();
        msg.header.requestId = msg.header.requestId;
        msg.header.messagePurpose = "commandResponse";
        msg.body.clientuuid = mc.uuid;
        msg.body.isPaused = false;
        msg.body.statusCode = 0;
        msg.body.statusMessage = "Set or got pause state";

        msg = mc.mcproto.formatMessage(msg);
        return msg
    });

    mc.mcproto.registerRequestHandler('immutableworld', function(msg) {
        var msg = new MCMessage();
        msg.header.requestId = msg.header.requestId;
        msg.header.messagePurpose = "commandResponse";
        msg.body.clientuuid = mc.uuid;
        msg.body.statusCode = 0;
        msg.body.statusMessage = "immutableworld = false";
        msg.body.value = false;

        msg = mc.mcproto.formatMessage(msg);
        return msg
    });
});

mc.emit('connect', {server: args[0], port: args[1]});

