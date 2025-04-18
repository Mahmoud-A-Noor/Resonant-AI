const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const {initializeChatResources} = require('../services/gemini.service');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const chatId = req.params.chatId;
    const uploadPath = path.join(__dirname, '../../uploads', chatId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Handle CORS preflight requests
router.options('*', cors());

// Upload endpoint with progress tracking
router.post('/:chatId', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  // Initialize chat resources
  initializeChatResources(req.params.chatId);
  
  res.json({
    success: true,
    filePath: `/uploads/${req.params.chatId}/${req.file.filename}`
  });
});

module.exports = router;
