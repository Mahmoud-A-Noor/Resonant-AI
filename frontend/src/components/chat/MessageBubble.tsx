
import { User, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  return (
    <div
      className={`flex ${
        message.sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <Card
        className={`max-w-md ${
          message.sender === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary"
        }`}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            {message.sender === "ai" ? (
              <Bot className="h-5 w-5 mt-1" />
            ) : (
              <User className="h-5 w-5 mt-1" />
            )}
            <div>
              <p>{message.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageBubble;
