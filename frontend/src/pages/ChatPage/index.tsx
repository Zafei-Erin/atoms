import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ChatModelRunResult,
} from "@assistant-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ChatLayout } from "./components";
import { useArtifactStore } from "@/store/artifact";
import {
  getChoiceFromUserText,
  parseArtifactFromText,
} from "@/store/artifact-parser";
import { getProject } from "@/api/projects";
import { streamChat } from "@/api/chat";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type JsonObject = { [key: string]: JsonValue };

type StoredTextPart = { type: string; text?: string };
type StoredToolCallPart = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: JsonObject;
  argsText: string;
  result?: string;
};

type RuntimeTextPart = { type: "text" | "reasoning"; text: string };
type RuntimeToolCallPart = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: JsonObject;
  argsText: string;
  result?: string;
};

function isStoredToolCallPart(
  part: StoredTextPart | StoredToolCallPart,
): part is StoredToolCallPart {
  return part.type === "tool-call";
}

interface StoredMessage {
  role: "user" | "assistant";
  content: Array<StoredTextPart | StoredToolCallPart>;
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
          const previousUserMessage = i > 0 ? msgs[i - 1] : null;
          const previousUserText =
            previousUserMessage?.role === "user"
              ? previousUserMessage.content
                  .filter((p) => p.type === "text")
                  .map((p) => p.text ?? "")
                  .join("")
              : "";
          const artifact = parseArtifactFromText(text, {
            stage: getChoiceFromUserText(previousUserText) ? "final" : "proposals",
          });
          if (artifact.mode !== "empty") {
            useArtifactStore.getState().hydrateFromParsed(artifact);
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
  const toTextPart = (part: { type: string; text?: string }) => ({
    type: "text" as const,
    text: part.text ?? "",
  });

  const chatAdapter: ChatModelAdapter = {
    async *run({ messages, abortSignal }) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((message) => message.role === "user");
      const latestUserText = lastUserMessage?.content
        .filter((part) => part.type === "text")
        .map((part) => (part as { text?: string }).text ?? "")
        .join("") ?? "";
      const choice = getChoiceFromUserText(latestUserText);

      if (choice && useArtifactStore.getState().mode === "choices") {
        useArtifactStore.getState().selectChoice(choice);
      }

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
            args: JsonObject;
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
                let args: JsonObject = {};
                try {
                  args = JSON.parse(parsed.argsText) as JsonObject;
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
                const artifact = parseArtifactFromText(responseText, {
                  stage: choice ? "final" : "proposals",
                });
                if (artifact.mode !== "empty") {
                  useArtifactStore.getState().setStreaming(true);
                  useArtifactStore.getState().hydrateFromParsed(artifact);
                }
              }

              const content = Array.from(toolParts.values()) as Array<
                | RuntimeTextPart
                | (RuntimeToolCallPart & {
                    status: { type: "running" | "complete" };
                  })
              >;
              if (reasoningText) content.push({ type: "reasoning", text: reasoningText });
              if (responseText) content.push({ type: "text", text: responseText });

              yield { content } as unknown as ChatModelRunResult;
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
      content: m.content.reduce<Array<RuntimeTextPart | RuntimeToolCallPart>>((acc, p) => {
        if (isStoredToolCallPart(p)) {
          acc.push({
            type: "tool-call" as const,
            toolCallId: p.toolCallId,
            toolName: p.toolName,
            args: p.args,
            argsText: p.argsText,
            ...(p.result !== undefined ? { result: p.result } : {}),
          });
          return acc;
        }

        if (
          (p.type === "text" || p.type === "reasoning") &&
          typeof p.text === "string"
        ) {
          acc.push({ type: p.type as "text" | "reasoning", text: p.text });
          return acc;
        }

        if (p.type === "text") {
          acc.push(toTextPart(p));
        }

        return acc;
      }, []),
    })) as unknown as Parameters<typeof useLocalRuntime>[1]["initialMessages"],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatLayout initialMessage={initialMessage} />
    </AssistantRuntimeProvider>
  );
}
