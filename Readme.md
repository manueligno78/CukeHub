# CukeHub Project

The CukeHub project is a Node.js based application.

## Prerequisites

- Node.js 16.13.0
- npm 8.1.0

## Installation

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

### Installing required dependencies
In order to run the application, dependencies needs to be installed:
```bash
npm install
```
This will start the server of CukeHub application on localhost:3000.

### Running
To run the application, navigate to the project directory in your terminal and execute the following command:
```bash
node index.js
```
This will start the server of CukeHub application on localhost:3000.