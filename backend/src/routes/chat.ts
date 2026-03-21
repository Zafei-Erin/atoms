import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import OpenAI from "openai";
import type {
  AgentContentPart,
  AgentMessage,
  AgentToolCallPart,
} from "../agents/html";
import { runHtmlAgent } from "../agents/html";
import { requireAuth, type AuthVariables } from "../middleware/auth";
import { getProject, updateProject } from "../repositories/projects";
import { insertMessage } from "../repositories/messages";

const chatRouter = new Hono<{ Variables: AuthVariables }>();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

type Message = AgentMessage;

function isTextPart(part: Message["content"][number]): part is AgentContentPart {
  return part.type === "text";
}

chatRouter.post("/:projectId", requireAuth, async (c) => {
  const user = c.get("user");
  const projectId = c.req.param("projectId");
  const body = await c.req.json<{ messages: Message[] }>();

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
      const { responseText, reasoningText, completedToolCalls } =
        await runHtmlAgent(
        openai,
        allMessages,
        {
          onEvent: async (event) => {
            await sse.writeSSE({
              data: JSON.stringify(event),
            });
          },
        },
      );

      const content: Array<AgentContentPart | AgentToolCallPart> = [
        ...completedToolCalls,
      ];
      if (reasoningText) content.push({ type: "reasoning", text: reasoningText });
      if (responseText) content.push({ type: "text", text: responseText });
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
) {
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
  } catch (e) {
    console.error("[chat] title generation error:", e);
  }
}

export default chatRouter;
