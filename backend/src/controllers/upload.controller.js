const path = require('path');
const fs = require('fs');
const { initializeChatResources } = require('../services/gemini.service');
const multer = require('multer');

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

exports.uploadFile = upload.single('file');

exports.handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Initialize chat resources
    await initializeChatResources(req.params.chatId);
    
    return res.json({
      success: true,
      filePath: `/uploads/${req.params.chatId}/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
