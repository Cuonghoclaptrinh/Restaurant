const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');

router.post('/ratings', RatingController.validateRating(), RatingController.createRating);
router.get('/ratings/menu-item/:menuItemId', RatingController.getRatingsByMenuItem);

module.exports = router;