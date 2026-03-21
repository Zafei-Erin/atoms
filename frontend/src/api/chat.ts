import { apiUrl } from "./client";

type ContentPart = { type: string; text?: string };
type Message = { role: "user" | "assistant"; content: ContentPart[] };

export async function streamChat(
  projectId: string,
  messages: Message[],
  signal?: AbortSignal,
): Promise<Response> {
  const res = await fetch(apiUrl(`/api/chat/${projectId}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    credentials: "include",
    signal,
  });
  return res;
}
