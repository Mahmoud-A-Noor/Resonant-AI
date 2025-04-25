import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader } from "lucide-react";
import axios from 'axios';
import { getOrCreateChatId } from "@/services/session";
import { useFlow, useFlowEventListener } from "@speechmatics/flow-client-react";
import { createSpeechmaticsJWT } from '@speechmatics/auth';

const VoiceChat = () => {
  const chatId = getOrCreateChatId();
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [aiText, setAiText] = useState('');
  const transcriptRef = useRef('');
  const fullTranscriptRef = useRef('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const sessionActiveRef = useRef(false);

  const SILENCE_DETECTION_MS = 1000;

  // Silence detection: track consecutive empty transcript events and their start time
  const emptyTranscriptEventCountRef = useRef(0);
  const emptyTranscriptStartTimeRef = useRef<number | null>(null);

  // Cleanup silence detection refs on unmount
  useEffect(() => {
    return () => {
      emptyTranscriptEventCountRef.current = 0;
      emptyTranscriptStartTimeRef.current = null;
    };
  }, []);

  // Helper to fetch Speechmatics JWT from backend
  const getSpeechmaticsJwt = async () => {
    const jwt = await createSpeechmaticsJWT({
      type: 'flow',
      apiKey: import.meta.env.VITE_SPEECHMATICS_API_KEY,
      ttl: 1500
    });
    return jwt;
  };

  const { startConversation, endConversation, sendAudio, socketState } = useFlow();
  const template_id = import.meta.env.VITE_SPEECHMATICS_TEMPLATE_ID || undefined;

  // Modified: Start Speechmatics session only once
  const startSessionIfNeeded = async () => {
    if (!isSessionActive && !sessionActiveRef.current) {
      try {
        const jwt = await getSpeechmaticsJwt();
        await startConversation(jwt, { config: { template_id, template_variables: {} } });
        setIsSessionActive(true);
        sessionActiveRef.current = true;
        console.log("Speechmatics conversation started and session is active.");
      } catch (err) {
        console.error("Error starting Speechmatics conversation:", err);
        setIsSessionActive(false);
        sessionActiveRef.current = false;
      }
    }
  };

  // Utility: Resample Float32Array to 16kHz Int16 PCM
  const resampleTo16k = async (inputBuffer: Float32Array, inputSampleRate: number): Promise<Int16Array> => {
    if (inputSampleRate === 16000) {
      // Just convert to Int16
      const pcm16 = new Int16Array(inputBuffer.length);
      for (let i = 0; i < inputBuffer.length; i++) {
        let s = Math.max(-1, Math.min(1, inputBuffer[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return pcm16;
    }
    // Resample using OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(inputBuffer.length * 16000 / inputSampleRate), 16000);
    const buffer = offlineCtx.createBuffer(1, inputBuffer.length, inputSampleRate);
    buffer.copyToChannel(inputBuffer, 0);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    const renderedBuffer = await offlineCtx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);
    const pcm16 = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      let s = Math.max(-1, Math.min(1, channelData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  };

  // Start microphone and send audio to Speechmatics
  const startMic = async () => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    source.connect(scriptProcessorRef.current);
    scriptProcessorRef.current.connect(audioContextRef.current.destination);

    scriptProcessorRef.current.onaudioprocess = async (audioProcessingEvent) => {
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      const inputSampleRate = audioContextRef.current?.sampleRate || 44100;
      const pcm16 = await resampleTo16k(inputData, inputSampleRate);
      sendAudio(pcm16.buffer);
    };
  };

  const stopMic = () => {
    scriptProcessorRef.current?.disconnect();
    audioContextRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  };

  useFlowEventListener("message", ({ data }) => {
    if (data.message === "AddPartialTranscript" || data.message === "AddTranscript") {
      const transcript = data.metadata?.transcript;
      // reset silence detection if transcript is not empty
      if (typeof transcript === 'string' && transcript.trim() !== '') {
        emptyTranscriptEventCountRef.current = 0;
        emptyTranscriptStartTimeRef.current = null;
      } else {
        // count consecutive empty transcript events and track when they started
        const now = Date.now();
        if (emptyTranscriptEventCountRef.current === 0) {
          emptyTranscriptStartTimeRef.current = now;
        }
        emptyTranscriptEventCountRef.current += 1;
        if (
          emptyTranscriptStartTimeRef.current !== null &&
          now - emptyTranscriptStartTimeRef.current > SILENCE_DETECTION_MS &&
          transcriptRef.current.trim() !== '' && isListening
        ) {
          emptyTranscriptEventCountRef.current = 0;
          emptyTranscriptStartTimeRef.current = null;
          stopListening();
        }
      }
      if (data.message === "AddPartialTranscript") {
        const partial = data.metadata?.transcript;
        if (typeof partial === 'string') {
          setTranscript(fullTranscriptRef.current + partial);
          transcriptRef.current = fullTranscriptRef.current + partial;
        }
      }
      // Handle AddTranscript (final results)
      if (data.message === "AddTranscript") {
        const finalTranscript = data.metadata?.transcript;
        if (typeof finalTranscript === 'string') {
          setFullTranscript(prev => {
            const updated = prev + finalTranscript + ' ';
            fullTranscriptRef.current = updated;
            return updated;
          });
          setTranscript(fullTranscriptRef.current);
          transcriptRef.current = fullTranscriptRef.current;
          console.log("Final transcript:", finalTranscript);
        }
      }
    }
  });

  useEffect(() => {
    return () => {
      if (emptyTranscriptStartTimeRef.current !== null) {
        emptyTranscriptEventCountRef.current = 0;
        emptyTranscriptStartTimeRef.current = null;
      }
    };
  }, []);

  // Start listening/transcribing (just start mic)
  const startListening = async () => {
    if (!template_id) {
      alert('Speechmatics template_id is required. Please set VITE_SPEECHMATICS_TEMPLATE_ID in your environment.');
      return;
    }
    setTranscript('');
    transcriptRef.current = '';
    setFullTranscript('');
    fullTranscriptRef.current = '';
    setIsListening(true);
    await startSessionIfNeeded();
    await startMic();
    console.log("Mic started. Ready for speech.");
  };

  // Stop listening/transcribing (just stop mic, do not end conversation)
  const stopListening = async () => {
    setIsListening(false);
    setIsProcessing(true);
    stopMic();
    if (fullTranscriptRef.current.trim()) {
      console.log("Sending transcript to backend:", fullTranscriptRef.current.trim());
      await sendTextToBackend(fullTranscriptRef.current.trim());
    }
  };

  const sendTextToBackend = async (text: string) => {
    try {
      setIsProcessing(true);
      setAiText('');
      // Request backend to process chat and return both audio (base64) and text
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/chat/${chatId}`,
        { text, chatId }
      );
      setIsProcessing(false);
      setIsAiSpeaking(true);
      setAiText(response.data.text || '');
      // Play audio from base64
      if (response.data.audio) {
        const audioBuffer = Uint8Array.from(atob(response.data.audio), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsAiSpeaking(false);
          console.log('AI done speaking');
        };
        await audio.play();
      } else {
        setIsAiSpeaking(false);
      }
    } catch (error) {
      setIsProcessing(false);
      setIsAiSpeaking(false);
      setAiText('');
      console.error('Error processing chat:', error);
    }
  };

  const stopAndSend = async () => {
    if (isListening) {
      setIsListening(false);
      setIsProcessing(true);
      stopMic();
      if (fullTranscriptRef.current.trim()) {
        console.log("Sending transcript to backend:", fullTranscriptRef.current.trim());
        await sendTextToBackend(fullTranscriptRef.current.trim());
      }
    }
  };

  useEffect(() => {
    return () => {
      if (sessionActiveRef.current) {
        endConversation();
        setIsSessionActive(false);
        sessionActiveRef.current = false;
        console.log("Speechmatics conversation ended on component unmount.");
      }
    };
  }, []);

  const renderVoiceButton = () => (
    <div className="relative flex items-center justify-center">
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
    <div
      className="h-full w-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 items-center justify-center"
      onClick={stopAndSend}
      style={{
        cursor: isListening ? "pointer" : "default"
      }}
    >
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
