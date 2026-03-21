import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { useLocation } from "react-router-dom";
import { ChatLayout } from "./components";

const chatAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: abortSignal,
      credentials: "include",
    });

    if (res.status === 401) {
      // Will be caught by the caller and shown as an error message
      throw new Error("Please log in to continue.");
    }

    if (!res.ok) throw new Error("An error occurred. Please try again.");

    if (!res.body) throw new Error("Response body is not readable.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const { text: chunk } = JSON.parse(data);
          text += chunk;
          yield { content: [{ type: "text" as const, text }] };
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  },
};

export function ChatPage() {
  const runtime = useLocalRuntime(chatAdapter);
  const location = useLocation();
  const navigate = useNavigate();
  const initialMessage = (
    location.state as { initialMessage?: string } | null
  )?.initialMessage;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatLayout initialMessage={initialMessage} />
    </AssistantRuntimeProvider>
  );
}
