const WebSocket = require('ws');
const fs = require('fs');
const featureFilesModule = require('./featureFilesModule.js');
const gherkinDocumentToString = require('./gherkinUtils');
const { exec, execSync } = require('child_process');
const path = require('path');
let config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
let wss;

function initializeWebSocket(server) {
    wss = new WebSocket.Server({ server });
    wss.on('connection', ws => {
        ws.on('message', message => {
            const data = JSON.parse(message);
            if (data.action === 'run-tests') {
                const tags = data.tags;
                const testCommand = config.testCommand.replace('@yourTag', tags);
                notifyClients('tests started');
                notifyClients('executing: ' + testCommand);
                notifyClients('debug: ' + tags);
                exec(testCommand, (error, stdout, stderr) => {
                    // ... gestione dell'output come prima ...
                });
            }
            if (data.action === 'updateFeature') {
                let featureFile = featureFilesModule.getFeatureFilesCopy().find(file => file.featureId === data.featureId);
                if (featureFile) {
                    setNestedProperty(featureFile, data.field, data.newValue);
                }
                notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: data.field, newValue: data.newValue }));
            }
            if (data.action === 'removeTag') {
                let featureFile = featureFilesModule.getFeatureFilesCopy().find(file => file.featureId === data.featureId);
                if (featureFile) {
                    let scenario = featureFile.feature.children.find(child => child.scenario && child.scenario.id === data.scenarioId);
                    if (scenario) {
                        let tagIndex = scenario.scenario.tags.findIndex(tag => tag.name === data.tag);
                        if (tagIndex > -1) {
                            scenario.scenario.tags.splice(tagIndex, 1);
                            let scenarioIndex = featureFile.feature.children.findIndex(child => child.scenario && child.scenario.id === data.scenarioId);
                            featureFile.feature.children[scenarioIndex] = scenario;
                            let featureIndex = featureFilesModule.getFeatureFilesCopy().findIndex(file => file.featureId === data.featureId);
                            featureFilesModule.getFeatureFilesCopy()[featureIndex] = featureFile;
                            notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: 'tags', newValue: scenario.scenario.tags }));
                        }
                    }
                }
            }
            if (data.action === 'addTag') {
                let featureFile = featureFilesModule.getFeatureFilesCopy().find(file => file.featureId === data.featureId);
                if (featureFile) {
                    let scenario = featureFile.feature.children.find(child => child.scenario && child.scenario.id === data.scenarioId);
                    if (scenario) {
                        let tagExists = scenario.scenario.tags.some(tag => tag.name === data.tag);
                        if (!tagExists) {
                            scenario.scenario.tags.push({ name: data.tag });
                            let scenarioIndex = featureFile.feature.children.findIndex(child => child.scenario && child.scenario.id === data.scenarioId);
                            featureFile.feature.children[scenarioIndex] = scenario;
                            let featureIndex = featureFilesModule.getFeatureFilesCopy().findIndex(file => file.featureId === data.featureId);
                            featureFilesModule.getFeatureFilesCopy()[featureIndex] = featureFile;
                            notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: 'tags', newValue: scenario.scenario.tags }));
                        }
                    }
                }
            }
            if (data.action === 'saveOnDisk') {
                const outputFolder = config.outputFolder;
                const keepFolderStructure = config.keepFolderStructure;
                const directoryPath = config.directoryPath;
                featureFilesModule.getFeatureFilesCopy().forEach(featureFile => {
                    const gherkinText = gherkinDocumentToString(featureFile);
                    let outputUrl = featureFile.path.replace(directoryPath, outputFolder);
                    if (keepFolderStructure) {
                        outputUrl = outputUrl.replace(/\\/g, '\\\\');
                    }
                    ensureDirectoryExistence(outputUrl);
                    fs.writeFileSync(outputUrl, gherkinText);
                });
            }
            // Delete all occurency of a tag from all the scenarios and features
            if (data.action === 'deleteAllOccurencyOfTag') {
                featureFilesModule.getFeatureFilesCopy().forEach(featureFile => {
                    featureFile.feature.children.forEach(child => {
                        if (child.scenario) {
                            let tagIndex = child.scenario.tags.findIndex(tag => tag.name === data.tag);
                            if (tagIndex > -1) {
                                child.scenario.tags.splice(tagIndex, 1);
                            }
                        }
                    });
                });
                notifyClients(JSON.stringify({ action: 'featureUpdated', tag: data.tag }));
            }
            // Update all occurency of a tag from all the scenarios and features only if the tag exists and newTag does not exist else notify the client that the newTag already exists
            if (data.action === 'updateAllOccurencyOfTag') {
                let tagExists = false;
                let newTagExists = false;
                featureFilesModule.getFeatureFilesCopy().forEach(featureFile => {
                    featureFile.feature.children.forEach(child => {
                        if (child.scenario) {
                            let tagIndex = child.scenario.tags.findIndex(tag => tag.name === data.tag);
                            if (tagIndex > -1) {
                                tagExists = true;
                                let newTagIndex = child.scenario.tags.findIndex(tag => tag.name === data.newTag);
                                if (newTagIndex > -1) {
                                    newTagExists = true;
                                } else {
                                    child.scenario.tags[tagIndex].name = data.newTag;
                                }
                            }
                        }
                    });
                });
                if (tagExists && !newTagExists) {
                    notifyClients(JSON.stringify({ action: 'featureUpdated', tag: data.tag, newTag: data.newTag }));
                } else if (newTagExists) {
                    notifyClients(JSON.stringify({ action: 'error', message: data.newTag + ' already exists' }));
                }
            }
            if (data.action === 'reset') {
                reset();
            }
            if (data.action === 'gitStatus') {
                notifyClients(JSON.stringify({ action: 'gitStatus', message: gitStatus() }));
            }
        });
    });

    return wss;
}

function notifyClients(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function setNestedProperty(obj, path, value) {
    const pathParts = path.split(/[\.\[\]]/).filter(part => part);
    const lastPart = pathParts.pop();

    const target = pathParts.reduce((prev, curr) => {
        return prev ? prev[curr] : null
    }, obj || self);

    if (target && lastPart) {
        target[lastPart] = value;
    } else {
        console.error('Error setting nested property', path, 'on', obj);
    }
}

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function gitStatus() {
    const gitStatusCommand = 'git status --porcelain';
    const gitStatusOutput = execSync(gitStatusCommand, { cwd: config.directoryPath });
    return gitStatusOutput.toString();
}

module.exports = {
    initializeWebSocket,
    notifyClients
};