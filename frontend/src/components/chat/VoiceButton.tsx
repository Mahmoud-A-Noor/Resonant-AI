
import { Mic, MicOff, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceButtonProps {
  isListening: boolean;
  isAiSpeaking: boolean;
  isProcessing?: boolean;
  toggleListening: () => void;
}

const VoiceButton = ({ 
  isListening, 
  isAiSpeaking, 
  isProcessing = false, 
  toggleListening 
}: VoiceButtonProps) => {
  return (
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
      {isProcessing && !isListening && !isAiSpeaking && (
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
        className={`h-24 w-24 rounded-full shadow-lg transition-all duration-300 ${
          isListening
            ? "bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-purple-300/40"
            : isAiSpeaking
            ? "bg-gradient-to-r from-indigo-500 to-blue-500 shadow-indigo-300/40"
            : isProcessing
            ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-300/40"
            : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
        }`}
      >
        {isListening ? (
          <MicOff className="h-10 w-10" />
        ) : isProcessing ? (
          <Loader className="h-10 w-10 animate-spin" />
        ) : (
          <Mic className="h-10 w-10" />
        )}
      </Button>
    </div>
  );
};

export default VoiceButton;
