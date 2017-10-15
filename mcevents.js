var MCEvents = function() {
    this.subscriptions = [];
    this.eventHandlers = {};
}

MCEvents.prototype.registerEventHandler = function(eventName, handler) {
    console.log("Registering Event Handler: " + eventName);
    this.eventHandlers[eventName] = handler;
}

MCEvents.prototype.unregisterEventHandler = function(eventName) {
    console.log("Unregistering Event Handler: " + eventName);
    delete this.eventHandlers[eventName];
}

MCEvents.prototype.subscribe = function(eventName) {
    console.log("Subscribing to Event: " + eventName);
    if (!this.subscriptions.includes(eventName)) {
        this.subscriptions.push(eventName);
    }
}

MCEvents.prototype.unsubscribe = function(eventName) {
    console.log("Unsubscribing to Event: " + eventName);
    for(var i = this.subscriptions.length-1; i--;){
        if (this.subscriptions[i] === eventName) array.splice(i, 1);
    }
}

MCEvents.prototype.processEvent = function(eventName, msg) {
    if(eventName in this.eventHandlers) {
        console.log("MC Event subscription found for: " + eventName);
        return this.eventHandlers[eventName](msg);
    }
    
    console.log("No Event Handler found for: " + eventName);
}

const MCEventNames = [
    'AdditionalContentLoaded',
    'AgentCommand',
    'AgentCreated',
    'ApiInit',
    'AppPaused',
    'AppResumed',
    'AppSuspended',
    'AwardAchievement',
    'BlockBroken',
    'BlockPlaced',
    'BoardTextUpdated',
    'BossKilled',
    'CameraUsed',
    'CauldronUsed',
    'ChunkChanged',
    'ChunkLoaded',
    'ChunkUnloaded',
    'ConfigurationChanged',
    'ConnectionFailed',
    'CraftingSessionCompleted',
    'EndOfDay',
    'EntitySpawned',
    'FileTransmissionCancelled',
    'FileTransmissionCompleted',
    'FileTransmissionStarted',
    'FirstTimeClientOpen',
    'FocusGained',
    'FocusLost',
    'GameSessionComplete',
    'GameSessionStart',
    'HardwareInfo',
    'HasNewContent',
    'ItemAcquired',
    'ItemCrafted',
    'ItemDestroyed',
    'ItemDropped',
    'ItemEnchanted',
    'ItemSmelted',
    'ItemUsed',
    'JoinCanceled',
    'JukeboxUsed',
    'LicenseCensus',
    'MascotCreated',
    'MenuShown',
    'MobInteracted',
    'MobKilled',
    'MultiplayerConnectionStateChanged',
    'MultiplayerRoundEnd',
    'MultiplayerRoundStart',
    'NpcPropertiesUpdated',
    'OptionsUpdated',
    'performanceMetrics',
    'PackImportStage',
    'PlayerBounced',
    'PlayerDied',
    'PlayerJoin',
    'PlayerLeave',
    'PlayerMessage',
    'PlayerTeleported',
    'PlayerTransform',
    'PlayerTravelled',
    'PortalBuilt',
    'PortalUsed',
    'PortfolioExported',
    'PotionBrewed',
    'PurchaseAttempt',
    'PurchaseResolved',
    'RegionalPopup',
    'RespondedToAcceptContent',
    'ScreenChanged',
    'ScreenHeartbeat',
    'SignInToEdu',
    'SignInToXboxLive',
    'SignOutOfXboxLive',
    'SpecialMobBuilt',
    'StartClient',
    'StartWorld',
    'TextToSpeechToggled',
    'UgcDownloadCompleted',
    'UgcDownloadStarted',
    'UploadSkin',
    'VehicleExited',
    'WorldExported',
    'WorldFilesListed',
    'WorldGenerated',
    'WorldLoaded',
    'WorldUnloaded'
]

module.exports = MCEvents;
