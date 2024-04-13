const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { getFiles, notifyClients } = require('./utils');
const WebSocket = require('ws');

const directoryPath = path.join(__dirname, '../src/test/resources/features');

function appConfig(app) {
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/', (req, res) => {
    let featureFiles = getFiles(directoryPath);
    res.render('table', { feature: featureFiles});
  });
}

function serverConfig(server, wss) {
  wss.on('connection', ws => {
    ws.on('message', message => {
      exec(message, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        notifyClients(wss, `stdout: ${stdout}`);
      });
    });
  });
}

module.exports = { appConfig, serverConfig };