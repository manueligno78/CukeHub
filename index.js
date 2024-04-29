const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Gherkin = require('@cucumber/gherkin');
const Messages = require('@cucumber/messages');
const { exec } = require('child_process');
const WebSocket = require('ws');
const http = require('http');

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

function gherkinDocumentToString(gherkinDocument) {
  let gherkinText = '';
  // Add the feature tags, if any
  if (gherkinDocument.feature.tags && gherkinDocument.feature.tags.length > 0) {
    const tags = gherkinDocument.feature.tags.map(tag => tag.name).join(' ');
    gherkinText += `${tags}\n`;
  }
  // Add the feature title
  gherkinText += `Feature: ${gherkinDocument.feature.name}\n\n`;
  // Add the feature description, if any
  if (gherkinDocument.feature.description) {
    gherkinText += `${gherkinDocument.feature.description}\n\n`;
  }
  // Add each scenario or background
  gherkinDocument.feature.children.forEach((child, index, array) => {
    if (child.background) {
      gherkinText += `\n  Background:\n`;
      // Add each step of the background
      child.background.steps.forEach(step => {
        gherkinText += `    ${step.keyword} ${step.text}\n`;
      });
      // Add a blank line after the background
      gherkinText += '\n';
    } else if (child.scenario) {
      // Add the scenario tags, if any
      if (child.scenario.tags && child.scenario.tags.length > 0) {
        const tags = child.scenario.tags.map(tag => tag.name).join(' ');
        gherkinText += `  ${tags}\n`;
      }
      gherkinText += `  Scenario: ${child.scenario.name}\n`;
      // Add the scenario description, if any
      if (child.scenario.description) {
        gherkinText += `\n${child.scenario.description}\n\n`;
      }
      // Add each step of the scenario
      child.scenario.steps.forEach(step => {
        gherkinText += `    ${step.keyword}${step.text}\n`;
      });
      // Add the Examples, if any
      if (child.scenario.examples && child.scenario.examples.length > 0) {
        child.scenario.examples.forEach(example => {
          gherkinText += `\n    Examples:\n`;
          // Add the table header
          const header = example.tableHeader.cells.map(cell => cell.value).join(' | ');
          gherkinText += `      | ${header} |\n`;
          // Add the table rows
          example.tableBody.forEach(row => {
            const rowText = row.cells.map(cell => cell.value).join(' | ');
            gherkinText += `      | ${rowText} |\n`;
          });
        });
      }
      // Add a blank line after each scenario, except the last one
      if (index < array.length - 1) {
        gherkinText += '\n';
      }
    }
  });
  return gherkinText;
}

/// SERVER and WEBSOCKETS

function notifyClients(message) {
  wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
          client.send(message);
      }
  });
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
      //config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
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
      //console.log('Feature updated:', JSON.stringify(featureFile));
      notifyClients(JSON.stringify({ action: 'featureUpdated', featureId: data.featureId, field: data.field, newValue: data.newValue }));
    }
    if (data.action === 'saveOnDisk') {
      //const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
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
    if (data.action === 'reset') {
      reset();
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