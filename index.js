const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const featureFilesModule = require('./featureFilesModule.js');
const app = express();
const server = http.createServer(app);
const { initializeWebSocket, notifyClients } = require('./websocket.js');
const wss = initializeWebSocket(server);
let config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

module.exports.server = server;

app.get('/', (req, res) => {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  const directoryPath = config.directoryPath;
  if (!directoryPath) {
    res.redirect('/settings');
  } else {
    if (featureFilesModule.getFeatureFilesCopy().length === 0) {
      let featureFiles = featureFilesModule.getFiles(directoryPath);
      featureFilesModule.updateFeatureFilesCopy(JSON.parse(JSON.stringify(featureFiles)));
    }
    res.render('index', { configuration: config, featureFiles: featureFilesModule.getFeatureFilesCopy(), runCommand: !!config.testCommand });
  }
});

app.get('/settings', (req, res) => {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  res.render('settings', {
    directoryPath: config.directoryPath,
    testCommand: config.testCommand,
    folderToExclude: config.folderToExclude,
    outputFolder: config.outputFolder,
    keepFolderStructure: config.keepFolderStructure
  });
});

app.post('/save-settings', (req, res) => {
  const newDirectoryPath = req.body.directoryPath;
  const newTestCommand = req.body.testCommand;
  const newFolderToExclude = req.body.folderToExclude;
  const newOutputFolder = req.body.outputFolder;
  const newKeepFolderStructure = req.body.keepFolderStructure === 'on';
  const newConfig = {
    directoryPath: newDirectoryPath,
    testCommand: newTestCommand,
    folderToExclude: newFolderToExclude,
    outputFolder: newOutputFolder,
    keepFolderStructure: newKeepFolderStructure
  };
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  if (JSON.stringify(config) !== JSON.stringify(newConfig)) {
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(newConfig, null, 2), 'utf-8');
    reset();
  }
  res.redirect('/');
});

function reset() {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  const directoryPath = config.directoryPath;
  let featureFiles = featureFilesModule.getFiles(directoryPath);
  featureFilesModule.updateFeatureFilesCopy(JSON.parse(JSON.stringify(featureFiles)));
  notifyClients(JSON.stringify({ action: 'reset' }));
}

server.listen(3000, () => {
  console.log('CukeHub listening on http://localhost:3000');
});