const util = require('util');
const mcutils = require('./mcutils');
const MCMessage = require('./mcmessage');
const MCWebSocket = require('./MCWebSocket');

function MCClient() {

    var self = this;

    this.requestHandlers = {};
    this.responseHandlers = {};

    this.on('open', function() {
        console.log("Websocket connected");
    });

    this.on('message', function (msg) {
        console.log("message: " + msg);

        var response = self.processMessage(msg);
    });

    this.registerRequestHandler('closewebsocket', function(msg) {
        console.log("closing socket");
        self.close();
    });

    this.registerRequestHandler('geteduclientinfo', function(msg) {
        var resp = new MCMessage();
        resp.header.requestId = msg.header.requestId;
        resp.header.messagePurpose = "commandResponse";
        resp.body.clientuuid = self.uuid;
        resp.body.companionProtocolVersion = 3;
        resp.body.isEdu = true;
        resp.body.isHost = true;
        resp.body.playersessionuuid = self.playersessionuuid;
        resp.body.statusCode = 0;
        resp.body.userId = self.userId;
        resp.body.tenantId = 'a82cd1c1-d2a6-4217-9e1a-18dd5fdb4cf2';

        self.send(resp.toJson());
    });

    this.registerRequestHandler('enableencryption', function(msg) {
        var encData = msg.body.commandLine.split(" ");
        var peerPublicKey = encData[1];
        var salt = encData[2];

        var resp = new MCMessage();
        resp.header.requestId = msg.header.requestId;
        resp.header.messagePurpose = "commandResponse";
        resp.body.publicKey = self.publicKeyX509;
        resp.body.statusCode = 0;
        resp.body.statusMessage = self.publicKeyX509;

        self.send(resp.toJson());

        self.enableEncryption(peerPublicKey, salt);
    });
}
util.inherits(MCClient, MCWebSocket);

MCClient.prototype.registerRequestHandler = function(commandName, handler) {
    console.log("Registering Request handler for Command: " + commandName);
    this.requestHandlers[commandName] = handler;
}

MCClient.prototype.registerResponseHandler = function(requestId, handler) {
    console.log("Registering Response handler for Command: " + requestId);
    this.responseHandlers[requestId] = handler;
}

MCClient.prototype.processRequest = function(commandName, msg) {
    if(commandName in this.requestHandlers) {
        console.log("MC Request handler found: " + commandName);
        return this.requestHandlers[commandName](msg);
    }
    
    console.log("MC Request Handler not found: " + commandName);
}

MCClient.prototype.processResponse = function(msg) {
    var requestId = msg.header.requestId;
    if(requestId in this.responseHandlers) {
        console.log("MC Response handler found: " + requestId);
        return this.responseHandlers[requestId](msg);
    }
    
    console.log("MC Response Handler not found: " + requestId);
}


/*
exports.Server = function() {
    const WebSocketServer = require('./MCWebSocketServer');

    var self = this;

    this.clients = {};

    this.listen = function(port) {
        self.wss = new WebSocketServer({port: port});

        self.wss.on('error', function(err) {
            console.log("Error:" + err);
        });

        self.wss.on('listening', function() {
            console.log("Server Listening");
            console.log("Connect with: /connect ws://127.0.0.1:" + port);
        });

        self.wss.on('close', function() {
            console.log("Server Stopped");
        });

        self.wss.on('connection', function (ws) {
            console.log("Connection received: " + ws._socket.remoteAddress);

            ws.mcproto = new MCProto();
           
            self.clients[ws.id] = ws; 

            ws.registerEvent = function(eventName, handler) {
                var msg = new MCMessage();
                msg.body.eventName = eventName;
                msg.header.messagePurpose = "subscribe";
                msg.header.messageType = "commandRequest";
               
                ws.mcproto.events.registerEventHandler(eventName, handler);

                ws.send(ws.mcproto.formatMessage(msg));
            }

            ws.sendCommand = function(command, handler) {
                var msg = new MCMessage();
                msg.body.commandLine = command;
                msg.header.messagePurpose = "commandRequest";
                msg.header.messageType = "commandRequest";

                ws.mcproto.registerResponseHandler(msg.header.requestId, handler);

                ws.send(ws.mcproto.formatMessage(msg));
            }

            ws.on('message', function(msg) {

                var response = ws.mcproto.processMessage(msg);

                if(ws && response) {
                    console.log("> Sending: " + response);
                    ws.send(response);
                }
            });

            ws.on('end', function() {
                console.log("Client Disconnected");
                delete self.clients[ws.id];
            });

            ws.on('error', function(err) {
                console.log("Error:" + err);
            });

            console.log("init");
            var msg = new MCMessage();
            msg.header.messagePurpose = "commandRequest";
            msg.body.origin = { type : "player" };
            msg.body.commandLine = "geteduclientinfo";
            msg.body.version = 1;
            
            ws.mcproto.registerResponseHandler(msg.header.requestId, function(msg) {
                console.log("enableencryption");
                var msg = new MCMessage();
                msg.header.messagePurpose = "commandRequest";
                msg.body.origin = { type : "player" };
                msg.body.commandLine = "enableencryption \"" + mcutils.writeX509PublicKey(ws.mcproto.publicKey) + "\" \"" + ws.mcproto.salt.toString('base64') + "\"";

                ws.mcproto.registerResponseHandler(msg.header.requestId, function(msg) {
                    ws.mcproto.enableEncryption(msg.body.publicKey, null);
                    self.emit('ready', ws);
                });

                console.log("Sending: " + msg.toJson());
                ws.send(ws.mcproto.formatMessage(msg));
            });

            console.log("Sending: " + msg.toJson());
            ws.send(ws.mcproto.formatMessage(msg));
        });
    }
}
util.inherits(exports.Server, EventEmitter);
*/

exports.MCClient = MCClient;
