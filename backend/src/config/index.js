const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL,
  
  ELEVENLABS_BASE_URL: process.env.ELEVENLABS_BASE_URL,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,

  SPEECHMATICS_API_KEY: process.env.SPEECHMATICS_API_KEY,
  SPEECHMATICS_BASE_URL: process.env.SPEECHMATICS_BASE_URL,
  
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};
