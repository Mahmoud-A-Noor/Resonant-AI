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
    // Only send text, no audio
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
