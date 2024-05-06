const assert = require('assert');
const { updateFeatureFilesCopy, getFeatureFilesCopy, getFiles, parseGherkinContent } = require('../featureFilesModule');

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
                Given some <precondition>
                And some other <precondition>
                When some action by the actor
                And some other action
                And yet another action
                Then some testable outcome is achieved
                And something else we can check happens too
                    Examples:
                    | precondition | 
                    | precondition1 |
                    | precondition2 |
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
            assert.strictEqual(result.feature.description, 'As a user\nI want to do something\nSo that I can achieve something');
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
            assert.strictEqual(scenario.description, 'As a user\nI want to do something\nSo that I can achieve something');
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
            assert.strictEqual(scenario.dataTable.length, 2);
        }
        );
    });
});