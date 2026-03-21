import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ChatLayout } from "./components";
import { useArtifactStore } from "@/store/artifact";
import { getProject } from "@/api/projects";
import { streamChat } from "@/api/chat";

interface StoredMessage {
  role: "user" | "assistant";
  content: { type: string; text?: string }[];
}

export function ChatPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const initialMessage = (location.state as { initialMessage?: string } | null)?.initialMessage;

  const [initialMessages, setInitialMessages] = useState<StoredMessage[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    // Clear immediately on project switch
    useArtifactStore.getState().clear();
    setInitialMessages(null);
    getProject(projectId)
      .then((data) => {
        const msgs = data.messages ?? [];
        setInitialMessages(msgs);

        // Restore artifact from the last assistant message that contains an HTML code block
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role !== "assistant") continue;
          const text = msgs[i].content
            .filter((p) => p.type === "text")
            .map((p) => p.text ?? "")
            .join("");
          const match = text.match(/```html\n([\s\S]*?)```/);
          if (match) {
            useArtifactStore.getState().setCode(match[1]);
            break;
          }
        }
      })
      .catch(() => setLoadError(true));
  }, [projectId]);

  if (loadError) return <div className="flex items-center justify-center h-screen text-gray-500">Failed to load project.</div>;

  // Empty shell while loading — same bg as chat layout, avoids flash
  if (initialMessages === null) return <div className="flex h-screen bg-[#f3f3f3]" />;

  return (
    <ChatPageInner
      key={projectId}
      projectId={projectId!}
      initialMessages={initialMessages}
      initialMessage={initialMessages.length === 0 ? initialMessage : undefined}
    />
  );
}

function ChatPageInner({
  projectId,
  initialMessages,
  initialMessage,
}: {
  projectId: string;
  initialMessages: StoredMessage[];
  initialMessage?: string;
}) {
  const chatAdapter: ChatModelAdapter = {
    async *run({ messages, abortSignal }) {
      try {
        const apiMessages = messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content
              .filter((p) => p.type === "text")
              .map((p) => ({ type: "text" as const, text: (p as { text: string }).text })),
          }));

        const res = await streamChat(projectId, apiMessages, abortSignal);

        if (res.status === 401) throw new Error("Please log in to continue.");
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
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data) continue;
            try {
              const { text: chunk } = JSON.parse(data);
              text += chunk;

              const match = text.match(/```html\n([\s\S]*?)(?:```|$)/);
              if (match) {
                // Only show artifact loading when HTML is actually being generated
                useArtifactStore.getState().setStreaming(true);
                useArtifactStore.getState().setCode(match[1]);
              }

              yield { content: [{ type: "text" as const, text }] };
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } finally {
        useArtifactStore.getState().setStreaming(false);
      }
    },
  };

  const runtime = useLocalRuntime(chatAdapter, {
    initialMessages: initialMessages.map((m) => ({
      role: m.role,
      content: m.content
        .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
        .map((p) => ({ type: "text" as const, text: p.text })),
    })),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatLayout initialMessage={initialMessage} />
    </AssistantRuntimeProvider>
  );
}
