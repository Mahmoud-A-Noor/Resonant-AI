const services = require('../services');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const processChatAudio = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    
    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save uploaded audio temporarily
    const tempFilePath = path.join(tempDir, `audio_${uuidv4()}.webm`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Step 1: Convert audio to text using Speechmatics
    const transcription = await services.speechToText(tempFilePath);

    // Step 2: Generate response using Gemini
    const text = await services.generateResponse(transcription, chatId);
    
    // Step 3: Convert AI response to speech using ElevenLabs
    const audioBuffer = await services.textToSpeech(text);

    // Clean up temporary files before sending response
    try {
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      console.error('Error cleaning up temporary file:', err);
    }

    // Set headers for blob response
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename=response.wav');

    // Send the audio buffer directly
    res.send(audioBuffer);

  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
};

module.exports = {
  processChatAudio
};
