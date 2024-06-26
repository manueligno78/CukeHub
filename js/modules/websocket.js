const WebSocket = require('ws');
const fs = require('fs');
const featureFilesModule = require('./featureFilesModule.js');
const { exec, execSync } = require('child_process');
const path = require('path');
let config = loadConfig();
let wss;


function loadConfig() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8'));
}

const actionHandlers = {
    'updateFeature': handleUpdateFeature,
    'removeTag': handleRemoveTag,
    'addTag': handleAddTag,
    'saveOnDisk': handleSaveOnDisk,
    'deleteAllOccurencyOfTag': handleDeleteAllOccurencyOfTag,
    'updateAllOccurencyOfTag': handleUpdateAllOccurencyOfTag,
    'reset': handleReset,
    'gitStatus': handleGitStatus,
    'commit': handleCommit,
    'revert': handleRevert
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

async function handleGitStatus(data) {
    message = await gitStatus();
    notifyClients(JSON.stringify({ action: 'gitStatus', message: message }));
}

async function handleCommit(data) {
    message = await commit();
    notifyClients(JSON.stringify({ action: 'commit', message: message }));
}

async function handleRevert(data) {
    message = await revert();
    notifyClients(JSON.stringify({ action: 'revert', message: message }));
}

function notifyClients(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

async function gitStatus() {
    config = loadConfig();
    const directoryPath = config.directoryPath;
    const simpleGit = require('simple-git')(path.normalize(directoryPath));
    let status = '';
    try {
        status = await simpleGit.status();
    } catch (err) {
        console.error(err);
        status = 'Error getting git status';
    }
    return status;
}

async function commit() {
    const directoryPath = config.directoryPath;
    const simpleGit = require('simple-git')(path.normalize(directoryPath));
    let message = '';
    try {
        // commit -a -m "commit"
        message = await simpleGit.add('./*');
        message = await simpleGit.commit('commit');
    } catch (err) {
        console.error(err);
        message = 'Error committing';
    }
}

async function revert() {
    const directoryPath = config.directoryPath;
    const simpleGit = require('simple-git')(path.normalize(directoryPath));
    let message = '';
    try {
        message = await simpleGit.reset('hard');
    } catch (err) {
        console.error(err);
        message = 'Error reverting';
    }
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