const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const featureFilesModule = require('./js/modules/featureFilesModule.js');
const gitModule = require('./js/modules/gitModule.js'); // new module for git operations
const app = express();
const server = http.createServer(app);
const rateLimit = require("express-rate-limit");
const { initializeWebSocket, handleReset, notifyClients } = require('./js/modules/websocket.js');
const { create } = require('domain');
const wss = initializeWebSocket(server);
let config = loadConfig(); // load config using a function

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 100
});

app.use(limiter);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

module.exports.server = server;

app.get('/', async (req, res) => {
  config = loadConfig(); // reload config
  if (!config.isConfigurated || !createFolderIfNotExists(config.directoryPath) || !(await gitModule.cloneGitRepository(config.gitProjectUrl, config.gitBranch, config.directoryPath, wss))) {
    console.log('Config check failed, redirecting to /settings');
    res.redirect('/settings');
    return;
  }
  console.log('Config check true, rendering pages/index');
  const featureFiles = featureFilesModule.getFiles(config.directoryPath);
  featureFilesModule.updateFeatureFilesCopy(JSON.parse(JSON.stringify(featureFiles)));
  res.render('pages/index', { configuration: config, featureFiles: featureFilesModule.getFeatureFilesCopy() });
});

app.get('/settings', (req, res) => {
  config = loadConfig();
  res.render('pages/settings', {
    gitProjectUrl: config.gitProjectUrl,
    gitBranch: config.gitBranch,
    directoryPath: config.directoryPath,
    folderToExclude: config.folderToExclude
  });
});

app.post('/save-settings', async (req, res) => {
  const newGitProjectUrl = req.body.gitProjectUrl;
  const newGitBranch = req.body.gitBranch;
  const newDirectoryPath = req.body.directoryPath;
  const newFolderToExclude = req.body.folderToExclude;
  const newConfig = {
    gitProjectUrl: newGitProjectUrl,
    gitBranch: newGitBranch,
    directoryPath: newDirectoryPath,
    folderToExclude: newFolderToExclude,
    isConfigurated: true
  };
  fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(newConfig, null, 2), 'utf-8');
  config = newConfig;
  console.log('Config saved.');
  console.log('Create new directory if not exists');
  const folderCheckSuccessful = await createFolderIfNotExists(newDirectoryPath);
  const cloneSuccessful = await gitModule.cloneGitRepository(newGitProjectUrl, newGitBranch, newDirectoryPath, wss);
  console.log("folederCheckSuccessful: " + folderCheckSuccessful);
  console.log("cloneSuccessful: " + cloneSuccessful);
  if (cloneSuccessful && folderCheckSuccessful) {
    console.log("Clone and folder success, redirecting to /");
    res.redirect('/');
  } else {
    console.log("Clone or folder fail, redirecting to /settings");
    res.redirect('/settings');
  }
});

async function createFolderIfNotExists(folderPath) {
  try {
    console.log(`Try creating folder at ${folderPath}`);
    if (!fs.existsSync(folderPath)) {
      console.log(`Creating folder at ${folderPath}`);
      fs.mkdirSync(folderPath);
    }
    return true;
  } catch (error) {
    console.error(`Error creating folder at ${folderPath}: ${error}`);
    return false;
  }
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
}

server.listen(3000, () => {
  console.log('CukeHub listening on http://localhost:3000');
});