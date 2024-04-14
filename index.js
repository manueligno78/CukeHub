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
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

function getScenarios(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const uuidFn = Messages.IdGenerator.uuid();
    const builder = new Gherkin.AstBuilder(uuidFn);
    const matcher = new Gherkin.GherkinClassicTokenMatcher();
    const parser = new Gherkin.Parser(builder, matcher);
    const gherkinDocument = parser.parse(fileContent);
    const pickles = Gherkin.compile(gherkinDocument, filePath, uuidFn);
    const scenarios = pickles.map(pickle => {
      const isOutline = gherkinDocument.feature.children.some(child => 
        child.scenario && child.scenario.examples && child.scenario.examples.length > 0 && child.scenario.name === pickle.name
      );
      return {
        name: pickle.name,
        tags: pickle.tags.map(tag => ({
          name: tag.name,
          color: hashCode(tag.name)
        })),
        isOutline: isOutline
      };
    });
    const allTags = pickles.flatMap(pickle => pickle.tags.map(tag => ({
      name: tag.name,
      color: hashCode(tag.name)
    })));
    const uniqueTags = [...new Set(allTags.map(tag => tag.name))];
    const featureTitle = gherkinDocument.feature.name;
    return {
      featureTitle: featureTitle,
      scenarioCount: scenarios.length,
      scenarios: scenarios,
      tags: uniqueTags
    };
  } catch (error) {
    console.error(`Error getting scenarios: ${error}`);
    return null;
  }
}

function getFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  const foldersToExclude = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')).folderToExclude;
  const excludePatterns = foldersToExclude.split(',').map(folder => 
    new RegExp('^' + folder.trim().replace(/\*/g, '.*') + '$')
  );
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


function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var color = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

function notifyClients(message) {
  wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
          client.send(message);
      }
  });
}

app.get('/', (req, res) => {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  const directoryPath = config.directoryPath;
  if (!directoryPath) {
    res.redirect('/settings');
  } else {
    let featureFiles = getFiles(directoryPath);
    res.render('table', { featureFiles: featureFiles, runCommand: !!config.testCommand });
  }
});

app.get('/settings', (req, res) => {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  res.render('settings', {
    directoryPath: config.directoryPath,
    testCommand: config.testCommand,
    folderToExclude: config.folderToExclude
  });
});

app.post('/save-settings', (req, res) => {
  const newDirectoryPath = req.body.directoryPath;
  const newTestCommand = req.body.testCommand;
  const newFolderToExclude = req.body.folderToExclude;
  const newConfig = {
      directoryPath: newDirectoryPath,
      testCommand: newTestCommand,
      folderToExclude: newFolderToExclude
  };
  fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(newConfig, null, 2), 'utf-8');
  res.redirect('/settings');
});


wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`);
    
    const data = JSON.parse(message);
    if (data.action === 'run-tests') {
      const tags = data.tags;
      const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
      const testCommand = config.testCommand.replace('@yourTag', tags);
      
      notifyClients('tests started');
      notifyClients('executing: ' + testCommand);
      notifyClients('debug: ' + tags);
      
      exec(testCommand, (error, stdout, stderr) => {
        // ... gestione dell'output come prima ...
      });
    }
  });
});


server.listen(3000, () => {
  console.log('App listening on http://localhost:3000');
});