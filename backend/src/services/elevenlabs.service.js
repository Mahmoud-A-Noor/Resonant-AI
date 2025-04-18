const axios = require('axios');
const config = require('../config');

const textToSpeech = async (text, voiceId = '21m00Tcm4TlvDq8ikWAM') => {
  try {
    const response = await axios.post(
      `${config.ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
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
