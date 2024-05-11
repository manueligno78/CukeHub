
// ghernkinDocumentToString: converts a gherkin document to a string,
// used to export the document to a file

function gherkinDocumentToString(gherkinDocument) {
    //console.log('gherkinDocument:', JSON.stringify(gherkinDocument, null, 2));
    // Check if the document contains a feature otherwise return an error
    if (!gherkinDocument.feature.name) {
        return 'Error: The document is empty';
    }
    let gherkinText = '';
    // Add the feature tags, if any
    if (gherkinDocument.feature.tags && gherkinDocument.feature.tags.length > 0) {
        const tags = gherkinDocument.feature.tags.map(tag => tag.name).join(' ');
        gherkinText += `${tags}\n`;
    }
    // Add the feature title
    gherkinText += `Feature: ${gherkinDocument.feature.name}\n`;
    // Add the feature description, if any
    if (gherkinDocument.feature.description) {
        gherkinText += `${gherkinDocument.feature.description}\n`;
    }
    // Add each scenario or background
    gherkinDocument.feature.children.forEach((child, index, array) => {
        gherkinText += '\n';
        if (child.background) { // TODO: bug: title is not displayed
            gherkinText += `\tBackground: ${child.background.name}\n`;
            // Add each step of the background
            child.background.steps.forEach(step => {
                gherkinText += `\t\t${step.keyword} ${step.text}\n`;
            });
            // Add a blank line after the background
            gherkinText += '\n';
        } else if (child.scenario) {
            // Add the scenario tags, if any
            if (child.scenario.tags && child.scenario.tags.length > 0) {
                const tags = child.scenario.tags.map(tag => tag.name).join(' ');
                gherkinText += `\t${tags}\n`;
            }
            // Check if the scenario is an outline
            if (child.scenario.examples && child.scenario.examples.length > 0) {
                gherkinText += `\tScenario Outline: ${child.scenario.name}\n`;
            } else {
                gherkinText += `\tScenario: ${child.scenario.name}\n`;
            }
            // Add the scenario description, if any
            if (child.scenario.description) {
                gherkinText += `${child.scenario.description}\n`;
            }
            // Add each step of the scenario
            child.scenario.steps.forEach((step, stepIndex) => {
                gherkinText += `\t\t${step.keyword}${step.text}`;
                // Check if the step has a datatable
                if (step.dataTable) {
                    step.dataTable.rows.forEach(row => {
                        gherkinText += '\n\t\t\t| ' + row.cells.map(cell => cell.value.replace(/\|/g, '\\\\|')).join(' | ') + ' |';
                    });
                }
                if (stepIndex < child.scenario.steps.length) {
                    gherkinText += '\n';
                }
            });
            // Add the Examples, if any
            if (child.scenario.examples && child.scenario.examples.length > 0) {
                child.scenario.examples.forEach(example => {
                    gherkinText += `\n\t\tExamples:\n`;
                    // Add the table header
                    const header = example.tableHeader.cells.map(cell => cell.value).join(' | ');
                    gherkinText += `\t\t\t| ${header} |\n`;
                    // Add the table rows
                    example.tableBody.forEach((row, rowIndex) => {
                        // fix bug: escape pipe character
                        const rowText = row.cells.map(cell => cell.value.replace(/\|/g, '\\\\|')).join(' | ');
                        gherkinText += `\t\t\t| ${rowText} |`;
                        if (rowIndex < example.tableBody.length) {
                            gherkinText += '\n';
                        }
                    });
                });
            }
            // // Add a blank line after each scenario, except the last one
            // if (index < array.length - 1) {
            //     gherkinText += '\n';
            // }
        }
    });
    return gherkinText;
}

module.exports = gherkinDocumentToString;