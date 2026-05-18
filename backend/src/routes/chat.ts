import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import OpenAI from "openai";
import type {
  AgentContentPart,
  AgentEngineResult,
  AgentEvent,
  AgentMessage,
  AgentToolCallPart,
} from "../agents/types";
import { runHtmlAgent } from "../agents/html";
import { runClaudeAgent } from "../agents/claude/run-claude-agent";
import { requireAuth, type AuthVariables } from "../middleware/auth";
import { getProject, updateProject } from "../repositories/projects";
import { insertMessage } from "../repositories/messages";

const chatRouter = new Hono<{ Variables: AuthVariables }>();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

function isTextPart(part: AgentMessage["content"][number]): part is AgentContentPart {
  return part.type === "text";
}

chatRouter.post("/:projectId", requireAuth, async (c) => {
  const user = c.get("user");
  const projectId = c.req.param("projectId");
  const body = await c.req.json<{ messages: AgentMessage[]; currentArtifact?: string }>();

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return c.json(
      { error: "Invalid request: messages must be a non-empty array" },
      400,
    );
  }

  const project = await getProject(projectId, user.id);
  if (!project) return c.json({ error: "Not found" }, 404);

  const { messages: allMessages } = body;
  const lastMessage = allMessages[allMessages.length - 1];

  await insertMessage(projectId, lastMessage.role, lastMessage.content);
  await updateProject(projectId, user.id, { updatedAt: new Date() });

  if (!project.title && allMessages.length === 1) {
    generateTitle(
      projectId,
      user.id,
      lastMessage.content
        .filter(isTextPart)
        .map((p) => p.text ?? "")
        .join(""),
    );
  }

  try {
    return streamSSE(c, async (sse) => {
      const onEvent = async (event: AgentEvent) => {
        await sse.writeSSE({ data: JSON.stringify(event) });
      };

      const isClaudeEngine = process.env.AGENT_ENGINE === "claude";

      let result: AgentEngineResult;
      if (isClaudeEngine) {
        result = await runClaudeAgent(
          allMessages,
          { onEvent, sessionId: project.claudeSessionId ?? undefined, projectId },
          body.currentArtifact,
        );
      } else {
        result = await runHtmlAgent(openai, allMessages, { onEvent });
      }

      // Persist session ID if newly created or changed (fallback rebuilt)
      if (result.sessionId && result.sessionId !== project.claudeSessionId) {
        await updateProject(projectId, user.id, { claudeSessionId: result.sessionId });
      }

      const content: Array<AgentContentPart | AgentToolCallPart> = [
        ...result.completedToolCalls,
      ];
      if (result.reasoningText) content.push({ type: "reasoning", text: result.reasoningText });
      if (result.responseText) content.push({ type: "text", text: result.responseText });
      if (result.updatedArtifact) {
        content.push({ type: "artifact", text: result.updatedArtifact });
      }
      await insertMessage(projectId, "assistant", content);
    });
  } catch (e) {
    console.error("[chat] upstream error:", e);
    return c.json({ error: "An error occurred. Please try again." }, 500);
  }
});

async function generateTitle(
  projectId: string,
  userId: string,
  userMessage: string,
  retries = 3,
) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // @ts-ignore — MiniMax 扩展参数
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "MiniMax-M2.5",
        messages: [
          {
            role: "user",
            content: `Generate a short 3-5 word title for a conversation that starts with: "${userMessage.slice(0, 200)}". Reply with only the title, no punctuation.`,
          },
        ],
        stream: false,
        reasoning_split: true,
      });
      const title = (completion.choices[0]?.message?.content ?? "").trim();
      if (title) {
        await updateProject(projectId, userId, { title });
      }
      return;
    } catch (e) {
      console.error(`[chat] title generation error (attempt ${attempt + 1}/${retries}):`, e);
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }
}

export default chatRouter;
