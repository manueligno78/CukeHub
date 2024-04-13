const fs = require('fs');
const path = require('path');
const Gherkin = require('@cucumber/gherkin');
const Messages = require('@cucumber/messages');
const { exec } = require('child_process');
const WebSocket = require('ws');

const directoryPath = path.join(__dirname, '../src/test/resources/features');


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
        // Check if the scenario is an outline by looking for examples in the AST
        const isOutline = gherkinDocument.feature.children.some(child => 
          child.scenario && child.scenario.examples && child.scenario.examples.length > 0 && child.scenario.name === pickle.name
        );
  
        return {
          name: pickle.name,
          tags: pickle.tags.map(tag => ({
            name: tag.name,
            color: hashCode(tag.name)
          })),
          isOutline: isOutline // Add the new field here
        };
      });
  
      const allTags = pickles.flatMap(pickle => pickle.tags.map(tag => ({
        name: tag.name,
        color: hashCode(tag.name)
      })));
      const uniqueTags = [...new Set(allTags.map(tag => tag.name))]; // remove duplicates
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
  
    files.forEach(file => {
      const fullPath = path.join(dirPath, "/", file);
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

module.exports = { getScenarios, getFiles, hashCode, notifyClients };