const assert = require('assert');
const server = require('../index.js'); // Assicurati che questo percorso sia corretto
const request = require('supertest')(server);

describe('Express Server Test', () => {
  it('Should return a 302 response for the route /', (done) => {
    request.get('/')
      .expect(302)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});
