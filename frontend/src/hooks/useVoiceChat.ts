
import { useState } from "react";
import { Message } from "@/types/chat";

export const useVoiceChat = () => {
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I've processed your files. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  // Toggle voice listening
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Simulate start listening
  const startListening = () => {
    setIsListening(true);
    
    // Simulate user message after a delay
    setTimeout(() => {
      const newMessage = {
        id: `user-${Date.now()}`,
        text: "Can you summarize the main points from the files I uploaded?",
        sender: "user" as const,
        timestamp: new Date(),
      };
      
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
      // Stop listening after sending message
      stopListening();
      
      // Simulate processing
      setIsProcessing(true);
      
      // Simulate AI reply after processing
      setTimeout(() => {
        setIsProcessing(false);
        setIsAiSpeaking(true);
        
        setTimeout(() => {
          const aiReply = {
            id: `ai-${Date.now()}`,
            text: "Based on the files you uploaded, the main points are: 1) Project timeline extended by 2 weeks, 2) Budget increased by 15% due to new requirements, 3) Client requested additional features for the dashboard, and 4) Team capacity needs to be re-evaluated for Q3.",
            sender: "ai" as const,
            timestamp: new Date(),
          };
          
          setMessages((prevMessages) => [...prevMessages, aiReply]);
          setIsAiSpeaking(false);
        }, 3000);
      }, 2000);
    }, 2000);
  };

  // Stop listening
  const stopListening = () => {
    setIsListening(false);
  };

  return {
    messages,
    isListening,
    isAiSpeaking,
    isProcessing,
    toggleListening
  };
};
