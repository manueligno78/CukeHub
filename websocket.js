const WebSocket = require('ws');
const fs = require('fs');
const featureFilesModule = require('./featureFilesModule.js');
const { exec, execSync } = require('child_process');
const path = require('path');
let config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
let wss;

const actionHandlers = {
    'updateFeature': handleUpdateFeature,
    'removeTag': handleRemoveTag,
    'addTag': handleAddTag,
    'saveOnDisk': handleSaveOnDisk,
    'deleteAllOccurencyOfTag': handleDeleteAllOccurencyOfTag,
    'updateAllOccurencyOfTag': handleUpdateAllOccurencyOfTag,
    'reset': handleReset,
    'gitStatus': handleGitStatus
};

function initializeWebSocket(server) {
    wss = new WebSocket.Server({ server });
    wss.on('connection', ws => {
        ws.on('message', message => {
            const data = JSON.parse(message);
            const actionHandler = actionHandlers[data.action];
            if (actionHandler && data !== null && typeof data === 'object') {
                actionHandler(data);
            } else {
                console.error('Unknown action:', data.action);
            }
        });
    });

    return wss;
}

function handleUpdateFeature(data) {
    if (featureFilesModule.updateFeatureFile(data.featureId, data.field, data.newValue)) {
        notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: data.field, newValue: data.newValue }));
    }
}

function handleRemoveTag(data) {
    if (featureFilesModule.removeTag(data.featureId, data.scenarioId, data.tag)) {
        notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: 'tags', newValue: data.tag }));
    }
}

function handleAddTag(data) {
    if (featureFilesModule.addTag(data.featureId, data.scenarioId, data.tag)) {
        notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: 'tags', newValue: data.tag }));
    }
}

function handleSaveOnDisk(data) {
    if (featureFilesModule.saveOnDisk()) {
        notifyClients(JSON.stringify({ action: 'featureUpdated', field: 'saveOnDisk' }));
    }
}

function handleDeleteAllOccurencyOfTag(data) {
    if (featureFilesModule.deleteAllOccurencyOfTag(data.tag)) {
        notifyClients(JSON.stringify({ action: 'featureUpdated', tag: data.tag }));
    }
}

function handleUpdateAllOccurencyOfTag(data) {
    if (featureFilesModule.updateAllOccurencyOfTag(data.tag, data.newTag)) {
        notifyClients(JSON.stringify({ action: 'featureUpdated', tag: data.tag, newTag: data.newTag }));
    }
}

function handleReset(data) {
    featureFilesModule.reset();
    notifyClients(JSON.stringify({ action: 'reset' }));
}

function handleGitStatus(data) {
    notifyClients(JSON.stringify({ action: 'gitStatus', message: gitStatus() }));
}

function notifyClients(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function gitStatus() {
    const gitStatusCommand = 'git status --porcelain';
    const gitStatusOutput = execSync(gitStatusCommand, { cwd: config.directoryPath });
    return gitStatusOutput.toString();
}

module.exports = {
    initializeWebSocket,
    notifyClients,
    handleReset,
    handleUpdateFeature,
    handleRemoveTag,
    handleAddTag,
    handleSaveOnDisk,
    handleDeleteAllOccurencyOfTag,
    handleUpdateAllOccurencyOfTag,
    handleGitStatus
};