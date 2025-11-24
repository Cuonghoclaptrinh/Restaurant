const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');

// Routes đã được mount với prefix '/ratings' trong app.js, nên không cần prefix ở đây
router.post('/', RatingController.validateRating(), RatingController.createRating);
router.get('/menu-item/:menuItemId', RatingController.getRatingsByMenuItem);

module.exports = router;