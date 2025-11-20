// tests/reservation-crud.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { sequelize, Table } = require('../src/models');

// ✅ mock node-fetch để không gọi thật order-service
jest.mock('node-fetch', () =>
    jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: async () => ({ id: 999 }),
            text: async () => 'mocked order-service response',
        })
    )
);

function generateToken(role = 'ADMIN', id = 1) {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    return jwt.sign({ id, role }, secret, { expiresIn: '1h' });
}

describe('Reservation Service - Reservations CRUD', () => {
    let createdReservationId;

    beforeAll(async () => {
        await sequelize.authenticate();
        await sequelize.sync({ force: true });

        // Seed 1 table để create reservation dùng
        await Table.create({
            tableNumber: 1,
            capacity: 4,
            zone: 'indoor',
            status: 'available',
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('POST /reservations with USER token → 201', async () => {
        const token = generateToken('USER', 10);

        const res = await request(app)
            .post('/reservations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customerName: 'Test User',
                customerPhone: '0123456789',
                tableNumber: 1,
                partySize: 2,
                reservationDate: '2025-01-01',
                reservationTime: '18:00',
                durationMinutes: 120,
                notes: 'Test reservation',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('customerName', 'Test User');
        expect(res.body).toHaveProperty('status', 'pending');

        createdReservationId = res.body.id;
    });

    it('GET /reservations without token → 401', async () => {
        const res = await request(app).get('/reservations');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
    });

    it('GET /reservations with ADMIN token → 200 & contains created reservation', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .get('/reservations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);

        const found = res.body.find((r) => r.id === createdReservationId);
        expect(found).toBeTruthy();
        expect(found).toHaveProperty('customerName', 'Test User');
    });

    it('GET /reservations/:id with ADMIN token → 200', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .get(`/reservations/${createdReservationId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', createdReservationId);
        expect(res.body).toHaveProperty('customerName', 'Test User');
    });

    it('PUT /reservations/:id update status → 200', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .put(`/reservations/${createdReservationId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'confirmed' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', createdReservationId);
        expect(res.body).toHaveProperty('status', 'confirmed');
    });

    it('GET /reservations/available-tables → 200', async () => {
        const res = await request(app).get(
            '/reservations/available-tables?date=2025-01-02&time=18:00&partySize=2'
        );

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('DELETE /reservations/:id with ADMIN token → 204', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .delete(`/reservations/${createdReservationId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(204);
    });

    it('GET /reservations/:id after delete → 404', async () => {
        const token = generateToken('ADMIN', 1);

        const res = await request(app)
            .get(`/reservations/${createdReservationId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'Reservation not found');
    });
});
