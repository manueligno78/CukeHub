# CukeHub Project

CukeHub is a Node.js-based application for managing Gherkin Cucumber features, scenarios, and tags. It provides a user-friendly and flexible interface for viewing and editing your feature files and the scenarios they contain.


[![Node.js CI](https://github.com/manueligno78/CukeHub/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/manueligno78/CukeHub/actions/workflows/node.js.yml)

[![Java CI with Maven](https://github.com/manueligno78/CukeHub/actions/workflows/maven.yml/badge.svg)](https://github.com/manueligno78/CukeHub/actions/workflows/maven.yml)

## Prerequisites

- Node.js 16.13.0
- npm 8.1.0

## NodeJS Installation

### macOS

1. Install Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Add Homebrew to your PATH:

```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

3. Install Node.js with Homebrew::

```bash
brew install node
```

### Windows

Download and install Node.js from the official Node.js website.

### Linux
Install Node.js using your distribution's package manager. For example, on Ubuntu:
```bash
sudo apt-get install nodejs
```

## Dependencies installation
In order to run the application, dependencies needs to be installed:
```bash
npm install
```
This will start the server of CukeHub application on localhost:3000.

## Running
To run the application, navigate to the project directory in your terminal and execute the following command:
```bash
node index.js
```
This will start the server of CukeHub application on localhost:3000.

## Usage

Once the CukeHub server is running, you can access the application by opening a web browser and navigating to `http://localhost:3000`.

The main interface presents a list of your feature files. You can click on a feature to view its scenarios and tags. To edit a feature or scenario, click on its name, make your changes, and then click outside of the text field to save your changes.

Tags can be added to a scenario by clicking on the 'Add Tag' button, entering the tag name, and pressing enter. To remove a tag, click on the 'x' next to the tag name.

Remember to save your changes before leaving the page or they will be lost. If you encounter any issues while using CukeHub, please report them on the project's GitHub page.