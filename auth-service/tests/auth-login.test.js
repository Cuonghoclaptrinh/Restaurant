const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
require('../src/models/user');
require('../src/models/userProfile');

describe('Auth Service - Login', () => {
    beforeAll(async () => {
        // Kết nối & sync DB sạch cho test
        await sequelize.authenticate();
        await sequelize.sync({ force: true });

        // Seed admin (dùng cùng hàm trong server)
        const seedAdmin = require('../src/seedAdmin');
        await seedAdmin();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('POST /login with correct credentials should return token', async () => {
        const res = await request(app)
            .post('/login')   // hoặc '/api/auth/login' nếu bạn dùng prefix
            .send({
                email: 'admin@system.com',
                password: 'admin123',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('email', 'admin@system.com');
    });

    it('POST /login with wrong password should return 401', async () => {
        const res = await request(app)
            .post('/login')
            .send({
                email: 'admin@system.com',
                password: 'sai_mat_khau',
            });

        expect(res.statusCode).toBe(401);
    });
});
