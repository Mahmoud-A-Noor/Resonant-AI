const services = require('../services');
const { textToSpeech } = require('../services/elevenlabs.service');

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
    // Step 2: Convert response text to speech
    const audioBuffer = await textToSpeech(responseText);
    // // Step 3: Send audio (and text as header)
    // res.set({
    //   'Content-Type': 'audio/mpeg',
    //   'Content-Disposition': 'inline; filename="tts.mp3"',
    //   'X-Response-Text': encodeURIComponent(responseText)
    // });
    // res.send(audioBuffer);
    
    // Step 3: Send both audio (base64) and text in JSON
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    res.json({
      text: responseText,
      audio: audioBase64
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
};

// New endpoint: Generate TTS audio from text
const ttsFromText = async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text input is required' });
    }
    // Call ElevenLabs TTS
    const audioBuffer = await textToSpeech(text, voiceId);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="tts.mp3"',
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
};

module.exports = {
  processChat,
  ttsFromText
};
