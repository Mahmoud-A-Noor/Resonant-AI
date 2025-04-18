const express = require('express');
const router = express.Router();

// Import route files
const chatRoutes = require('./chat.routes');
const uploadRoutes = require('./upload.routes');

// Setup routes
router.use('/chat', chatRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
