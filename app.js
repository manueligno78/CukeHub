const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const featureFilesModule = require('./js/modules/featureFilesModule.js');
const app = express();
const server = http.createServer(app);
const rateLimit = require("express-rate-limit");
const { initializeWebSocket, handleReset, notifyClients } = require('./js/modules/websocket.js');
const wss = initializeWebSocket(server);
let config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

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

app.get('/', (req, res) => {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  const gitProjectUrl = config.gitProjectUrl;
  const directoryPath = config.directoryPath;
  if (!directoryPath) {
    res.redirect('/settings');
  } else {
    // Check if the directory path is already a git repository
    if (!fs.existsSync(path.join(directoryPath, '.git'))) {
      if (gitProjectUrl) {
        // Clone the git repository
        const simpleGit = require('simple-git')(directoryPath);
        simpleGit.clone(gitProjectUrl, directoryPath, (err, data) => {
          if (err) {
            console.error(err);
            res.redirect('/settings');
            notifyClients(wss, 'gitStatus', { message: 'Error cloning repository' + gitProjectUrl + ' to ' + directoryPath });
          } else {
            console.log('Cloned repository' + gitProjectUrl + ' to ' + directoryPath);
            notifyClients(wss, 'gitStatus', { message: 'Cloned repository' + gitProjectUrl + ' to ' + directoryPath });
          }
        });
      } else {
        res.redirect('/settings');
      }
    }
    // If the feature files have not been loaded yet, load them
    if (featureFilesModule.getFeatureFilesCopy().length === 0) {
      let featureFiles = featureFilesModule.getFiles(directoryPath);
      featureFilesModule.updateFeatureFilesCopy(JSON.parse(JSON.stringify(featureFiles)));
    }
    res.render('pages/index', { configuration: config, featureFiles: featureFilesModule.getFeatureFilesCopy() });
  }
});

app.get('/settings', (req, res) => {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  res.render('pages/settings', {
    gitProjectUrl: config.gitProjectUrl,
    gitBranch: config.gitBranch,
    directoryPath: config.directoryPath,
    folderToExclude: config.folderToExclude
  });
});

app.post('/save-settings', (req, res) => {
  const newGitProjectUrl = req.body.gitProjectUrl;
  const newGitBranch = req.body.gitBranch;
  const newDirectoryPath = req.body.directoryPath;
  const newFolderToExclude = req.body.folderToExclude;
  const newConfig = {
    gitProjectUrl: newGitProjectUrl,
    gitBranch: newGitBranch,
    directoryPath: newDirectoryPath,
    folderToExclude: newFolderToExclude,
  };
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  if (JSON.stringify(config) !== JSON.stringify(newConfig)) {
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(newConfig, null, 2), 'utf-8');
    reset();
  }
  res.redirect('/');
});

function reset() {
  handleReset();
}

server.listen(3000, () => {
  console.log('CukeHub listening on http://localhost:3000');
});