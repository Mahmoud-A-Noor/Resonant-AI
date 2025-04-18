import { useState, useRef } from "react";
import { Mic, MicOff, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecordRTC from 'recordrtc';
import axios from 'axios';
import { getOrCreateChatId } from "@/services/session";
import VoiceButton from "@/components/chat/VoiceButton";

const VoiceChat = () => {
  const chatId = getOrCreateChatId();
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const consecutiveSilenceCountRef = useRef<number>(0);
  const startRecording = async () => {
    try {
      // Get audio stream with proper constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          channelCount: 1, // Mono recording
          sampleRate: 48000,
          sampleSize: 16
        }
      });

      // Create Web Audio API context
      const audioContext = new AudioContext({
        sampleRate: 48000
      });

      // Load noise suppressor worklet
      await audioContext.audioWorklet.addModule('/noise-suppressor.js');

      // Set up audio graph
      const source = audioContext.createMediaStreamSource(stream);
      const suppressor = new AudioWorkletNode(audioContext, 'noise-suppressor');
      const destination = audioContext.createMediaStreamDestination();

      source.connect(suppressor);
      suppressor.connect(destination);

      // Initialize recorder with proper settings
      recorderRef.current = new RecordRTC(destination.stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        sampleRate: 44100,
        desiredSampRate: 44100,
        bufferSize: 8192,
        disableLogs: true,
        numberOfAudioChannels: 1,
        timeSlice: 500,
        recorderType: RecordRTC.StereoAudioRecorder,
        bitsPerSecond: 256000,
        audioBitsPerSecond: 256000,
        ondataavailable: async (blob) => {
          if (await isSilent(blob)) {
            consecutiveSilenceCountRef.current += 1;
            console.log(`Silence detected (${consecutiveSilenceCountRef.current}/5)`);

            if (consecutiveSilenceCountRef.current >= 5) {
              console.log('Extended silence detected - stopping recording');
              stopRecording();
            }
          } else {
            consecutiveSilenceCountRef.current = 0;
          }
        }
      });

      // Start recording and set state
      recorderRef.current.startRecording();
      setIsListening(true);
      streamRef.current = stream;

      await audioContext.audioWorklet.addModule('/noise-suppressor.js');

    } catch (err) {
      console.error('Recording failed:', err);
      setIsListening(false);
    }
  };

  const isSilent = async (blob: Blob) => {
    try {
      if (blob.size < 1024) return false;

      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new OfflineAudioContext(1, 44100, 44100);
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);
      let sum = 0;

      for (let i = 0; i < channelData.length; i += 100) {
        sum += Math.abs(channelData[i]);
      }

      const avgVolume = sum / Math.ceil(channelData.length / 100);

      return avgVolume < 0.03;
    } catch (err) {
      console.error('Silence check error:', err);
      return false;
    }
  };

  const stopRecording = async () => {
    consecutiveSilenceCountRef.current = 0;

    cleanup();
    setIsProcessing(true);
    if (recorderRef.current && recorderRef.current.state !== 'stopped') {
      setIsProcessing(true);
      recorderRef.current.stopRecording(async () => {
        const blob = recorderRef.current?.getBlob();
        if (blob) {
          await sendAudioToBackend(blob, chatId);
        }
      });
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob, chatId: string) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      try {
        // Create audio element first
        const aiAudio = new Audio();
        aiAudio.controls = true;
        aiAudio.preload = 'none'; // Don't preload the entire file
        aiAudio.onended = () => {
          setIsAiSpeaking(false);
          aiAudio.remove();
        };
        document.body.appendChild(aiAudio);

        // Send request and set audio source
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/chat/${chatId}`, formData, {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setIsProcessing(false);
        setIsAiSpeaking(true);

        // Create blob URL from response
        const audioBlob = new Blob([response.data], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        aiAudio.src = audioUrl;
        aiAudio.play();

        // Clean up blob URL when done
        aiAudio.addEventListener('ended', () => {
          URL.revokeObjectURL(audioUrl);
        });

      } catch (err) {
        console.error('Failed to process audio:', err);
        setIsProcessing(false);
        setIsAiSpeaking(false);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Recording failed:', err);
      setIsProcessing(false);
      setIsAiSpeaking(false);
      setIsProcessing(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);

  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50flex items-center justify-center" onClick={isListening ? stopRecording : null}>

      {/* Voice input button */}
      <div className="p-6 flex items-center justify-center cursor-pointer">


        <div className="relative">
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

          {/* Processing Animation - Rotating dashed circle with orange/yellow gradient */}
          {isProcessing && (
            <>
              <div className="absolute inset-0 rounded-full" style={{
                background: "radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0) 70%)"
              }}></div>
              <div className="absolute -inset-2 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full absolute animate-spin" style={{ animationDuration: '3s' }}>
                  <defs>
                    <linearGradient id="processingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    strokeWidth="4"
                    stroke="url(#processingGradient)"
                    fill="none"
                    strokeDasharray="20, 10"
                  />
                </svg>
              </div>
            </>
          )}

          {/* Main button */}
          <Button
            onClick={toggleListening}
            disabled={isAiSpeaking || isProcessing}
            className={`size-52 rounded-full shadow-lg transition-all duration-300 cursor-pointer ${isListening
              ? "bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-purple-300/40"
              : isAiSpeaking
                ? "bg-gradient-to-r from-indigo-500 to-blue-500 shadow-indigo-300/40"
                : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
              }`}
          >
            {isListening ? (
              <MicOff style={{ width: 36, height: 36 }} />
            ) : isProcessing ? (
              <Loader style={{ width: 36, height: 36 }} />
            ) : (
              <Mic style={{ width: 36, height: 36 }} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;
