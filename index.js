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

module.exports = server;

function getScenarios(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const uuidFn = Messages.IdGenerator.uuid();
    const builder = new Gherkin.AstBuilder(uuidFn);
    const matcher = new Gherkin.GherkinClassicTokenMatcher();
    const parser = new Gherkin.Parser(builder, matcher);
    const gherkinDocument = parser.parse(fileContent);

    const scenarios = gherkinDocument.feature.children.map(child => {
      const isOutline = child.scenario && child.scenario.examples && child.scenario.examples.length > 0;
      return {
        name: child.scenario.name,
        description: child.scenario.description,
        tags: child.scenario.tags.map(tag => ({
          name: tag.name,
          color: hashCode(tag.name)
        })),
        isOutline: isOutline
      };
    });

    const allTags = gherkinDocument.feature.children.flatMap(child => child.scenario.tags.map(tag => ({
      name: tag.name,
      color: hashCode(tag.name)
    })));
    const uniqueTags = [...new Set(allTags.map(tag => tag.name))];

    const featureTitle = gherkinDocument.feature.name;
    const featureDescription = gherkinDocument.feature.description;

    return {
      featureTitle: featureTitle,
      featureDescription: featureDescription,
      scenarioCount: scenarios.length,
      scenarios: scenarios,
      tags: uniqueTags
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

/// SERVER and WEBSOCKETS

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