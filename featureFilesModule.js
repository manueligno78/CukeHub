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
        // If the field path contains a tag validate the tag (start with @ and no spaces)
        if (field.includes('tags')) {
            if (!newValue.startsWith('@') || newValue.includes(' ')) {
                return null;
            }
        }
        setNestedProperty(featureFile, field, newValue);
        return featureFile;
    }
    return null;
}

function removeTag(featureId, scenarioId, tag) {
    let featureFile = getFeatureFilesCopy().find(file => file.featureId === featureId);
    let result = null;
    if (featureFile) {
        // Remove tag from feature tags
        if (featureFile.feature.tags && featureFile.feature.tags.length > 0 && !scenarioId) {
            let tagIndex = featureFile.feature.tags.findIndex(t => t.name === tag);
            if (tagIndex > -1) {
                featureFile.feature.tags.splice(tagIndex, 1);
                let featureIndex = getFeatureFilesCopy().findIndex(file => file.featureId === featureId);
                getFeatureFilesCopy()[featureIndex] = featureFile;
                result = true;
            }
        }
        // Remove tag from scenario tags
        if (featureFile.feature.children && featureFile.feature.children.length > 0 && scenarioId) {
            let scenario = featureFile.feature.children.find(child => child.scenario && child.scenario.id === scenarioId);
            if (scenario) {
                let tagIndex = scenario.scenario.tags.findIndex(t => t.name === tag);
                if (tagIndex > -1) {
                    scenario.scenario.tags.splice(tagIndex, 1);
                    let scenarioIndex = featureFile.feature.children.findIndex(child => child.scenario && child.scenario.id === scenarioId);
                    featureFile.feature.children[scenarioIndex] = scenario;
                    let featureIndex = getFeatureFilesCopy().findIndex(file => file.featureId === featureId);
                    getFeatureFilesCopy()[featureIndex] = featureFile;
                    result = true;
                }
            }
        }
    }
    return result;
}

// TODO: Actually add Tag only to scenario, need to add tag to feature tags too (add test also)
function addTag(featureId, scenarioId, tag) {
    let result = null;
    // validate tag (start with @ and no spaces)
    if (!tag.startsWith('@') || tag.includes(' ')) {
        result = null;
        return result;
    }
    let featureFilesCopy = getFeatureFilesCopy();
    let featureFile = featureFilesCopy.find(file => file.featureId === featureId);
    if (featureFile) {
        // Add tag to feature tags
        if (!featureFile.feature.tags) {
            featureFile.feature.tags = [];
        }
        let featureTagExists = featureFile.feature.tags.some(existingTag => existingTag.name === tag);
        if (!featureTagExists && scenarioId === null) {
            featureFile.feature.tags.push({ name: tag });
            let featureIndex = featureFilesCopy.findIndex(file => file.featureId === featureId);
            featureFilesCopy[featureIndex] = featureFile;
            updateFeatureFilesCopy(featureFilesCopy);
            result = true;
        }
        // Add tag to scenario tags
        let scenario = featureFile.feature.children.find(child => child.scenario && child.scenario.id === scenarioId);
        if (scenario) {
            let tagExists = scenario.scenario.tags.some(existingTag => existingTag.name === tag);
            if (!tagExists && scenarioId !== null) {
                scenario.scenario.tags.push({ name: tag });
                let scenarioIndex = featureFile.feature.children.findIndex(child => child.scenario && child.scenario.id === scenarioId);
                featureFile.feature.children[scenarioIndex] = scenario;
                let featureIndex = featureFilesCopy.findIndex(file => file.featureId === featureId);
                featureFilesCopy[featureIndex] = featureFile;
                updateFeatureFilesCopy(featureFilesCopy);
                result = true;
            }
        }
    }
    return result;
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

function deleteAllOccurencyOfTag(tag) {
    try {
        let tagFound = false;
        let featureFilesCopy = getFeatureFilesCopy();
        featureFilesCopy.forEach(featureFile => {
            // Remove tag from feature tags
            if (featureFile.feature.tags) {
                let tagIndex = featureFile.feature.tags.findIndex(t => t.name === tag);
                if (tagIndex > -1) {
                    featureFile.feature.tags.splice(tagIndex, 1);
                    tagFound = true;
                }
            }
            // Remove tag from scenario tags
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
        // Update the original feature files array
        updateFeatureFilesCopy(featureFilesCopy);
        return tagFound ? true : null;
    } catch (error) {
        console.error(`Error deleting tag: ${error}`);
        return null;
    }
}

// Bug needs to be investigated, seems not to be invoked
function updateAllOccurencyOfTag(tag, newTag) {
    // validate tag (start with @ and no spaces)
    if (!newTag.startsWith('@') || newTag.includes(' ')) {
        return null;
    }
    let tagExists = false;
    let newTagExists = false;
    let featureFilesCopy = getFeatureFilesCopy();
    featureFilesCopy.forEach(featureFile => {
        // Update tag in feature tags
        if (featureFile.feature.tags) {
            let tagIndex = featureFile.feature.tags.findIndex(t => t.name === tag);
            if (tagIndex > -1) {
                tagExists = true;
                let newTagIndex = featureFile.feature.tags.findIndex(t => t.name === newTag);
                if (newTagIndex > -1) {
                    newTagExists = true;
                } else {
                    featureFile.feature.tags[tagIndex].name = newTag;
                }
            }
        }
        // Update tag in scenario tags
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
    // Update the original feature files array
    updateFeatureFilesCopy(featureFilesCopy);
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