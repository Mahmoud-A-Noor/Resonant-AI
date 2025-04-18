const { BatchClient } = require('@speechmatics/batch-client');
const { openAsBlob } = require('node:fs');
const config = require('../config');
const path = require('path');

const client = new BatchClient({ 
  apiKey: config.SPEECHMATICS_API_KEY, 
  appId: 'task' 
});

const speechToText = async (audioFilePath) => {
  try {
    const blob = await openAsBlob(audioFilePath);
    const file = new File([blob], path.basename(audioFilePath));
    
    const response = await client.transcribe(
      file,
      {
        transcription_config: {
          language: 'en'
        }
      },
      'json-v2'
    );
    
    return typeof response === 'string' 
      ? response 
      : response.results.map((r) => r.alternatives?.[0].content).join(' ');
  } catch (error) {
    console.error('Speechmatics error:', error);
    throw error;
  }
};

module.exports = {
  speechToText
};
