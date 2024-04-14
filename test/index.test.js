const assert = require('assert');
const server = require('../index.js'); // Assicurati che questo percorso sia corretto
const request = require('supertest')(server);

describe('Express Server Test', () => {

    after((done) => {
        server.close(() => {
            console.log('Server chiuso');
            done();
        });
    });

    it('Should return a 302 response for the route /', (done) => {
        request.get('/')
        .expect(302)
        .end((err, res) => {
            if (err) return done(err);
            done();
        });
    });

    it('Should return a 200 response for the route /settings', (done) => {
        request.get('/settings')
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);
            done();
        });
    });
});
