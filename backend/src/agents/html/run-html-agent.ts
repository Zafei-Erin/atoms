import OpenAI from "openai";
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";
import { toChatMessages } from "./messages";
import { buildHtmlAgentPrompt } from "./prompt";
import {
  createLoadSkillToolDefinition,
  executeLoadSkill,
  listAvailableSkills,
  parseLoadSkillArgs,
} from "./tools/load-skill-tool";
import type { AgentMessage, AgentToolCallPart } from "./types";

const MAX_AGENT_TURNS = 8;

export type HtmlAgentEvent =
  | {
      type: "tool";
      toolCallId: string;
      toolName: string;
      status: "running" | "complete";
      argsText: string;
      result?: string;
    }
  | { type: "reasoning"; text: string }
  | { type: "text"; text: string };

type RunHtmlAgentOptions = {
  onEvent?: (event: HtmlAgentEvent) => Promise<void> | void;
};

function formatPreview(
  content:
    | string
    | null
    | Array<{ type?: string; text?: string; refusal?: string }>
    | undefined,
) {
  if (typeof content === "string") {
    return content.replace(/\s+/g, " ").trim().slice(0, 240);
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => ("text" in part ? (part.text ?? "") : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);
  }

  return "";
}

function logAgentMessage(message: ChatCompletionMessageParam) {
  if (message.role === "assistant") {
    const preview = formatPreview(message.content);
    const toolCalls =
      "tool_calls" in message && Array.isArray(message.tool_calls)
        ? message.tool_calls
            .filter(
              (
                call,
              ): call is typeof call & {
                type: "function";
                function: { name: string };
              } => call.type === "function" && "function" in call,
            )
            .map((call) => call.function.name)
            .join(", ")
        : "";

    if (toolCalls) {
      console.log(`[agent] assistant requested tools: ${toolCalls}`);
    }

    if (preview) {
      console.log(`[agent] assistant message: ${preview}`);
    }
  }

  if (message.role === "tool") {
    const preview = formatPreview(message.content);
    console.log(`[agent] tool result: ${preview}`);
  }
}

function getFunctionToolCalls(message: ChatCompletionAssistantMessageParam) {
  return (message.tool_calls ?? []).filter(
    (
      call,
    ): call is ChatCompletionMessageToolCall & {
      type: "function";
      function: { name: string; arguments: string };
    } => call.type === "function" && "function" in call,
  );
}

function appendToolCallDelta(
  toolCalls: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>,
  deltaToolCalls: Array<{
    index: number;
    id?: string;
    type?: "function";
    function?: { name?: string; arguments?: string };
  }>,
) {
  for (const deltaCall of deltaToolCalls) {
    const existing = toolCalls[deltaCall.index] ?? {
      id: "",
      type: "function" as const,
      function: { name: "", arguments: "" },
    };

    if (deltaCall.id) existing.id = deltaCall.id;
    if (deltaCall.type) existing.type = deltaCall.type;
    if (deltaCall.function?.name) {
      existing.function.name += deltaCall.function.name;
    }
    if (deltaCall.function?.arguments) {
      existing.function.arguments += deltaCall.function.arguments;
    }

    toolCalls[deltaCall.index] = existing;
  }
}

async function streamAssistantTurn(
  openai: OpenAI,
  conversation: ChatCompletionMessageParam[],
  options: RunHtmlAgentOptions,
  tools?: ReturnType<typeof createLoadSkillToolDefinition>[],
) {
  const stream = (await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "MiniMax-M2.5",
    messages: conversation,
    tools,
    tool_choice: tools ? "auto" : "none",
    stream: true,
    reasoning_split: true,
  } as any)) as unknown as AsyncIterable<ChatCompletionChunk>;

  let content = "";
  let reasoning = "";
  const toolCalls: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }> = [];

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta as Record<string, unknown>;
    const details = delta?.reasoning_details as { text?: string }[] | undefined;
    const reasoningDelta = details?.[0]?.text ?? "";
    const contentDelta = (delta?.content as string) ?? "";
    const toolCallDeltas = (delta?.tool_calls as
      | Array<{
          index: number;
          id?: string;
          type?: "function";
          function?: { name?: string; arguments?: string };
        }>
      | undefined) ?? [];

    if (reasoningDelta) {
      reasoning += reasoningDelta;
      await options.onEvent?.({ type: "reasoning", text: reasoningDelta });
    }

    if (contentDelta) {
      content += contentDelta;
      await options.onEvent?.({ type: "text", text: contentDelta });
    }

    if (toolCallDeltas.length > 0) {
      appendToolCallDelta(toolCalls, toolCallDeltas);
    }
  }

  const assistantMessage: ChatCompletionAssistantMessageParam = {
    role: "assistant",
    ...(content ? { content } : {}),
    ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
  };

  return {
    assistantMessage,
    reasoning,
  };
}

export async function runHtmlAgent(
  openai: OpenAI,
  messages: AgentMessage[],
  options: RunHtmlAgentOptions = {},
) {
  const availableSkills = await listAvailableSkills();
  const loadedSkills = new Set<string>();
  const conversation: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildHtmlAgentPrompt(availableSkills),
    },
    ...toChatMessages(messages),
  ];
  let responseText = "";
  let reasoningText = "";
  const completedToolCalls: AgentToolCallPart[] = [];

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn += 1) {
    const tools =
      loadedSkills.size === 0 ? [createLoadSkillToolDefinition()] : undefined;
    const { assistantMessage, reasoning } = await streamAssistantTurn(
      openai,
      conversation,
      options,
      tools,
    );

    conversation.push(assistantMessage);
    logAgentMessage(assistantMessage);
    if (typeof assistantMessage.content === "string") {
      responseText += assistantMessage.content;
    }
    reasoningText += reasoning;
    const toolCalls = getFunctionToolCalls(assistantMessage);

    if (toolCalls.length === 0) {
      return {
        responseText,
        reasoningText,
        completedToolCalls,
      };
    }

    for (const toolCall of toolCalls) {
      console.log(
        `[agent] tool call: ${toolCall.function.name}(${toolCall.function.arguments})`,
      );

      let toolResult = "";

      if (toolCall.function.name !== "load_skill") {
        toolResult = `Unknown tool: ${toolCall.function.name}`;
      } else {
        const args = parseLoadSkillArgs(toolCall.function.arguments);
        if (loadedSkills.has(args.skill_name)) {
          console.log("[agent] skill already loaded:", args.skill_name);
          toolResult = `Skill "${args.skill_name}" is already loaded in this run. Continue with the task using the previously loaded instructions.`;
        } else {
          loadedSkills.add(args.skill_name);
          await options.onEvent?.({
            type: "tool",
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            status: "running",
            argsText: toolCall.function.arguments,
          });
          toolResult = await executeLoadSkill(args);
        }

        completedToolCalls.push({
          type: "tool-call",
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          args,
          argsText: toolCall.function.arguments,
          result: toolResult,
        });
      }

      await options.onEvent?.({
        type: "tool",
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        status: "complete",
        argsText: toolCall.function.arguments,
        result: toolResult,
      });

      const toolMessage: ChatCompletionToolMessageParam = {
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult,
      };

      conversation.push(toolMessage);
      logAgentMessage(toolMessage);
    }
  }

  const lastMessage = conversation[conversation.length - 1];
  return {
    responseText:
      responseText ||
      (lastMessage?.role === "assistant" &&
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : ""),
    reasoningText,
    completedToolCalls,
  };
}
