# Resonant - Intelligent Document Voice Assistant

## 📖 Table of Contents
- [Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Detailed Setup](#detailed-setup)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [License](#-license)

## ✨ Key Features

✨ **Document Processing**  
- Supports PDFs, text files, and various code formats
- Extracts and indexes document contents automatically
- Preserves document structure and formatting

🎙️ **Voice Interaction**  
- Real-time voice chat with AI assistant
- Automatic speech recognition (Speechmatics)
- Natural text-to-speech responses (ElevenLabs)
- Noise suppression for clear audio

🧠 **Smart AI Assistant**  
- Powered by Google Gemini AI
- Context-aware responses based on uploaded documents
- Maintains conversation history and context

## 🛠️ Tech Stack

**Frontend**:
- React + TypeScript
- Vite.js
- Tailwind CSS
- RecordRTC for audio recording

**Backend**:
- Node.js + Express
- Google Gemini API
- Speechmatics API (speech-to-text)
- ElevenLabs API (text-to-speech)

## 🚀 Installation

### Detailed Setup

#### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create environment file:
   ```bash
   cp .env.example .env
   ```
4. Fill in your API keys in `.env`:
   ```
   GEMINI_API_KEY=your_google_gemini_key
   SPEECHMATICS_API_KEY=your_speechmatics_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   PORT=3000
   UPLOAD_DIR=./uploads
   ```

#### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create environment file:
   ```bash
   cp .env.example .env
   ```
4. Configure frontend environment:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```

#### Running the Application
1. Start backend server (from backend directory):
   ```bash
   npm run dev
   ```
2. Start frontend development server (from frontend directory):
   ```bash
   npm run dev
   ```
3. Access the application at:
   ```
   http://localhost:5173
   ```

## 📚 API Documentation

### Endpoints

#### 1. File Upload
- **POST** `/api/upload/:chatId`
  - Accepts: `multipart/form-data` with file field
  - Response:
    ```json
    {
      "success": true,
      "filePath": "/uploads/chat_id/filename.ext"
    }
    ```

#### 2. Voice Chat
- **POST** `/api/chat/:chatId`
  - Accepts: Audio file (webm format)
  - Returns: Audio response (wav format)

#### 3. Document Processing
- Internal endpoint that processes uploaded documents

## 🤝 Contributing

### How to Contribute
1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a pull request

### Coding Standards
- Follow existing code style
- Write clear commit messages
- Include relevant tests
- Document new features
- Keep dependencies updated

## 🛠️ Troubleshooting

### Common Issues

#### 1. Audio Recording Problems
**Symptoms**: Microphone not working, silent recordings  
**Solutions**:
- Check browser permissions
- Try different microphone
- Ensure no other app is using the microphone

#### 2. API Key Errors
**Symptoms**: 403 Forbidden responses  
**Solutions**:
- Verify API keys in `.env` files
- Check quota limits
- Ensure correct service region

#### 3. File Upload Failures
**Symptoms**: Files not appearing in chat  
**Solutions**:
- Check upload directory permissions
- Verify file size limits
- Ensure valid file types

#### 4. Development Server Issues
**Symptoms**: Frontend not connecting to backend  
**Solutions**:
- Verify both servers are running
- Check CORS settings
- Confirm `VITE_API_BASE_URL` is correct

## 🗺️ Roadmap

- [ ] Add support for more document types
- [ ] Improve UI/UX
- [ ] Improve performance
- [ ] Implement document search functionality
- [ ] Add multi-language support

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.
