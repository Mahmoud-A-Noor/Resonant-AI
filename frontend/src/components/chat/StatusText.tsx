
interface StatusTextProps {
  isListening: boolean;
  isAiSpeaking: boolean;
}

const StatusText = ({ isListening, isAiSpeaking }: StatusTextProps) => {
  return (
    <div className="text-center pb-6">
      <p className="text-sm text-gray-500">
        {isListening
          ? "Listening..."
          : isAiSpeaking
          ? "AI is speaking..."
          : "Tap to speak"}
      </p>
    </div>
  );
};

export default StatusText;
