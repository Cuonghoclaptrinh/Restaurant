// // reservation-service/src/validations/reservationValidation.js
// const { body } = require('express-validator');

// const createReservation = [
//     body('customerName')
//         .trim()
//         .notEmpty()
//         .withMessage('Tên khách hàng là bắt buộc'),

//     body('customerPhone')
//         .trim()
//         .isMobilePhone('vi-VN')
//         .withMessage('Số điện thoại không hợp lệ'),

//     // tableNumber: bạn đang gửi 5 → cho phép số nguyên dương
//     body('tableNumber')
//         .isInt({ min: 1 })
//         .withMessage('Số bàn phải là số nguyên dương'),

//     body('partySize')
//         .isInt({ min: 1, max: 20 })
//         .withMessage('Số người từ 1-20'),

//     // Ngày đặt
//     body('reservationDate')
//         .isISO8601()
//         .withMessage('Ngày đặt không hợp lệ'),

//     // Giờ đặt HH:mm
//     body('reservationTime')
//         .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
//         .withMessage('Giờ đặt không hợp lệ (định dạng HH:mm)'),

//     // Thời lượng (phút) optional
//     body('durationMinutes')
//         .optional()
//         .isInt({ min: 30, max: 300 })
//         .withMessage('durationMinutes phải từ 30–300 phút'),

//     body('status')
//         .optional()
//         .isIn(['pending', 'confirmed', 'seated', 'no_show', 'cancelled', 'completed'])
//         .withMessage('Trạng thái không hợp lệ'),

//     body('notes')
//         .optional()
//         .isString(),
// ];

// const updateReservation = [
//     body('status')
//         .optional()
//         .isIn(['pending', 'confirmed', 'seated', 'no_show', 'cancelled', 'completed'])
//         .withMessage('Trạng thái không hợp lệ'),
//     body('notes')
//         .optional()
//         .isString(),
// ];

// module.exports = { createReservation, updateReservation };

// src/validations/reservationValidation.js
const { body } = require('express-validator');

// Validate cho POST /reservations
const createReservation = [
    body('customerName')
        .notEmpty()
        .withMessage('customerName is required'),

    body('customerPhone')
        .notEmpty()
        .withMessage('customerPhone is required'),

    body('tableNumber')
        .notEmpty()
        .withMessage('tableNumber is required')
        .bail()
        .isInt({ min: 1 })
        .withMessage('tableNumber must be a positive integer'),

    body('partySize')
        .notEmpty()
        .withMessage('partySize is required')
        .bail()
        .isInt({ min: 1 })
        .withMessage('partySize must be >= 1'),

    body('reservationDate')
        .notEmpty()
        .withMessage('reservationDate is required')
        .bail()
        .isISO8601()
        .withMessage('reservationDate must be a valid date'),

    body('reservationTime')
        .notEmpty()
        .withMessage('reservationTime is required')
        .bail()
        .matches(/^\d{2}:\d{2}$/)
        .withMessage('reservationTime must be in HH:mm format'),

    body('durationMinutes')
        .optional()
        .isInt({ min: 1 })
        .withMessage('durationMinutes must be positive'),

    body('status')
        .optional()
        .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
        .withMessage('Invalid status'),

    body('notes')
        .optional()
        .isString()
        .withMessage('notes must be a string'),
];

// Validate cho PUT /reservations/:id
const updateReservation = [
    body('status')
        .optional()
        .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
        .withMessage('Invalid status'),
];

module.exports = {
    createReservation,
    updateReservation,
};
