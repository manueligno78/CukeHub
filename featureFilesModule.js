const fs = require('fs');
const path = require('path');
const Gherkin = require('@cucumber/gherkin');
const Messages = require('@cucumber/messages');
const gherkinDocumentToString = require('./gherkinUtils');
const { setNestedProperty, ensureDirectoryExistence } = require('./utils.js');

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
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return parseGherkinContent(fileContent);
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

function reset() {
    config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
    const directoryPath = config.directoryPath;
    if (!directoryPath) {
        console.error('directoryPath non è definito nel file config.json');
        return null;
    }
    let featureFiles = getFiles(directoryPath);
    updateFeatureFilesCopy(JSON.parse(JSON.stringify(featureFiles)));
    return true;
}

function updateFeatureFile(featureId, field, newValue) {
    let featureFile = getFeatureFilesCopy().find(file => file.featureId === featureId);
    if (featureFile) {
        setNestedProperty(featureFile, field, newValue);
        return featureFile;
    }
    return null;
}

// TODO: Actually remove tag only from scenario, need to remove from feature tags too (add test also)
function removeTag(featureId, scenarioId, tag) {
    let featureFile = getFeatureFilesCopy().find(file => file.featureId === featureId);
    if (featureFile) {
        let scenario = featureFile.feature.children.find(child => child.scenario && child.scenario.id === scenarioId);
        if (scenario) {
            let tagIndex = scenario.scenario.tags.findIndex(t => t.name === tag);
            if (tagIndex > -1) {
                scenario.scenario.tags.splice(tagIndex, 1);
                let scenarioIndex = featureFile.feature.children.findIndex(child => child.scenario && child.scenario.id === scenarioId);
                featureFile.feature.children[scenarioIndex] = scenario;
                let featureIndex = getFeatureFilesCopy().findIndex(file => file.featureId === featureId);
                getFeatureFilesCopy()[featureIndex] = featureFile;
                return true;
            }
        }
    }
    return null;
}

// TODO: Actually add Tag only to scenario, need to add tag to feature tags too (add test also)
function addTag(featureId, scenarioId, tag) {
    let featureFile = getFeatureFilesCopy().find(file => file.featureId === featureId);
    if (featureFile) {
        let scenario = featureFile.feature.children.find(child => child.scenario && child.scenario.id === scenarioId);
        if (scenario) {
            let tagExists = scenario.scenario.tags.some(tag => tag.name === tag);
            if (!tagExists) {
                scenario.scenario.tags.push({ name: tag });
                let scenarioIndex = featureFile.feature.children.findIndex(child => child.scenario && child.scenario.id === scenarioId);
                featureFile.feature.children[scenarioIndex] = scenario;
                let featureIndex = getFeatureFilesCopy().findIndex(file => file.featureId === featureId);
                getFeatureFilesCopy()[featureIndex] = featureFile;
                return true;
            }
        }
    }
    return null;
}

// Following function needs to be tested
function saveOnDisk() {
    try {
        const outputFolder = config.outputFolder;
        const keepFolderStructure = config.keepFolderStructure;
        const directoryPath = config.directoryPath;
        getFeatureFilesCopy().forEach(featureFile => {
            const gherkinText = gherkinDocumentToString(featureFile);
            let outputUrl = featureFile.path.replace(directoryPath, outputFolder);
            if (keepFolderStructure) {
                outputUrl = outputUrl.replace(/\\/g, '\\\\');
            }
            ensureDirectoryExistence(outputUrl);
            fs.writeFileSync(outputUrl, gherkinText);
        });
        return true;
    } catch (error) {
        console.error(`Error saving file: ${error}`);
        return null;
    }
}

// Works only if tag is present in scenario tags, need to be fixed and tested
function deleteAllOccurencyOfTag(tag) {
    try {
        let tagFound = false;
        getFeatureFilesCopy().forEach(featureFile => {
            featureFile.feature.children.forEach(child => {
                if (child.scenario) {
                    let tagIndex = child.scenario.tags.findIndex(t => t.name === tag);
                    if (tagIndex > -1) {
                        child.scenario.tags.splice(tagIndex, 1);
                        tagFound = true;
                    }
                }
            });
        });
        return tagFound ? true : null;
    } catch (error) {
        console.error(`Error deleting tag: ${error}`);
        return null;
    }
}

// Bug needs to be investigated, seems not to be invoked
function updateAllOccurencyOfTag(tag, newTag) {
    let tagExists = false;
    let newTagExists = false;
    getFeatureFilesCopy().forEach(featureFile => {
        featureFile.feature.children.forEach(child => {
            if (child.scenario) {
                let tagIndex = child.scenario.tags.findIndex(t => t.name === tag);
                if (tagIndex > -1) {
                    tagExists = true;
                    let newTagIndex = child.scenario.tags.findIndex(t => t.name === newTag);
                    if (newTagIndex > -1) {
                        newTagExists = true;
                    } else {
                        child.scenario.tags[tagIndex].name = newTag;
                    }
                }
            }
        });
    });
    return tagExists && !newTagExists ? true : null;
}

module.exports = {
    updateFeatureFilesCopy,
    getFeatureFilesCopy,
    getFiles,
    getScenarios,
    reset,
    parseGherkinContent,
    gherkinDocumentToString,
    updateFeatureFile,
    removeTag,
    addTag,
    saveOnDisk,
    deleteAllOccurencyOfTag,
    updateAllOccurencyOfTag
};