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

export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | {
      type: "tool";
      toolCallId: string;
      toolName: string;
      status: "running" | "complete";
      argsText: string;
      result?: string;
    }
  | { type: "artifact-update"; code: string };

export type AgentEngineResult = {
  responseText: string;
  reasoningText: string;
  completedToolCalls: AgentToolCallPart[];
  updatedArtifact?: string;
  sessionId?: string;
};
