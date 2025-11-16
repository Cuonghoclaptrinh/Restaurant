const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');

router.post('/', RatingController.validateRating(), RatingController.createRating);
router.get('/menu-item/:menuItemId', RatingController.getRatingsByMenuItem);

module.exports = router;