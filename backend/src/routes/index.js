const express = require('express');
const router = express.Router();

// Import route files
const chatRoutes = require('./chat.routes');
const uploadRoutes = require('./upload.routes');
const speechmaticsRoutes = require('./speechmatics.routes');

// Setup routes
router.use('/chat', chatRoutes);
router.use('/upload', uploadRoutes);
router.use('/speechmatics', speechmaticsRoutes);

module.exports = router;
