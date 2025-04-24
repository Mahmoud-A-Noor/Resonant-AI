import { FlowProvider } from "@speechmatics/flow-client-react";
import VoiceChat from "./VoiceChat";

export default function VoiceChatWrapper() {
  return (
    <FlowProvider appId={import.meta.env.VITE_SPEECHMATICS_APP_ID}>
      <VoiceChat />
    </FlowProvider>
  );
}