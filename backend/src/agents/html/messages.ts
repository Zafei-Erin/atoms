import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { AgentContentPart, AgentMessage } from "./types";

function isTextPart(part: AgentMessage["content"][number]): part is AgentContentPart {
  return part.type === "text";
}

export function toChatMessages(
  messages: AgentMessage[],
): ChatCompletionMessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content
      .filter(isTextPart)
      .map((part) => part.text ?? "")
      .join(""),
  }));
}
