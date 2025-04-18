const express = require('express');
const router = express.Router();
const cors = require('cors');
const { uploadFile, handleUpload } = require('../controllers/upload.controller');

// Handle CORS preflight requests
router.options('*', cors());

// Upload endpoint with progress tracking
router.post('/:chatId', uploadFile, handleUpload);

module.exports = router;
