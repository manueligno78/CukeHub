const request = require('supertest');
const { server, getFiles, getScenarios } = require('../app.js');
const fs = require('fs');
const path = require('path');

let expect;

before(async () => {
  expect = (await import('chai')).expect;
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
        directoryPath: 'testDir',
        gitProjectUrl: 'https://github.com/manueligno78/CukeHub.git',
        gitBranch: 'main',
        folderToExclude: 'node_modules',
        isConfigurated: true
      });
    expect(response.statusCode).to.equal(302);
  });
});