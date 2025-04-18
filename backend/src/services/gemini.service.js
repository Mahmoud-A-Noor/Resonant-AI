const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');

// Store chat history and active chat sessions
const chatHistory = {};
const activeSessions = {};

// Store file contents and context for each chat
const fileContents = {};
const chatContexts = {};

// Load system prompt
const systemPrompt = fs.readFileSync(path.join(__dirname, 'system_prompt.txt'), 'utf8');

// Initialize Google GenAI client
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
  }
};

const extractTextFromFile = async (buffer, mimeType, fileName) => {
  try {
    if (mimeType === 'application/pdf') {
      return await extractTextFromPDF(buffer);
    }
    
    // For text-based files, convert buffer to string
    if (mimeType.startsWith('text/') || 
        fileName.match(/\.(txt|md|js|ts|jsx|tsx|py|java|cpp|c|h|cs|html|css|json|xml)$/i)) {
      return buffer.toString('utf-8');
    }

    return null;
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return null;
  }
};

// Initialize resources for each chat
const initializeChatResources = async (chatId) => {
  try {
    console.log("initializing chat resources");
    const resourcesPath = path.join(__dirname, '../../uploads', chatId);
    if (!fs.existsSync(resourcesPath)) {
      return;
    }

    const files = fs.readdirSync(resourcesPath);
    const contents = {};

    for (const file of files) {
      const filePath = path.join(resourcesPath, file);
      const fileStat = fs.statSync(filePath);
      
      if (fileStat.isDirectory()) continue;

      // Get file extension and mime type
      const ext = path.extname(file).toLowerCase();
      let mimeType;

      switch (ext) {
        case '.pdf':
          mimeType = 'application/pdf';
          break;
        case '.txt':
        case '.md':
          mimeType = 'text/plain';
          break;
        case '.js':
        case '.jsx':
          mimeType = 'text/javascript';
          break;
        case '.ts':
        case '.tsx':
          mimeType = 'text/typescript';
          break;
        case '.py':
          mimeType = 'text/x-python';
          break;
        case '.java':
          mimeType = 'text/x-java';
          break;
        case '.cpp':
        case '.c':
        case '.h':
          mimeType = 'text/x-c';
          break;
        case '.cs':
          mimeType = 'text/x-csharp';
          break;
        case '.html':
          mimeType = 'text/html';
          break;
        case '.css':
          mimeType = 'text/css';
          break;
        case '.json':
          mimeType = 'application/json';
          break;
        case '.xml':
          mimeType = 'text/xml';
          break;
        default:
          continue; // Skip unsupported files
      }

      // Read file data
      const fileData = fs.readFileSync(filePath);
      
      // Extract text content
      const textContent = await extractTextFromFile(fileData, mimeType, file);
      
      if (textContent) {
        contents[file] = textContent;
      }
    }

    // Store file contents for this chat
    fileContents[chatId] = contents;

    // Prepare system context with file contents
    let systemContext = systemPrompt + '\n\nAvailable resources:\n';
    for (const [fileName, content] of Object.entries(contents)) {
      systemContext += `\nFile: ${fileName}\nContent:\n${content}\n`;
    }
    chatContexts[chatId] = systemContext;

    // Initialize or reset chat history
    chatHistory[chatId] = [];
    
    // Create a new chat session with system context
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const chat = model.startChat({
      history: [{
        role: 'user',
        parts: [{ text: systemContext }]
      }]
    });
    
    // Store the active session
    activeSessions[chatId] = chat;

    console.log(`Successfully initialized ${Object.keys(contents).length} files for chat ${chatId}`);

  } catch (error) {
    console.error('Error initializing chat resources:', error);
    throw error;
  }
};

const generateResponse = async (prompt, chatId) => {
  try {
    // Get or create chat session
    let chat = activeSessions[chatId];
    if (!chat) {
      // Create new session with system context if none exists
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const systemContext = chatContexts[chatId] || systemPrompt;
      
      chat = model.startChat({
        history: [{
          role: 'user',
          parts: [{ text: systemContext }]
        }]
      });
      activeSessions[chatId] = chat;
    }

    // Send message and get response
    const result = await chat.sendMessage([
      { text: prompt }
    ]);
    const response = await result.response;
    const text = response.text();

    // Update chat history
    if (!chatHistory[chatId]) {
      chatHistory[chatId] = [];
    }
    chatHistory[chatId].push(`User: ${prompt}`, `AI: ${text}`);

    return text;
  } catch (error) {
    console.error('Gemini error:', error);
    throw error;
  }
};

module.exports = {
  generateResponse,
  initializeChatResources
};
