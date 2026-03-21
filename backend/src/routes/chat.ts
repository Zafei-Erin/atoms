import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import OpenAI from "openai";
import { requireAuth } from "../middleware/auth";

const chatRouter = new Hono();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

type MessagePart = { type: string; text?: string };
type Message = { role: "user" | "assistant"; content: MessagePart[] };

chatRouter.post("/", requireAuth, async (c) => {
  const body = await c.req.json<{ messages: Message[] }>();

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return c.json(
      { error: "Invalid request: messages must be a non-empty array" },
      400,
    );
  }

  const { messages } = body;

  const openaiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join(""),
  }));

  try {
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "MiniMax-M2.5",
      messages: [
        {
          role: "system",
          content: `You are an expert full-stack developer. When the user asks you to build something, always produce a single, complete, self-contained HTML file with all CSS and JavaScript inline. Wrap the file in a \`\`\`html code block. The app must work without any external dependencies or build steps — use CDN links if needed (e.g. Tailwind CDN, Alpine.js, Chart.js). After the code block, briefly explain what you built.`,
        },
        ...openaiMessages,
      ],
      stream: true,
    });

    return streamSSE(c, async (sse) => {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          await sse.writeSSE({ data: JSON.stringify({ text }) });
        }
      }
    });
  } catch (e) {
    console.error("[chat] upstream error:", e);
    return c.json({ error: "An error occurred. Please try again." }, 500);
  }
});

export default chatRouter;
