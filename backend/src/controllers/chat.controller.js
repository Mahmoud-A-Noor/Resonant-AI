const services = require('../services');
// const { textToSpeech } = require('../services/elevenlabs.service');

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
    // Step 2: Return only the response text (no TTS/audio)
    res.json({
      text: responseText
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
};

module.exports = {
  processChat
};
