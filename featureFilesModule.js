const fs = require('fs');
const path = require('path');
const Gherkin = require('@cucumber/gherkin');
const Messages = require('@cucumber/messages');
const gherkinDocumentToString = require('./gherkinUtils');

let config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));


let featureFilesCopy = [];

function updateFeatureFilesCopy(newData) {
    featureFilesCopy = newData;
}

function getFeatureFilesCopy() {
    return featureFilesCopy;
}

function getFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    const foldersToExclude = config.folderToExclude;
    let excludePatterns = [];
    if (foldersToExclude) {
        excludePatterns = foldersToExclude.split(',').map(folder =>
            new RegExp('^' + folder.trim().replace(/\*/g, '.*') + '$')
        );
    }
    //
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

function parseGherkinContent(content) {
    try {
        const uuidFn = Messages.IdGenerator.uuid();
        const builder = new Gherkin.AstBuilder(uuidFn);
        const matcher = new Gherkin.GherkinClassicTokenMatcher();
        const parser = new Gherkin.Parser(builder, matcher);
        const gherkinDocument = parser.parse(content);

        const featureId = uuidFn();
        const tags = [];

        // Handle feature tags
        if (gherkinDocument.feature.tags) {
            gherkinDocument.feature.tags.forEach(tag => {
                tags.push({
                    tag: tag.name,
                    featureId: featureId
                });
            });
        }

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
        console.error(`Error parsing gherkin content: ${error}`);
        return null;
    }
}

function getScenarios(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return parseGherkinContent(fileContent);
}

module.exports = { updateFeatureFilesCopy, getFeatureFilesCopy, getFiles, getScenarios, parseGherkinContent, gherkinDocumentToString };