
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppProviders } from "@/providers/AppProviders";
import FileUpload from "@/pages/FileUpload";
import VoiceChat from "@/pages/VoiceChat";
import NotFound from "@/pages/NotFound";
import "@/App.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<FileUpload />} />
            <Route path="voice-chat" element={<VoiceChat />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  </QueryClientProvider>
);

export default App;
