import { eq } from "drizzle-orm";
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
