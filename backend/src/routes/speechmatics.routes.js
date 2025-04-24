const express = require('express');
const router = express.Router();
const speechmaticsController = require('../controllers/speechmatics.controller');

// POST /speechmatics-jwt
router.post('/get-jwt', speechmaticsController.getJwt);

module.exports = router;
