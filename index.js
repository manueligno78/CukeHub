const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Gherkin = require('@cucumber/gherkin');
const Messages = require('@cucumber/messages');
const { exec, execSync } = require('child_process');
const WebSocket = require('ws');
const http = require('http');
const gherkinDocumentToString = require('./gherkinUtils');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

module.exports.server = server;
module.exports.getFiles = getFiles;
module.exports.getScenarios = getScenarios;

let featureFilesCopy = [];

function getFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  const foldersToExclude = config.folderToExclude;
  let excludePatterns = [];
  if (foldersToExclude) {
    excludePatterns = foldersToExclude.split(',').map(folder =>
      new RegExp('^' + folder.trim().replace(/\*/g, '.*') + '$')
    );
  }
  files.forEach(file => {
    const fullPath = path.join(dirPath, "/", file);
    const isExcluded = excludePatterns.some(pattern => pattern.test(fullPath));
    if (isExcluded) {
      return;
    }
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.feature')) {
      const scenarioData = getScenarios(fullPath);
      if (scenarioData) {
        arrayOfFiles.push({
          name: file,
          path: fullPath,
          relativePath: fullPath.replace(config.directoryPath, ''),
          ...scenarioData
        });
      }
    }
  });
  return arrayOfFiles;
}

function getScenarios(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const uuidFn = Messages.IdGenerator.uuid();
    const builder = new Gherkin.AstBuilder(uuidFn);
    const matcher = new Gherkin.GherkinClassicTokenMatcher();
    const parser = new Gherkin.Parser(builder, matcher);
    const gherkinDocument = parser.parse(fileContent);

    const featureId = uuidFn();
    const tags = [];

    gherkinDocument.feature.children.forEach(child => {
      if (child.scenario) {
        child.scenario.tags.forEach(tag => {
          tags.push({
            tag: tag.name,
            scenario: child.scenario.name,
            featureId: featureId
          });
        });
        child.scenario.isOutline = child.scenario.keyword.includes('Outline');
        if (child.scenario.isOutline && child.scenario.examples) {
          child.scenario.numberOfExamples = child.scenario.examples.reduce((count, example) => {
            return count + (example.tableBody ? example.tableBody.length : 0);
          }, 0);
        }
        // Count the steps in the scenario
        child.scenario.numberOfSteps = child.scenario.steps ? child.scenario.steps.length : 0;
      }
    });

    return {
      featureId: featureId,
      tags: tags,
      ...gherkinDocument
    };
  } catch (error) {
    console.error(`Error getting scenarios: ${error}`);
    return null;
  }
}

/// SERVER and WEBSOCKETS
function notifyClients(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function gitStatus() {
  // Execute a shell command
  // git status on config.directoryPath
  const gitStatusCommand = 'git status --porcelain';
  const gitStatusOutput = execSync(gitStatusCommand, { cwd: config.directoryPath });
  return gitStatusOutput.toString();
}

app.get('/', (req, res) => {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  const directoryPath = config.directoryPath;
  if (!directoryPath) {
    res.redirect('/settings');
  } else {
    if (featureFilesCopy.length === 0) {
      let featureFiles = getFiles(directoryPath);
      featureFilesCopy = JSON.parse(JSON.stringify(featureFiles));
    }
    res.render('index', { configuration: config, featureFiles: featureFilesCopy, runCommand: !!config.testCommand });
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
      let featureFile = featureFilesCopy.find(file => file.featureId === data.featureId);
      if (featureFile) {
        setNestedProperty(featureFile, data.field, data.newValue);
      }
      notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: data.field, newValue: data.newValue }));
    }
    if (data.action === 'removeTag') {
      let featureFile = featureFilesCopy.find(file => file.featureId === data.featureId);
      if (featureFile) {
        let scenario = featureFile.feature.children.find(child => child.scenario && child.scenario.id === data.scenarioId);
        if (scenario) {
          let tagIndex = scenario.scenario.tags.findIndex(tag => tag.name === data.tag);
          if (tagIndex > -1) {
            scenario.scenario.tags.splice(tagIndex, 1);
            let scenarioIndex = featureFile.feature.children.findIndex(child => child.scenario && child.scenario.id === data.scenarioId);
            featureFile.feature.children[scenarioIndex] = scenario;
            let featureIndex = featureFilesCopy.findIndex(file => file.featureId === data.featureId);
            featureFilesCopy[featureIndex] = featureFile;
            notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: 'tags', newValue: scenario.scenario.tags }));
          }
        }
      }
    }
    if (data.action === 'addTag') {
      let featureFile = featureFilesCopy.find(file => file.featureId === data.featureId);
      if (featureFile) {
        let scenario = featureFile.feature.children.find(child => child.scenario && child.scenario.id === data.scenarioId);
        if (scenario) {
          let tagExists = scenario.scenario.tags.some(tag => tag.name === data.tag);
          if (!tagExists) {
            scenario.scenario.tags.push({ name: data.tag });
            let scenarioIndex = featureFile.feature.children.findIndex(child => child.scenario && child.scenario.id === data.scenarioId);
            featureFile.feature.children[scenarioIndex] = scenario;
            let featureIndex = featureFilesCopy.findIndex(file => file.featureId === data.featureId);
            featureFilesCopy[featureIndex] = featureFile;
            notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: 'tags', newValue: scenario.scenario.tags }));
          }
        }
      }
    }
    if (data.action === 'saveOnDisk') {
      const outputFolder = config.outputFolder;
      const keepFolderStructure = config.keepFolderStructure;
      const directoryPath = config.directoryPath;
      featureFilesCopy.forEach(featureFile => {
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
      featureFilesCopy.forEach(featureFile => {
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
      featureFilesCopy.forEach(featureFile => {
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

function getNestedProperty(obj, path) {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : null
  }, obj || self)
}

function reset() {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  const directoryPath = config.directoryPath;
  let featureFiles = getFiles(directoryPath);
  //let featureFiles = getFiles(directoryPath);
  featureFilesCopy = JSON.parse(JSON.stringify(featureFiles));
  notifyClients(JSON.stringify({ action: 'reset' }));
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

server.listen(3000, () => {
  console.log('CukeHub listening on http://localhost:3000');
});