import type { AgentEvent, AgentToolCallPart } from "../types";

type SDKMessage = { type: string; [key: string]: unknown };

export type StreamResult = {
  responseText: string;
  reasoningText: string;
  completedToolCalls: AgentToolCallPart[];
};

export function createStreamHandler(onEvent?: (event: AgentEvent) => Promise<void> | void) {
  let responseText = "";
  let reasoningText = "";
  const completedToolCalls: AgentToolCallPart[] = [];

  async function handle(msg: SDKMessage) {
    switch (msg.type) {
      case "stream_event": {
        const event = (msg as any).event;
        if (event?.type === "content_block_delta") {
          const delta = event.delta as Record<string, unknown>;
          if (delta.type === "text_delta" && typeof delta.text === "string") {
            responseText += delta.text;
            await onEvent?.({ type: "text", text: delta.text });
          } else if (delta.type === "thinking_delta" && typeof delta.thinking === "string") {
            reasoningText += delta.thinking;
            await onEvent?.({ type: "reasoning", text: delta.thinking });
          }
        }
        break;
      }

      case "assistant": {
        const content = (msg as any).message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "tool_use") {
              completedToolCalls.push({
                type: "tool-call",
                toolCallId: block.id,
                toolName: block.name,
                args: (block.input as Record<string, unknown>) ?? {},
                argsText: JSON.stringify(block.input ?? {}),
              });
              await onEvent?.({
                type: "tool",
                toolCallId: block.id,
                toolName: block.name,
                status: "complete",
                argsText: JSON.stringify(block.input ?? {}),
              });
            }
          }
        }
        break;
      }

      case "tool_progress": {
        const m = msg as any;
        await onEvent?.({
          type: "tool",
          toolCallId: m.tool_use_id,
          toolName: m.tool_name,
          status: "running",
          argsText: "",
        });
        break;
      }

      case "result": {
        const m = msg as any;
        if (m.subtype === "success" && m.result && !responseText) {
          responseText = m.result;
          await onEvent?.({ type: "text", text: m.result });
        }
        break;
      }
    }
  }

  function getResult(): StreamResult {
    return { responseText, reasoningText, completedToolCalls };
  }

  return { handle, getResult };
}
