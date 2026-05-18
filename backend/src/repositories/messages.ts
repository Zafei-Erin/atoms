import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { messages } from "../db/chat-schema";
import { generateId } from "../lib/id";

type ContentPart = { type: string; text?: string };

export async function insertMessage(
  projectId: string,
  role: string,
  content: ContentPart[],
) {
  const id = generateId();
  await db.insert(messages).values({ id, projectId, role, content });
  return id;
}

export async function getLatestArtifact(
  projectId: string,
): Promise<string | undefined> {
  const rows = await db
    .select({ content: messages.content })
    .from(messages)
    .where(eq(messages.projectId, projectId))
    .orderBy(desc(messages.createdAt));

  for (const row of rows) {
    const parts = row.content as ContentPart[];
    const artifact = parts.find((p) => p.type === "artifact");
    if (artifact?.text) return artifact.text;
  }
}
