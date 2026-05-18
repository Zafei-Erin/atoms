import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type { AgentMessage } from "../types";

const SESSIONS_DIR = join(tmpdir(), "atoms-sessions");

export function ensureSessionDir(sessionId: string): string {
  const dir = join(SESSIONS_DIR, sessionId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function extractLastUserText(messages: AgentMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) return "";
  return last.content
    .filter((p) => p.type === "text")
    .map((p) => ("text" in p ? (p.text ?? "") : ""))
    .join("");
}

export function buildHistoryPrompt(messages: AgentMessage[]): string {
  return messages
    .map((m) => {
      const text = m.content
        .filter((p) => p.type === "text")
        .map((p) => ("text" in p ? (p.text ?? "") : ""))
        .join("");
      return `${m.role === "user" ? "User" : "Assistant"}: ${text}`;
    })
    .join("\n\n");
}
