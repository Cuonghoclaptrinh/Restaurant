// tests/order-crud.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { sequelize } = require('../src/models');

// Đảm bảo models được register vào sequelize trước khi sync
require('../src/models/order');
require('../src/models/orderItem');

function generateToken(role = 'ADMIN', id = 1) {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    return jwt.sign({ id, role }, secret, { expiresIn: '1h' });
}

describe('Order Service - Orders CRUD', () => {
    let createdOrderId;

    beforeAll(async () => {
        await sequelize.authenticate();
        await sequelize.sync({ force: true }); // DB test, xóa sạch mỗi lần chạy
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('POST /orders dine-in with tableId & USER token → 201', async () => {
        const token = generateToken('USER', 10);

        const res = await request(app)
            .post('/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                orderType: 'dine-in',
                tableId: 1,
                customerName: 'Test User',
                customerPhone: '0123456789',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('orderType', 'dine-in');
        expect(res.body).toHaveProperty('tableId', 1);
        expect(res.body).toHaveProperty('status', 'pending');

        createdOrderId = res.body.id;
    });

    it('POST /orders dine-in without tableId → 400', async () => {
        const token = generateToken('USER', 11);

        const res = await request(app)
            .post('/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                orderType: 'dine-in',
                // thiếu tableId
                customerName: 'No Table',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty(
            'message',
            'tableId is required for dine-in orders'
        );
    });

    it('GET /orders without token → 401', async () => {
        const res = await request(app).get('/orders');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
    });

    it('GET /orders with ADMIN token → 200 & contain created order', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .get('/orders')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);

        const found = res.body.find((o) => o.id === createdOrderId);
        expect(found).toBeTruthy();
        expect(found).toHaveProperty('orderType', 'dine-in');
        expect(found).toHaveProperty('tableId', 1);
    });

    it('GET /orders/:id with ADMIN token → 200', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .get(`/orders/${createdOrderId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', createdOrderId);
        expect(res.body).toHaveProperty('orderType', 'dine-in');
    });

    it('PUT /orders/:id update status → 200', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .put(`/orders/${createdOrderId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'confirmed' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', createdOrderId);
        expect(res.body).toHaveProperty('status', 'confirmed');
    });

    it('DELETE /orders/:id with ADMIN token → 204', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .delete(`/orders/${createdOrderId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(204);
    });

    it('GET /orders/:id after delete → 404', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .get(`/orders/${createdOrderId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'Order not found');
    });
});
