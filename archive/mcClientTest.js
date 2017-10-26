const EventEmitter = require('events').EventEmitter;
const MCSocket = require("./mcsocket");
const MCEvents = require('./mcevents');
const MCMessage = require('./mcmessage');
const mcutils = require('./mcutils');
const util = require('util');

var args = process.argv.slice(2);

var requestHandlers = {};
var responseHandlers = {};
var events = new MCEvents();

const MCRequestCommands = [
    'listd', 
    'time query daytime',
    'gamerule',
    'globalpause',
    'immutableworld',
    'closewebsocket',
    'geteduclientinfo',
    'enableencryption'
];

MCRequestCommands.forEach(function(commandName) {
    requestHandlers[commandName] = function(msg) {
        console.log("Generic Request Handler: " + JSON.stringify(msg));
    };
});


var mcclient = new MCSocket.Client("ws://" + args[0] + ":" + args[1]);

mcclient.on('open', function() {
    console.log("Connected");
});

mcclient.on('message', function(msg) {
    console.log("mcclient message: " + msg);
});

var processMessage = function(msg) {

    msg = JSON.parse(msg);

    console.log("> Received:" + JSON.stringify(msg));

    var purpose = msg.header.messagePurpose;

    switch(purpose) {
        case "commandRequest":
            processRequest(command, msg);
            break;

        case "commandResponse":
            processResponse(msg);
            break;

        default:
            console.log("Unknown messagePurpose: " + purpose);
    }
}

var registerRequestHandler = function(commandName, handler) {
    console.log("Registering Request handler for Command: " + commandName);
    requestHandlers[commandName] = handler;
}

var registerResponseHandler = function(requestId, handler) {
    console.log("Registering Response handler for Command: " + requestId);
    responseHandlers[requestId] = handler;
}

var processRequest = function(commandName, msg) {
    if(commandName in requestHandlers) {
        console.log("MC Request handler found: " + commandName);
        return requestHandlers[commandName](msg);
    }
     
    console.log("MC Request Handler not found: " + commandName);
}

var processResponse = function(msg) {
    var requestId = msg.header.requestId;
    if(requestId in responseHandlers) {
        console.log("MC Response handler found: " + requestId);
        return responseHandlers[requestId](msg);
    }
     
    console.log("MC Response Handler not found: " + requestId);
}

