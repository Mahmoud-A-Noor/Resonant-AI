const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');


// Process chat audio
router.post('/:chatId', chatController.processChat);

module.exports = router;
