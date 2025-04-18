const geminiService = require('./gemini.service');
const elevenLabsService = require('./elevenlabs.service');
const speechmaticsService = require('./speechmatics.service');

module.exports = {
  ...geminiService,
  ...elevenLabsService,
  ...speechmaticsService
};
