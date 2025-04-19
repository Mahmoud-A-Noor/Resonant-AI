const services = require('../services');

const processChat = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text input is required' });
    }
    // Step 1: Use the provided text directly
    const responseText = await services.generateResponse(text, chatId);
    // Step 2: Convert AI response to speech using ElevenLabs (or your TTS)
    const audioBuffer = await services.textToSpeech(responseText);
    // Convert audio buffer to base64
    const audioBase64 = Buffer.isBuffer(audioBuffer)
      ? audioBuffer.toString('base64')
      : Buffer.from(audioBuffer).toString('base64');
    // Send response with both text and audio (audio as base64)
    res.json({
      text: responseText,
      audio: audioBase64,
      audioType: 'audio/wav'
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
};

module.exports = {
  processChat
};
