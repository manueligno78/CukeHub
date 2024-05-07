const assert = require('assert');
const sinon = require('sinon');
const fs = require('fs');
const { updateFeatureFilesCopy,
    getFeatureFilesCopy,
    getFiles,
    getScenarios,
    parseGherkinContent,
    reset,
    updateFeatureFile,
    removeTag,
    addTag,
    saveOnDisk,
    deleteAllOccurencyOfTag,
    updateAllOccurencyOfTag
} = require('../featureFilesModule');

describe('featureFilesModule', function () {
    describe('#updateFeatureFilesCopy()', function () {
        it('should update featureFilesCopy', function () {
            const newData = ['newData'];
            updateFeatureFilesCopy(newData);
            assert.deepStrictEqual(getFeatureFilesCopy(), newData);
        });
    });

    describe('#getFeatureFilesCopy()', function () {
        it('should return featureFilesCopy', function () {
            const data = ['data'];
            updateFeatureFilesCopy(data);
            assert.deepStrictEqual(getFeatureFilesCopy(), data);
        });
    });

    describe('#getFiles()', function () {
        it('should return an array of files', function () {
            const files = getFiles('./test/resources');
            assert(Array.isArray(files));
        });

        it('should return an array of .feature files', function () {
            const files = getFiles('./test/resources');
            files.forEach(file => {
                assert(file.name.endsWith('.feature'));
            });
        });
    });

    describe('#getScenarios()', function () {
        it('should return scenarios from a file', function () {
            const filePath = './test/resources/file.feature';
            const scenarios = getScenarios(filePath);
            assert(Array.isArray(scenarios.feature.children));
        });
    });

    describe('#parseGherkinContent()', function () {

        it('should parse Gherkin content and return an object', function () {
            const content = `
        Feature: Some terse yet descriptive text of what is desired
            Scenario: Some determinable business situation
                Given some precondition
                And some other precondition
                When some action by the actor
                And some other action
                And yet another action
                Then some testable outcome is achieved
                And something else we can check happens too
      `;
            const result = parseGherkinContent(content);
            assert(result);
            assert(result.featureId);
            assert.deepStrictEqual(result.tags, []);
            assert(result.feature);
            assert.strictEqual(result.feature.name, 'Some terse yet descriptive text of what is desired');
            assert.strictEqual(result.feature.children.length, 1);
            const scenario = result.feature.children[0].scenario;
            assert(scenario);
            assert.strictEqual(scenario.name, 'Some determinable business situation');
            assert.strictEqual(scenario.numberOfSteps, 7);
        });

        it('should parse Gherkin content with feature tags and return an object', function () {
            const content = `
        @tag1 @tag2
        Feature: Some terse yet descriptive text of what is desired
            Scenario: Some determinable business situation
                Given some precondition
                And some other precondition
                When some action by the actor
                And some other action
                And yet another action
                Then some testable outcome is achieved
                And something else we can check happens too
        `;
            const result = parseGherkinContent(content);
            assert(result);
            assert(result.featureId);
            assert.deepStrictEqual(result.tags, [
                { tag: "@tag1", featureId: result.featureId },
                { tag: "@tag2", featureId: result.featureId }
            ]);
            assert(result.feature);
            assert.strictEqual(result.feature.name, 'Some terse yet descriptive text of what is desired');
            assert.strictEqual(result.feature.children.length, 1);
            const scenario = result.feature.children[0].scenario;
            assert(scenario);
            assert.strictEqual(scenario.name, 'Some determinable business situation');
            assert.strictEqual(scenario.numberOfSteps, 7);
        });

        it('should parse Gherkin content with scenario tags return an object', function () {
            const content = `
        Feature: Some terse yet descriptive text of what is desired
            @tag1 @tag2
            Scenario: Some determinable business situation
                Given some precondition
                And some other precondition
                When some action by the actor
                And some other action
                And yet another action
                Then some testable outcome is achieved
                And something else we can check happens too
        `;
            const result = parseGherkinContent(content);
            assert(result);
            assert(result.featureId);
            assert.deepStrictEqual(result.tags, [{ tag: "@tag1", scenario: 'Some determinable business situation', featureId: result.featureId }, { tag: "@tag2", scenario: 'Some determinable business situation', featureId: result.featureId }]);
            assert(result.feature);
            assert.strictEqual(result.feature.name, 'Some terse yet descriptive text of what is desired');
            assert.strictEqual(result.feature.children.length, 1);
            const scenario = result.feature.children[0].scenario;
            assert(scenario);
            assert.strictEqual(scenario.name, 'Some determinable business situation');
            assert.strictEqual(scenario.numberOfSteps, 7);
        });

        it('should parse Gherkin content with scenario outline and examples return an object', function () {
            const content = `
        Feature: Some terse yet descriptive text of what is desired
            Scenario Outline: Some determinable business situation
                Given some precondition
                And some other precondition
                When some action by the actor
                And some other action
                And yet another action
                Then some testable outcome is achieved
                And something else we can check happens too
                Examples:
                    | name | age |
                    | John | 25  |
                    | Jane | 22  |
            `;
            const result = parseGherkinContent(content);
            assert(result);
            assert(result.featureId);
            assert.deepStrictEqual(result.tags, []);
            assert(result.feature);
            assert.strictEqual(result.feature.name, 'Some terse yet descriptive text of what is desired');
            assert.strictEqual(result.feature.children.length, 1);
            const scenario = result.feature.children[0].scenario;
            assert(scenario);
            assert.strictEqual(scenario.name, 'Some determinable business situation');
            assert.strictEqual(scenario.numberOfSteps, 7);
            assert.strictEqual(scenario.numberOfExamples, 2);
        }
        );

        it('should parse Gherkin content with feature description and return an object', function () {
            const content = `
        Feature: Some terse yet descriptive text of what is desired
        As a user
        I want to do something
        So that I can achieve something
            Scenario: Some determinable business situation
                Given some precondition
                And some other precondition
                When some action by the actor
                And some other action
                And yet another action
                Then some testable outcome is achieved
                And something else we can check happens too
        `;
            const result = parseGherkinContent(content);
            assert(result);
            assert(result.featureId);
            assert.deepStrictEqual(result.tags, []);
            assert(result.feature);
            assert.strictEqual(result.feature.name, 'Some terse yet descriptive text of what is desired');
            assert.strictEqual(result.feature.description, '        As a user\n        I want to do something\n        So that I can achieve something');
            assert.strictEqual(result.feature.children.length, 1);
            const scenario = result.feature.children[0].scenario;
            assert(scenario);
            assert.strictEqual(scenario.name, 'Some determinable business situation');
            assert.strictEqual(scenario.numberOfSteps, 7);
        }
        );

        it('should parse Gherkin content with scenario description and return an object', function () {
            const content = `
        Feature: Some terse yet descriptive text of what is desired
            Scenario: Some determinable business situation
            As a user
            I want to do something
            So that I can achieve something
                Given some precondition
                And some other precondition
                When some action by the actor
                And some other action
                And yet another action
                Then some testable outcome is achieved
                And something else we can check happens too
            `;
            const result = parseGherkinContent(content);
            assert(result);
            assert(result.featureId);
            assert.deepStrictEqual(result.tags, []);
            assert(result.feature);
            assert.strictEqual(result.feature.name, 'Some terse yet descriptive text of what is desired');
            assert.strictEqual(result.feature.children.length, 1);
            const scenario = result.feature.children[0].scenario;
            assert(scenario);
            assert.strictEqual(scenario.name, 'Some determinable business situation');
            assert.strictEqual(scenario.description, '            As a user\n            I want to do something\n            So that I can achieve something');
            assert.strictEqual(scenario.numberOfSteps, 7);
        }
        );

        it('should parse Gherkin content with data tables and return an object', function () {
            const content = `
        Feature: Some terse yet descriptive text of what is desired
            Scenario: Some determinable business situation
                Given some precondition
                And some other precondition
                When some action by the actor
                And some other action
                And yet another action
                Then some testable outcome is achieved
                And something else we can check happens too
                And the following data
                    | name | age |
                    | John | 25  |
                    | Jane | 22  |
                `;
            const result = parseGherkinContent(content);
            assert(result);
            assert(result.featureId);
            assert.deepStrictEqual(result.tags, []);
            assert(result.feature);
            assert.strictEqual(result.feature.name, 'Some terse yet descriptive text of what is desired');
            assert.strictEqual(result.feature.children.length, 1);
            const scenario = result.feature.children[0].scenario;
            assert(scenario);
            assert.strictEqual(scenario.name, 'Some determinable business situation');
            assert.strictEqual(scenario.numberOfSteps, 8);
            assert.strictEqual(scenario.steps[7].dataTable.rows.length, 3);
        });
    });

    describe('reset()', function () {
        it('should reset featureFilesCopy', function () {
            updateFeatureFilesCopy(['data']);
            reset();
            assert.deepStrictEqual(getFeatureFilesCopy(), ['data']);
        });
    });

    describe('updateFeatureFile()', function () {
        it('should update a feature file', function () {
            const featureId = 'file.feature';
            const field = 'feature.name';
            const newValue = 'new name';
            const featureFile = { featureId, feature: { name: 'old name' } };
            updateFeatureFilesCopy([featureFile]);
            const updatedFeatureFile = updateFeatureFile(featureId, field, newValue);
            assert.strictEqual(updatedFeatureFile.feature.name, newValue);
        });
    });

    describe('removeTag()', function () {
        it('should remove a tag from a scenario and return true', function () {
            const featureId = 'file.feature';
            const scenarioId = 'scenario1';
            const tag = '@tag';
            const featureFile = {
                featureId,
                feature: {
                    children: [
                        {
                            scenario: {
                                id: scenarioId,
                                tags: [{ name: tag }]
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            const result = removeTag(featureId, scenarioId, tag);
            assert.strictEqual(result, true);
        });
        it('should remove a tag from a scenario and its related object on featureFilesCopy', function () {
            const featureId = 'file.feature';
            const scenarioId = 'scenario1';
            const tag = '@tag';
            const featureFile = {
                featureId,
                feature: {
                    tags: [{ name: tag }],
                    children: [
                        {
                            scenario: {
                                id: scenarioId,
                                tags: [{ name: tag }]
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            removeTag(featureId, scenarioId, tag);
            const featureFilesCopy = getFeatureFilesCopy();
            const featureFileCopy = featureFilesCopy.find(file => file.featureId === featureId);
            const scenario = featureFileCopy.feature.children.find(child => child.scenario && child.scenario.id === scenarioId);
            assert.strictEqual(scenario.scenario.tags.length, 0);
            assert.strictEqual(featureFileCopy.feature.tags.length, 1);
        });

        it('should remove a tag from a feature and its related object on featureFilesCopy', function () {
            const featureId = 'file.feature';
            const tag = '@tag';
            const featureFile = {
                featureId,
                feature: {
                    tags: [{ name: tag }],
                    children: [
                        {
                            scenario: {
                                tags: [{ name: tag }]
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            removeTag(featureId, null, tag);
            const featureFilesCopy = getFeatureFilesCopy();
            const featureFileCopy = featureFilesCopy.find(file => file.featureId === featureId);
            assert.strictEqual(featureFileCopy.feature.tags.length, 0);
            assert.strictEqual(featureFileCopy.feature.children[0].scenario.tags.length, 1);
        });
    });

    describe('addTag()', function () {
        it('should add a tag to a scenario', function () {
            const featureId = 'file.feature';
            const scenarioId = 'scenario1';
            const tag = '@tag';
            const featureFile = {
                featureId,
                feature: {
                    children: [
                        {
                            scenario: {
                                id: scenarioId,
                                tags: []
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            const result = addTag(featureId, scenarioId, tag);
            assert.strictEqual(result, true);
        });
        it('should add a tag to a scenario and its related object on featureFilesCopy', function () {
            const featureId = 'file.feature';
            const scenarioId = 'scenario1';
            const tag = '@tag';
            const featureFile = {
                featureId,
                feature: {
                    children: [
                        {
                            scenario: {
                                id: scenarioId,
                                tags: []
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            addTag(featureId, scenarioId, tag);
            const featureFilesCopy = getFeatureFilesCopy();
            const featureFileCopy = featureFilesCopy.find(file => file.featureId === featureId);
            const scenario = featureFileCopy.feature.children.find(child => child.scenario && child.scenario.id === scenarioId);
            assert.strictEqual(scenario.scenario.tags.length, 1);
            assert.strictEqual(scenario.scenario.tags[0].name, tag);
            assert.strictEqual(featureFileCopy.feature.tags.length, 0);
        });

        it('should add a tag to a feature and its related object on featureFilesCopy', function () {
            const featureId = 'file.feature';
            const tag = '@tag';
            const featureFile = {
                featureId,
                feature: {
                    tags: [],
                    children: [
                        {
                            scenario: {
                                tags: []
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            addTag(featureId, null, tag);
            const featureFilesCopy = getFeatureFilesCopy();
            const featureFileCopy = featureFilesCopy.find(file => file.featureId === featureId);
            assert.strictEqual(featureFileCopy.feature.tags.length, 1);
            assert.strictEqual(featureFileCopy.feature.tags[0].name, tag);
            assert.strictEqual(featureFileCopy.feature.children[0].scenario.tags.length, 0);
        });
    });

    describe('deleteAllOccurencyOfTag()', function () {
        it('should delete all occurencies of a tag', function () {
            const tag = '@tag';
            const featureFile = {
                featureId: 'file.feature',
                feature: {
                    children: [
                        {
                            scenario: {
                                tags: [{ name: tag }]
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            const result = deleteAllOccurencyOfTag(tag);
            assert.strictEqual(result, true);
        });

        it('should delete all occurencies of a tag and its feature and scenarios related object on featureFilesCopy', function () {
            const tag = '@tag';
            const featureFile = {
                featureId: 'file.feature',
                feature: {
                    tags: [{ name: tag }],
                    children: [
                        {
                            scenario: {
                                tags: [{ name: tag }]
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            deleteAllOccurencyOfTag(tag);
            const featureFilesCopy = getFeatureFilesCopy();
            const featureFileCopy = featureFilesCopy.find(file => file.featureId === 'file.feature');
            assert.deepStrictEqual(featureFileCopy.feature.tags, []);
            const scenario = featureFileCopy.feature.children.find(child => child.scenario);
            assert.deepStrictEqual(scenario.scenario.tags, []);
        });

        it('should return false if tag is not found', function () {
            const tag = '@tag';
            const featureFile = {
                featureId: 'file.feature',
                feature: {
                    children: [
                        {
                            scenario: {
                                tags: [{ name: '@anotherTag' }]
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            const result = deleteAllOccurencyOfTag(tag);
            assert.strictEqual(result, null);
        });
    });

    describe('updateAllOccurencyOfTag()', function () {
        it('should update all occurencies of a tag', function () {
            const tag = '@tag';
            const newTag = '@newTag';
            const featureFile = {
                featureId: 'file.feature',
                feature: {
                    children: [
                        {
                            scenario: {
                                tags: [{ name: tag }]
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            const result = updateAllOccurencyOfTag(tag, newTag);
            assert.strictEqual(result, true);
        });

        it('should update all occurencies of a tag and its feature and scenarios related object on featureFilesCopy', function () {
            const tag = '@tag';
            const newTag = '@newTag';
            const featureFile = {
                featureId: 'file.feature',
                feature: {
                    tags: [{ name: tag }],
                    children: [
                        {
                            scenario: {
                                tags: [{ name: tag }]
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            updateAllOccurencyOfTag(tag, newTag);
            const featureFilesCopy = getFeatureFilesCopy();
            const featureFileCopy = featureFilesCopy.find(file => file.featureId === 'file.feature');
            assert.strictEqual(featureFileCopy.feature.tags[0].name, newTag);
            const scenario = featureFileCopy.feature.children.find(child => child.scenario);
            assert.strictEqual(scenario.scenario.tags[0].name, newTag);
        });

        it('should return null if tag is not found', function () {
            const tag = '@tag';
            const newTag = '@newTag';
            const featureFile = {
                featureId: 'file.feature',
                feature: {
                    children: [
                        {
                            scenario: {
                                tags: [{ name: '@anotherTag' }]
                            }
                        }
                    ]
                }
            };
            updateFeatureFilesCopy([featureFile]);
            const result = updateAllOccurencyOfTag(tag, newTag);
            assert.strictEqual(result, null);
        });
    });
});