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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
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

            // 1. Tìm bàn theo tableNumber (đúng kiểu INTEGER)
            const table = await Table.findOne({
                where: {
                    tableNumber: parseInt(tableNumber, 10),
                },
            });

            if (!table) {
                return res.status(404).json({ error: 'Table not found' });
            }

            // 2. Ghép thành startTime / endTime
            const startTime = new Date(`${reservationDate}T${reservationTime}:00`);
            if (isNaN(startTime.getTime())) {
                return res
                    .status(400)
                    .json({ error: 'Không tạo được startTime từ reservationDate + reservationTime' });
            }

            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

            // 3. Check trùng time slot trên cùng bàn
            // Overlap nếu: (new.start < old.end) && (new.end > old.start)
            const conflict = await Reservation.findOne({
                where: {
                    tableId: table.id,
                    status: { [Op.in]: ['pending', 'confirmed'] }, // reservation còn hiệu lực
                    startTime: { [Op.lt]: endTime },
                    endTime: { [Op.gt]: startTime },
                },
            });

            if (conflict) {
                return res.status(400).json({
                    error: 'Table already reserved in this time slot',
                });
            }

            // 4. Tạo reservation
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

            // (Optional) cập nhật trạng thái bàn là 'reserved'
            try {
                await table.update({ status: 'reserved' });
            } catch (e) {
                console.error('Không cập nhật được status bàn:', e.message);
            }

            // 5. (Optional) Gọi order-service tạo sẵn order gắn với reservation
            // try {
            //     console.log('Gọi order-service:', `${ORDER_SERVICE_URL}/`)

            //     const orderResponse = await fetch(`${ORDER_SERVICE_URL}/`, {
            //         method: 'POST',
            //         headers: {
            //             'Content-Type': 'application/json',
            //             // rất quan trọng: forward luôn Authorization header từ FE sang
            //             Authorization: req.headers.authorization || '',
            //         },
            //         body: JSON.stringify({
            //             orderType: 'dine-in',
            //             tableId: table.id,
            //             reservationId: reservation.id,
            //             status: 'pending',
            //         }),
            //     })

            //     const text = await orderResponse.text()

            //     if (!orderResponse.ok) {
            //         console.error('Tạo order thất bại:', orderResponse.status, text)
            //     } else {
            //         const order = JSON.parse(text)
            //         console.log('Tạo order thành công, id:', order.id)
            //     }
            // } catch (fetchError) {
            //     console.error('Lỗi kết nối đến order-service:', fetchError.message)
            // }
            // res.status(201).json(reservation);

            // 5. Đẩy event vào MQ để order-service tạo order async
            try {
                await publishReservationCreated({
                    reservationId: reservation.id,
                    tableId: table.id,
                    partySize,
                    customerName,
                    customerPhone,
                    startTime,
                })
            } catch (mqErr) {
                console.error('Không publish được reservation.created:', mqErr.message)
            }


        } catch (error) {
            console.error('create reservation error:', error);
            res.status(500).json({ error: error.message });
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
