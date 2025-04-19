import { useState, useRef } from "react";
import { Mic, MicOff, Loader } from "lucide-react";
import axios from 'axios';
import { getOrCreateChatId } from "@/services/session";

const VoiceChat = () => {
  const chatId = getOrCreateChatId();
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiText, setAiText] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Speech Recognition.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    setTranscript('');

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPiece;
        } else {
          interim += transcriptPiece;
        }
      }
      setTranscript(final || interim);
      if (final) {
        recognition.stop();
        setIsListening(false);
        sendTextToBackend(final);
      }
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      setTranscript('');
      console.error('Speech recognition error:', event.error);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const sendTextToBackend = async (text: string) => {
    try {
      setIsProcessing(true);
      setAiText('');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/chat/${chatId}`,
        { text, chatId },
        { responseType: 'json' } // default, get text and audio url/base64
      );
      setIsProcessing(false);
      setAiText(response.data.text || '');
      setIsAiSpeaking(true);
      // Try to play audio as a blob if backend supports it
      if (response.data.audio) {
        // If backend returns a string (base64 or data url)
        let audioUrl = response.data.audio;
        if (typeof audioUrl === 'string') {
          if (audioUrl.startsWith('data:')) {
            // already a data URL
            const audio = new Audio(audioUrl);
            audio.controls = true;
            audio.preload = 'none';
            audio.onended = () => {
              setIsAiSpeaking(false);
              audio.remove();
            };
            document.body.appendChild(audio);
            audio.play();
          } else if (audioUrl.length > 100) {
            // fallback: treat as base64
            const dataUrl = `data:audio/wav;base64,${audioUrl}`;
            const audio = new Audio(dataUrl);
            audio.controls = true;
            audio.preload = 'none';
            audio.onended = () => {
              setIsAiSpeaking(false);
              audio.remove();
            };
            document.body.appendChild(audio);
            audio.play();
          } else {
            setIsAiSpeaking(false);
          }
        } else {
          setIsAiSpeaking(false);
        }
      } else {
        setIsAiSpeaking(false);
      }
    } catch (error) {
      // Try to get audio as blob (if backend is sending binary)
      if (axios.isAxiosError(error) && error.response && error.response.data instanceof Blob) {
        const blob = error.response.data;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.controls = true;
        audio.preload = 'none';
        audio.onended = () => {
          setIsAiSpeaking(false);
          audio.remove();
          URL.revokeObjectURL(url);
        };
        document.body.appendChild(audio);
        audio.play();
      } else {
        setIsProcessing(false);
        setIsAiSpeaking(false);
        setAiText('');
        console.error('Error processing chat:', error);
      }
    }
  };

  // Custom animated button (old design)
  const renderVoiceButton = () => (
    <div className="relative flex items-center justify-center">
      {/* AI Speaking Animation - Circular waves with blue color */}
      {isAiSpeaking && (
        <>
          <div className="absolute inset-0 rounded-full animate-ping" style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.7) 0%, rgba(99,102,241,0) 70%)",
            animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
            animationDelay: "0s"
          }}></div>
          <div className="absolute inset-0 rounded-full" style={{
            background: "radial-gradient(circle, rgba(79,70,229,0.5) 0%, rgba(79,70,229,0) 70%)",
            animation: "ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite",
            animationDelay: "0.3s"
          }}></div>
          <div className="absolute inset-0 rounded-full" style={{
            background: "radial-gradient(circle, rgba(67,56,202,0.3) 0%, rgba(67,56,202,0) 70%)",
            animation: "ping 2.1s cubic-bezier(0, 0, 0.2, 1) infinite",
            animationDelay: "0.6s"
          }}></div>
        </>
      )}
      {/* User Speaking Animation - Sound waves with purple color */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full animate-pulse" style={{
            boxShadow: "0 0 0 20px rgba(139,92,246,0.1), 0 0 0 40px rgba(139,92,246,0.05)"
          }}></div>
          <div className="absolute -inset-4 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full absolute">
              {[...Array(4)].map((_, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r={20 + i * 10}
                  strokeWidth="2"
                  stroke={`rgba(147,51,234,${0.7 - i * 0.15})`}
                  fill="none"
                  strokeDasharray="1, 8"
                  style={{
                    animation: `spin ${2 + i * 0.5}s linear infinite`,
                    transformOrigin: 'center',
                    animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
                  }}
                />
              ))}
            </svg>
          </div>
        </>
      )}
      {/* Main button */}
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isAiSpeaking || isProcessing}
        className={`size-52 rounded-full shadow-lg transition-all duration-300 cursor-pointer focus:outline-none flex items-center justify-center ${isListening
          ? "bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-purple-300/40"
          : isAiSpeaking
            ? "bg-gradient-to-r from-indigo-500 to-blue-500 shadow-indigo-300/40"
            : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
          }`}
        type="button"
      >
        {isListening ? (
          <MicOff style={{ width: 36, height: 36, color: '#fff' }} />
        ) : isProcessing ? (
          <Loader style={{ width: 36, height: 36, color: '#fff' }} />
        ) : (
          <Mic style={{ width: 36, height: 36, color: '#fff' }} />
        )}
      </button>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 items-center justify-center">
      <div className="p-6 flex items-center justify-center">
        {renderVoiceButton()}
      </div>
      {isProcessing && (
        <div className="mt-4">
          <Loader className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      )}
      {transcript && (
        <div className="mt-4 text-center text-gray-600">
          <p>Transcript: {transcript}</p>
        </div>
      )}
      {aiText && (
        <div className="mt-4 text-center text-blue-700 font-semibold">
          <p>AI: {aiText}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
