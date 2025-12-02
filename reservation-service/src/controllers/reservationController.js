const { trace, context } = require('@opentelemetry/api');
const tracer = trace.getTracer('reservation-service');

const { Reservation, Table } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const fetch = require('node-fetch');
const { publishReservationCreated } = require('../mq/publisher')


const ORDER_SERVICE_URL =
    process.env.ORDER_SERVICE_URL || 'http://order-service:3001'
class ReservationController {

    // GET /api/reservations
    static async getAll(req, res) {
        try {
            const { status, date, time } = req.query;
            const where = {};

            if (status) where.status = status;

            // lọc theo ngày + giờ
            if (date && time) {
                const start = new Date(`${date}T${time}`);
                const end = new Date(start);
                end.setHours(end.getHours() + 2);

                where.startTime = { [Op.gte]: start, [Op.lt]: end };
            }

            const reservations = await Reservation.findAll({
                where,
                include: [
                    { association: 'table', attributes: ['tableNumber', 'capacity', 'zone'] }
                ],
                order: [['startTime', 'ASC']]
            });

            res.json(reservations);

        } catch (error) {
            console.error('getAll error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/reservations/:id
    static async getById(req, res) {
        try {
            const reservation = await Reservation.findByPk(req.params.id, {
                include: [
                    { association: 'table' }
                ]
            });

            if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

            res.json(reservation);

        } catch (error) {
            console.error('getById error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/reservations
    static async create(req, res) {
        const span = tracer.startSpan('reservation.create', {
            attributes: {
                'app.feature': 'reservation',
            }
        });

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                span.setStatus({ code: 1, message: 'validation error' });
                span.setAttribute('validation.error_count', errors.array().length);
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                customerName,
                customerPhone,
                tableNumber,
                partySize,
                reservationDate,
                reservationTime,
                durationMinutes = 120,
                notes,
                status = 'pending',
            } = req.body;

            span.setAttribute('reservation.customer_name', customerName || 'unknown');
            span.setAttribute('reservation.table_number', tableNumber);
            span.setAttribute('reservation.party_size', partySize);

            const spanCtx = trace.setSpan(context.active(), span);

            // 🔹 Sub-span 1: find table
            const findTableSpan = tracer.startSpan('reservation.findTable', undefined, spanCtx);
            const table = await Table.findOne({
                where: {
                    tableNumber: parseInt(tableNumber, 10),
                },
            });
            findTableSpan.setAttribute('table.found', !!table);
            findTableSpan.end();

            if (!table) {
                span.setStatus({ code: 1, message: 'Table not found' });
                return res.status(404).json({ error: 'Table not found' });
            }

            // 🔹 Sub-span 2: build time window
            const timeSpan = tracer.startSpan('reservation.buildTimeWindow', undefined, spanCtx);
            const startTime = new Date(`${reservationDate}T${reservationTime}:00`);
            if (isNaN(startTime.getTime())) {
                timeSpan.setStatus({ code: 1, message: 'Invalid startTime' });
                timeSpan.end();
                span.setStatus({ code: 1, message: 'Invalid startTime' });
                return res
                    .status(400)
                    .json({ error: 'Không tạo được startTime từ reservationDate + reservationTime' });
            }
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
            timeSpan.end();

            // 🔹 Sub-span 3: check conflict
            const conflictSpan = tracer.startSpan('reservation.checkConflict', undefined, spanCtx);
            const conflict = await Reservation.findOne({
                where: {
                    tableId: table.id,
                    status: { [Op.in]: ['pending', 'confirmed'] },
                    startTime: { [Op.lt]: endTime },
                    endTime: { [Op.gt]: startTime },
                },
            });
            conflictSpan.setAttribute('reservation.conflict', !!conflict);
            conflictSpan.end();

            if (conflict) {
                span.setStatus({ code: 1, message: 'Time slot conflict' });
                return res.status(400).json({
                    error: 'Table already reserved in this time slot',
                });
            }

            // 🔹 Sub-span 4: create reservation DB record
            const dbSpan = tracer.startSpan('reservation.db.create', undefined, spanCtx);
            const reservation = await Reservation.create({
                customerName,
                customerPhone,
                tableId: table.id,
                partySize,
                startTime,
                endTime,
                status,
                notes: notes || null,
            });
            dbSpan.setAttribute('reservation.id', reservation.id);
            dbSpan.end();

            // 🔹 Sub-span 5: update table status
            const tableSpan = tracer.startSpan('reservation.updateTableStatus', undefined, spanCtx);
            try {
                await table.update({ status: 'reserved' });
                tableSpan.setStatus({ code: 0 });
            } catch (e) {
                tableSpan.recordException(e);
                tableSpan.setStatus({ code: 1, message: e.message });
                console.error('Không cập nhật được status bàn:', e.message);
            } finally {
                tableSpan.end();
            }

            // 🔹 Sub-span 6: publish MQ event để order-service tạo Order async
            const mqSpan = tracer.startSpan('reservation.publish_mq', undefined, spanCtx);
            try {
                await publishReservationCreated({
                    reservationId: reservation.id,
                    tableId: table.id,
                    partySize,
                    customerName,
                    customerPhone,
                    startTime,
                });
                mqSpan.setStatus({ code: 0 });
            } catch (mqErr) {
                mqSpan.recordException(mqErr);
                mqSpan.setStatus({ code: 1, message: mqErr.message });
                console.error('Không publish được reservation.created:', mqErr.message);
                // tuỳ bạn: có coi đây là lỗi fatal hay vẫn tạo reservation bình thường
            } finally {
                mqSpan.end();
            }

            span.setStatus({ code: 0 }); // OK
            // ⚠️ BUG trước đây: bạn không res.json → request bị treo
            res.status(201).json(reservation);
        } catch (error) {
            console.error('create reservation error:', error);
            span.recordException(error);
            span.setStatus({ code: 1, message: error.message });
            res.status(500).json({ error: error.message });
        } finally {
            span.end();
        }
    }

    // GET /api/reservations/available-tables
    static async getAvailableTables(req, res) {
        try {
            const { date, time, partySize } = req.query;

            if (!date || !time || !partySize) {
                return res.status(400).json({ error: 'date, time, partySize required' });
            }

            const start = new Date(`${date}T${time}:00`);
            const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // mặc định 2h

            // 1. Lấy tất cả bàn đủ sức chứa (capacity >= partySize)
            const tables = await Table.findAll({
                where: {
                    capacity: { [Op.gte]: parseInt(partySize, 10) },
                    status: 'available', // nếu bạn muốn chỉ bàn available
                },
            });

            const availableTables = [];

            // 2. Với mỗi bàn, check xem có reservation nào overlap không
            for (const table of tables) {
                const conflict = await Reservation.findOne({
                    where: {
                        tableId: table.id,
                        status: { [Op.in]: ['pending', 'confirmed'] },
                        startTime: { [Op.lt]: end },
                        endTime: { [Op.gt]: start },
                    },
                });

                if (!conflict) {
                    availableTables.push(table);
                }
            }

            res.json(availableTables);
        } catch (error) {
            console.error('available-tables error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/reservations/:id
    static async update(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { id } = req.params;

            const reservation = await Reservation.findByPk(id);
            if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

            await reservation.update(req.body);

            res.json(reservation);

        } catch (error) {
            console.error('update error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // DELETE /api/reservations/:id
    static async delete(req, res) {
        try {
            const deleted = await Reservation.destroy({ where: { id: req.params.id } });
            if (!deleted) return res.status(404).json({ error: 'Reservation not found' });

            res.status(204).send();

        } catch (error) {
            console.error('delete error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ReservationController;
