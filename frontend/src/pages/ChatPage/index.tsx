import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ChatLayout } from "./components";
import { useArtifactStore } from "@/store/artifact";
import { getProject } from "@/api/projects";
import { streamChat } from "@/api/chat";

interface StoredMessage {
  role: "user" | "assistant";
  content: Array<
    | { type: string; text?: string }
    | {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
        args: Record<string, unknown>;
        argsText: string;
        result?: string;
      }
  >;
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
        let reasoningText = "";
        let responseText = "";
        const toolParts = new Map<
          string,
          {
            type: "tool-call";
            toolCallId: string;
            toolName: string;
            args: Record<string, unknown>;
            argsText: string;
            status: { type: "running" | "complete" };
            result?: string;
          }
        >();

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
              const parsed = JSON.parse(data) as
                | { type: "reasoning"; text: string }
                | { type: "text"; text: string }
                | {
                    type: "tool";
                    toolCallId: string;
                    toolName: string;
                    status: "running" | "complete";
                    argsText: string;
                    result?: string;
                  };

              if (parsed.type === "reasoning") {
                reasoningText += parsed.text;
              } else if (parsed.type === "tool") {
                let args: Record<string, unknown> = {};
                try {
                  args = JSON.parse(parsed.argsText) as Record<string, unknown>;
                } catch {
                  args = {};
                }

                toolParts.set(parsed.toolCallId, {
                  type: "tool-call",
                  toolCallId: parsed.toolCallId,
                  toolName: parsed.toolName,
                  args,
                  argsText: parsed.argsText,
                  status: { type: parsed.status },
                  ...(parsed.result !== undefined ? { result: parsed.result } : {}),
                });
              } else {
                responseText += parsed.text;

                const match = responseText.match(/```html\n([\s\S]*?)(?:```|$)/);
                if (match) {
                  useArtifactStore.getState().setStreaming(true);
                  useArtifactStore.getState().setCode(match[1]);
                }
              }

              const content: Array<
                | { type: "text" | "reasoning"; text: string }
                | {
                    type: "tool-call";
                    toolCallId: string;
                    toolName: string;
                    args: Record<string, unknown>;
                    argsText: string;
                    status: { type: "running" | "complete" };
                    result?: string;
                  }
              > = Array.from(toolParts.values());
              if (reasoningText) content.push({ type: "reasoning", text: reasoningText });
              if (responseText) content.push({ type: "text", text: responseText });

              yield { content };
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
      content: m.content.flatMap((p) => {
        if (
          (p.type === "text" || p.type === "reasoning") &&
          typeof p.text === "string"
        ) {
          return [{ type: p.type as "text" | "reasoning", text: p.text }];
        }

        if (p.type === "tool-call") {
          return [
            {
              type: "tool-call" as const,
              toolCallId: p.toolCallId,
              toolName: p.toolName,
              args: p.args,
              argsText: p.argsText,
              ...(p.result !== undefined ? { result: p.result } : {}),
            },
          ];
        }

        return [];
      }),
    })),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatLayout initialMessage={initialMessage} />
    </AssistantRuntimeProvider>
  );
}
