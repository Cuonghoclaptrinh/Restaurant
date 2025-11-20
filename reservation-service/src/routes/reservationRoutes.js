const express = require('express');
const ReservationController = require('../controllers/reservationController');
const { createReservation, updateReservation } = require('../validations/reservationValidation');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/available-tables', ReservationController.getAvailableTables);
router.get('/', auth(['ADMIN']), ReservationController.getAll);
router.get('/:id', auth(['ADMIN']), ReservationController.getById);
router.post('/', auth(['USER', 'ADMIN']), createReservation, ReservationController.create);
router.put('/:id', auth(['ADMIN']), updateReservation, ReservationController.update);
router.delete('/:id', auth(['ADMIN']), ReservationController.delete);

module.exports = router;