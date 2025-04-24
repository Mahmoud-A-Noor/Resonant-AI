const axios = require('axios');
const config = require('../config');
const fs = require('fs');

const textToSpeech = async (text, voiceId = 'EXAVITQu4vr4xnSDxMaL') => {
  try {
    const payload = {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };
    const response = await axios.post(
      `${config.ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      payload,
      {
        headers: {
          'xi-api-key': config.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    return response.data;
  } catch (error) {
    console.error('ElevenLabs error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  textToSpeech
};
