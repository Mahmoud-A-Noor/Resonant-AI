const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const multer = require('multer');

// Configure multer for audio file upload
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/wav'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log('Received file type:', file.mimetype);
      cb(new Error('Invalid file type. Only webm or wav audio files are allowed.'));
    }
  }
});

// Process chat audio
router.post('/:chatId', upload.single('audio'), chatController.processChatAudio);

module.exports = router;
