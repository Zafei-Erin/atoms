import { randomUUID } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentEngineResult, AgentEvent, AgentMessage } from "../types";
import { buildGenerationPrompt, buildEditPrompt } from "./prompt";
import { ensureSessionDir, extractLastUserText, buildHistoryPrompt } from "./utils";
import { createStreamHandler } from "./stream-handler";
import { getLatestArtifact } from "../../repositories/messages";

export type ClaudeAgentOptions = {
  onEvent?: (event: AgentEvent) => Promise<void> | void;
  sessionId?: string;
  projectId?: string;
};

async function executeQuery(
  prompt: string,
  sessionId: string,
  isResume: boolean,
  workDir: string,
  artifactPath: string,
  originalArtifact: string | undefined,
  onEvent: ClaudeAgentOptions["onEvent"],
): Promise<AgentEngineResult> {
  const hasArtifact = existsSync(artifactPath);

  const queryOptions: Record<string, unknown> = {
    systemPrompt: hasArtifact ? buildEditPrompt(artifactPath) : buildGenerationPrompt(),
    allowedTools: hasArtifact ? ["Read", "Edit"] : [],
    maxTurns: 30,
    includePartialMessages: true,
    permissionMode: "bypassPermissions",
    cwd: workDir,
  };

  if (isResume) {
    queryOptions.resume = sessionId;
  } else {
    queryOptions.sessionId = sessionId;
  }

  const stream = createStreamHandler(onEvent);

  for await (const msg of query({ prompt, options: queryOptions as any })) {
    await stream.handle(msg as any);
  }

  // Check if artifact was created or modified
  let updatedArtifact: string | undefined;
  if (existsSync(artifactPath)) {
    const fileContent = readFileSync(artifactPath, "utf8");
    if (fileContent && fileContent !== (originalArtifact ?? "")) {
      updatedArtifact = fileContent;
      await onEvent?.({ type: "artifact-update", code: fileContent });
    }
  }

  return { ...stream.getResult(), updatedArtifact, sessionId };
}

export async function runClaudeAgent(
  messages: AgentMessage[],
  options: ClaudeAgentOptions = {},
  currentArtifact?: string,
): Promise<AgentEngineResult> {
  const isResume = !!options.sessionId;
  const sessionId = options.sessionId ?? randomUUID();
  const workDir = ensureSessionDir(sessionId);
  const artifactPath = join(workDir, "artifact.html");

  if (currentArtifact && !existsSync(artifactPath)) {
    writeFileSync(artifactPath, currentArtifact);
  }

  const userText = extractLastUserText(messages);

  try {
    return await executeQuery(userText, sessionId, isResume, workDir, artifactPath, currentArtifact, options.onEvent);
  } catch (e) {
    if (!isResume) throw e;

    console.error("[claude-agent] session resume failed, rebuilding:", (e as Error).message);

    // Rebuild with same session ID but as a new session
    const dbArtifact = options.projectId
      ? await getLatestArtifact(options.projectId)
      : undefined;
    const artifactToRestore = dbArtifact ?? currentArtifact;
    if (artifactToRestore) {
      writeFileSync(artifactPath, artifactToRestore);
    }

    const history = buildHistoryPrompt(messages.slice(0, -1));
    const prompt = history ? `${history}\n\nUser: ${userText}` : userText;

    return await executeQuery(prompt, sessionId, false, workDir, artifactPath, artifactToRestore, options.onEvent);
  }
}
