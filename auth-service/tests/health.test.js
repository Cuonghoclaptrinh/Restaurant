
const request = require('supertest');
const app = require('../src/app');

describe('Auth Service - Health', () => {
    it('GET /health should return OK', async () => {
        const res = await request(app).get('/health');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'OK');
        expect(res.body).toHaveProperty('service', 'auth-service');
    });
});
