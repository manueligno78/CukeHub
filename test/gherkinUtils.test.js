const assert = require('assert');
const gherkinDocumentToString = require('../gherkinUtils.js');

describe('gherkinDocumentToString', function () {
    it('should return an error for an empty document', function () {
        const gherkinDocument = {
            feature: {
                tags: [],
                name: '',
                description: '',
                children: []
            }
        };
        const result = gherkinDocumentToString(gherkinDocument);
        const expected = 'Error: The document is empty';
        assert.strictEqual(result, expected);
    });

    it('should correctly format a document with a single feature and no scenarios', function () {
        const gherkinDocument = {
            feature: {
                tags: [],
                name: 'My feature',
                description: 'This is my feature',
                children: []
            }
        };
        const result = gherkinDocumentToString(gherkinDocument);
        const expected = 'Feature: My feature\nThis is my feature\n';
        assert.strictEqual(result, expected);
    });

    it('should correctly format a document with a single feature and a single scenario', function () {
        const gherkinDocument = {
            feature: {
                tags: [],
                name: 'My feature',
                description: 'This is my feature',
                children: [
                    {
                        scenario: {
                            tags: [],
                            name: 'My scenario',
                            description: 'This is my scenario',
                            steps: []
                        }
                    }
                ]
            }
        };
        const result = gherkinDocumentToString(gherkinDocument);
        const expected = 'Feature: My feature\nThis is my feature\n\n\tScenario: My scenario\nThis is my scenario\n';
        assert.strictEqual(result, expected);
    });

    it('should correctly format a document with a single feature and a single scenario with a single step', function () {
        const gherkinDocument = {
            feature: {
                tags: [],
                name: 'My feature',
                description: 'This is my feature',
                children: [
                    {
                        scenario: {
                            tags: [],
                            name: 'My scenario',
                            description: 'This is my scenario',
                            steps: [
                                {
                                    keyword: 'Given ',
                                    text: 'I have a step'
                                }
                            ]
                        }
                    }
                ]
            }
        };
        const result = gherkinDocumentToString(gherkinDocument);
        const expected = 'Feature: My feature\nThis is my feature\n\n\tScenario: My scenario\nThis is my scenario\n\t\tGiven I have a step\n';
        assert.strictEqual(result, expected);
    });

    it('should correctly format a document with a single feature and a single scenario with a single step and a datatable', function () {
        const gherkinDocument = {
            feature: {
                tags: [],
                name: 'My feature',
                description: 'This is my feature',
                children: [
                    {
                        scenario: {
                            tags: [],
                            name: 'My scenario',
                            description: 'This is my scenario',
                            steps: [
                                {
                                    keyword: 'Given ',
                                    text: 'I have a step',
                                    dataTable: {
                                        rows: [
                                            {
                                                cells: [
                                                    { value: 'cell1' },
                                                    { value: 'cell2' }
                                                ]
                                            },
                                            {
                                                cells: [
                                                    { value: 'cell3' },
                                                    { value: 'cell4' }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        };
        const result = gherkinDocumentToString(gherkinDocument);
        const expected = 'Feature: My feature\nThis is my feature\n\n\tScenario: My scenario\nThis is my scenario\n\t\tGiven I have a step\n\t\t\t| cell1 | cell2 |\n\t\t\t| cell3 | cell4 |\n';
        assert.strictEqual(result, expected);
    });

    it('should correctly format a document with a single feature and a single scenario outline with an example', function () {
        const gherkinDocument = {
            feature: {
                tags: [],
                name: 'My feature',
                description: 'This is my feature',
                children: [
                    {
                        scenario: {
                            tags: [],
                            name: 'My scenario',
                            description: 'This is my scenario',
                            examples: [
                                {
                                    tableHeader: {
                                        cells: [
                                            { value: 'header1' },
                                            { value: 'header2' }
                                        ]
                                    },
                                    tableBody: [
                                        {
                                            cells: [
                                                { value: 'cell1' },
                                                { value: 'cell2' }
                                            ]
                                        },
                                        {
                                            cells: [
                                                { value: 'cell3' },
                                                { value: 'cell4' }
                                            ]
                                        }
                                    ]
                                }
                            ],
                            steps: []
                        }
                    }
                ]
            }
        };
        const result = gherkinDocumentToString(gherkinDocument);
        const expected = 'Feature: My feature\nThis is my feature\n\n\tScenario Outline: My scenario\nThis is my scenario\n\n\t\tExamples:\n\t\t\t| header1 | header2 |\n\t\t\t| cell1 | cell2 |\n\t\t\t| cell3 | cell4 |\n';
        assert.strictEqual(result, expected);
    });
});