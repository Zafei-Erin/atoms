export type AgentContentPart = { type: string; text?: string };
export type AgentToolCallPart = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  argsText: string;
  result?: string;
};

export type AgentMessage = {
  role: "user" | "assistant";
  content: Array<AgentContentPart | AgentToolCallPart>;
};
