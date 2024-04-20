const request = require('supertest');
const { server, getFiles, getScenarios } = require('../index.js');
const fs = require('fs');
const path = require('path');

let expect;

before(async () => {
  expect = (await import('chai')).expect;
});

describe('getFiles', () => {
  it('should return an array of files', () => {
    const files = getFiles(__dirname);
    expect(Array.isArray(files)).to.be.true;
  });
});
describe('getScenarios', () => {
  it('should return null if file does not exist', () => {
    const scenarios = getScenarios('nonexistent.file');
    expect(scenarios).to.be.null;
  });
});

describe('HTTP routes', () => {
  after(() => {
    server.close();
  });

  it('should return 302 for GET /', async () => {
    const response = await request(server).get('/');
    expect(response.statusCode).to.equal(302);
  });

  it('should return 200 for GET /settings', async () => {
    const response = await request(server).get('/settings');
    expect(response.statusCode).to.equal(200);
  });

  it('should return 302 for POST /save-settings', async () => {
    const response = await request(server)
      .post('/save-settings')
      .send({
        directoryPath: __dirname,
        testCommand: 'npm test',
        folderToExclude: 'node_modules',
        outputFolder: path.join(__dirname, 'output'),
        keepFolderStructure: 'on'
      });
    expect(response.statusCode).to.equal(302);
  });
});