const express = require('express');
const ReservationController = require('../controllers/reservationController');
const { createReservation, updateReservation } = require('../validations/reservationValidation');

const router = express.Router();

router.get('/', ReservationController.getAll);
router.get('/:id', ReservationController.getById);
router.post('/', createReservation, ReservationController.create);
router.put('/:id', updateReservation, ReservationController.update);
router.delete('/:id', ReservationController.delete);
router.get('/available-tables', ReservationController.getAvailableTables);

module.exports = router;