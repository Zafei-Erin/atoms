# Chat Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist chat conversations as "projects" in the database, with a collapsible sidebar for project navigation.

**Architecture:** Frontend sends all messages on each request (Method A). Backend saves user message → streams LLM response → saves assistant message → async title generation. Frontend loads history from `GET /api/projects/:id` and passes it as `initialMessages` to `useLocalRuntime`.

**Tech Stack:** Hono, Drizzle ORM, PostgreSQL, React, assistant-ui, Tailwind CSS, Zustand, React Router v7

---

## Reference: Design Doc
Full design: `docs/plans/2026-03-21-chat-persistence-design.md`

---

### Task 1: Add chat schema (projects + messages tables)

**Files:**
- Create: `backend/src/db/chat-schema.ts`
- Modify: `backend/src/db/index.ts`
- Modify: `backend/drizzle.config.ts`

**Step 1: Create `backend/src/db/chat-schema.ts`**

```typescript
import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
```

**Step 2: Update `backend/src/db/index.ts` to include chat schema**

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./auth-schema";
import * as chatSchema from "./chat-schema";

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  schema: { ...authSchema, ...chatSchema },
});
```

**Step 3: Update `backend/drizzle.config.ts` to include both schemas**

Change `schema` field:
```typescript
schema: ["./src/db/auth-schema.ts", "./src/db/chat-schema.ts"],
```

**Step 4: Generate and run migration**

```bash
cd backend
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Expected: two new migration files, tables created in DB.

**Step 5: Commit**
```bash
git add backend/src/db/chat-schema.ts backend/src/db/index.ts backend/drizzle.config.ts backend/drizzle/
git commit -m "feat: add projects and messages tables"
```

---

### Task 2: Backend — projects CRUD routes

**Files:**
- Create: `backend/src/routes/projects.ts`
- Modify: `backend/src/routes/index.ts`
- Modify: `backend/src/index.ts` (fix CORS to allow PATCH, DELETE)

**Step 1: Create `backend/src/routes/projects.ts`**

```typescript
import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { projects, messages } from "../db/chat-schema";
import { requireAuth } from "../middleware/auth";
import { generateId } from "../lib/id";

const projectsRouter = new Hono();

// Create project
projectsRouter.post("/", requireAuth, async (c) => {
  const user = c.get("user");
  const id = generateId();
  await db.insert(projects).values({
    id,
    userId: user.id,
    status: "active",
  });
  return c.json({ id });
});

// List active projects
projectsRouter.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, user.id), eq(projects.status, "active")))
    .orderBy(desc(projects.updatedAt));
  return c.json(rows);
});

// Get project + messages
projectsRouter.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });

  if (!project) return c.json({ error: "Not found" }, 404);
  if (project.status === "deleted") return c.json({ error: "Not found" }, 404);

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.projectId, id))
    .orderBy(messages.createdAt);

  return c.json({ ...project, messages: msgs });
});

// Update title
projectsRouter.patch("/:id/title", requireAuth, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const { title } = await c.req.json<{ title: string }>();

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  await db
    .update(projects)
    .set({ title, updatedAt: new Date() })
    .where(eq(projects.id, id));

  return c.json({ ok: true });
});

// Soft delete
projectsRouter.delete("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  await db
    .update(projects)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(eq(projects.id, id));

  return c.json({ ok: true });
});

export default projectsRouter;
```

**Step 2: Create `backend/src/lib/id.ts`**

```typescript
import { randomBytes } from "crypto";

export function generateId(): string {
  return randomBytes(12).toString("base64url");
}
```

**Step 3: Register routes in `backend/src/routes/index.ts`**

```typescript
import { Hono } from "hono";
import authRouter from "./auth";
import chatRouter from "./chat";
import projectsRouter from "./projects";

const router = new Hono();

router.route("/api/auth", authRouter);
router.route("/api/chat", chatRouter);
router.route("/api/projects", projectsRouter);

export default router;
```

**Step 4: Fix CORS in `backend/src/index.ts` to allow PATCH and DELETE**

Change `allowMethods`:
```typescript
allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
```

**Step 5: Commit**
```bash
git add backend/src/routes/projects.ts backend/src/lib/id.ts backend/src/routes/index.ts backend/src/index.ts
git commit -m "feat: add projects CRUD routes"
```

---

### Task 3: Backend — update chat route to persist messages + generate title

**Files:**
- Modify: `backend/src/routes/chat.ts`

**Step 1: Rewrite `backend/src/routes/chat.ts`**

```typescript
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import OpenAI from "openai";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { db } from "../db";
import { projects, messages } from "../db/chat-schema";
import { generateId } from "../lib/id";

const chatRouter = new Hono();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

type ContentPart = { type: string; text?: string };
type Message = { role: "user" | "assistant"; content: ContentPart[] };

chatRouter.post("/:projectId", requireAuth, async (c) => {
  const user = c.get("user");
  const projectId = c.req.param("projectId");
  const body = await c.req.json<{ messages: Message[] }>();

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return c.json({ error: "Invalid request: messages must be a non-empty array" }, 400);
  }

  // Verify project belongs to user
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
  });
  if (!project) return c.json({ error: "Not found" }, 404);

  const { messages: allMessages } = body;

  // Save the last user message (the new one)
  const lastMessage = allMessages[allMessages.length - 1];
  const userMessageId = generateId();
  await db.insert(messages).values({
    id: userMessageId,
    projectId,
    role: lastMessage.role,
    content: lastMessage.content,
  });

  // Update project updatedAt
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));

  const openaiMessages = allMessages.map((m) => ({
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

    let fullText = "";

    return streamSSE(c, async (sse) => {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          fullText += text;
          await sse.writeSSE({ data: JSON.stringify({ text }) });
        }
      }

      // Save assistant message
      const assistantMessageId = generateId();
      await db.insert(messages).values({
        id: assistantMessageId,
        projectId,
        role: "assistant",
        content: [{ type: "text", text: fullText }],
      });

      // Generate title if this is the first exchange (1 user message saved before this)
      const [{ value: msgCount }] = await db
        .select({ value: count() })
        .from(messages)
        .where(eq(messages.projectId, projectId));

      if (Number(msgCount) === 2 && !project.title) {
        generateTitle(projectId, lastMessage.content
          .filter((p) => p.type === "text")
          .map((p) => p.text ?? "")
          .join(""));
      }
    });
  } catch (e) {
    console.error("[chat] upstream error:", e);
    return c.json({ error: "An error occurred. Please try again." }, 500);
  }
});

async function generateTitle(projectId: string, userMessage: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "MiniMax-M2.5",
      messages: [
        {
          role: "user",
          content: `Generate a short 3-5 word title for a conversation that starts with: "${userMessage.slice(0, 200)}". Reply with only the title, no punctuation.`,
        },
      ],
      stream: false,
    });
    const title = completion.choices[0]?.message?.content?.trim();
    if (title) {
      await db.update(projects).set({ title }).where(eq(projects.id, projectId));
    }
  } catch (e) {
    console.error("[chat] title generation error:", e);
  }
}

export default chatRouter;
```

**Step 2: Note — chat route is now `POST /api/chat/:projectId`**

The old `POST /api/chat` no longer exists. Frontend must update accordingly.

**Step 3: Commit**
```bash
git add backend/src/routes/chat.ts
git commit -m "feat: persist messages and generate title in chat route"
```

---

### Task 4: Frontend — update routing and homepage

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/HomePage/index.tsx`
- Modify: `frontend/src/pages/index.ts` (if it exists)

**Step 1: Update route in `frontend/src/App.tsx`**

Change `/chat` to `/chat/:projectId`:
```tsx
<Route path="/chat/:projectId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
```

**Step 2: Update `frontend/src/pages/HomePage/index.tsx` — create project before navigating**

```tsx
const handleStart = async () => {
  if (isPending) return;
  if (!user) {
    navigate("/login");
    return;
  }
  const res = await fetch("/api/projects", {
    method: "POST",
    credentials: "include",
  });
  const { id } = await res.json();
  navigate(`/chat/${id}`, { state: { initialMessage: input } });
};
```

Note: `handleStart` becomes `async`. Update the function signature only — the JSX calling it stays the same.

**Step 3: Commit**
```bash
git add frontend/src/App.tsx frontend/src/pages/HomePage/index.tsx
git commit -m "feat: create project before navigating to chat"
```

---

### Task 5: Frontend — create Sidebar component

**Files:**
- Create: `frontend/src/pages/ChatPage/components/Sidebar.tsx`

**Step 1: Create `frontend/src/pages/ChatPage/components/Sidebar.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlusIcon, Trash2Icon, MessageSquareIcon, PanelLeftIcon } from "lucide-react";

interface Project {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const fetchProjects = async () => {
    const res = await fetch("/api/projects", { credentials: "include" });
    if (res.ok) setProjects(await res.json());
  };

  useEffect(() => {
    fetchProjects();
  }, [projectId]); // refetch when navigating to a new project

  const handleNew = async () => {
    const res = await fetch("/api/projects", {
      method: "POST",
      credentials: "include",
    });
    const { id } = await res.json();
    navigate(`/chat/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (id === projectId) navigate("/");
  };

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={onToggle}
        className="absolute top-3 left-3 z-10 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
        title={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <PanelLeftIcon className="size-4" />
      </button>

      {/* Sidebar panel */}
      {isOpen && (
        <div className="w-[220px] flex-shrink-0 flex flex-col bg-[#ebebeb] border-r border-gray-200 h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2 mt-8">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</span>
            <button
              onClick={handleNew}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
              title="New project"
            >
              <PlusIcon className="size-3.5" />
            </button>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {projects.length === 0 && (
              <p className="text-xs text-gray-400 px-2 py-3">No projects yet</p>
            )}
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/chat/${p.id}`)}
                className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                  p.id === projectId
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:bg-gray-200/60"
                }`}
              >
                <MessageSquareIcon className="size-3.5 flex-shrink-0 text-gray-400" />
                <span className="flex-1 truncate text-[13px]">
                  {p.title ?? "New Project"}
                </span>
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2Icon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
```

**Step 2: Commit**
```bash
git add frontend/src/pages/ChatPage/components/Sidebar.tsx
git commit -m "feat: add collapsible project sidebar"
```

---

### Task 6: Frontend — update ChatPage to load history + integrate sidebar

**Files:**
- Modify: `frontend/src/pages/ChatPage/index.tsx`
- Modify: `frontend/src/pages/ChatPage/components/ChatLayout.tsx`

**Step 1: Rewrite `frontend/src/pages/ChatPage/index.tsx`**

```tsx
import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ChatLayout } from "./components";
import { useArtifactStore } from "@/store/artifact";

interface StoredMessage {
  role: "user" | "assistant";
  content: { type: string; text?: string }[];
}

export function ChatPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const initialMessage = (location.state as { initialMessage?: string } | null)?.initialMessage;

  const [initialMessages, setInitialMessages] = useState<StoredMessage[] | null>(null);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setInitialMessages(data.messages ?? []));
  }, [projectId]);

  if (initialMessages === null) return null; // loading

  return (
    <ChatPageInner
      projectId={projectId!}
      initialMessages={initialMessages}
      initialMessage={initialMessage}
    />
  );
}

function ChatPageInner({
  projectId,
  initialMessages,
  initialMessage,
}: {
  projectId: string;
  initialMessages: StoredMessage[];
  initialMessage?: string;
}) {
  const chatAdapter: ChatModelAdapter = {
    async *run({ messages, abortSignal }) {
      useArtifactStore.getState().clear();

      const res = await fetch(`/api/chat/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: abortSignal,
        credentials: "include",
      });

      if (res.status === 401) throw new Error("Please log in to continue.");
      if (!res.ok) throw new Error("An error occurred. Please try again.");
      if (!res.body) throw new Error("Response body is not readable.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const { text: chunk } = JSON.parse(data);
            text += chunk;

            const match = text.match(/```html\n([\s\S]*?)(?:```|$)/);
            if (match) useArtifactStore.getState().setCode(match[1]);

            yield { content: [{ type: "text" as const, text }] };
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    },
  };

  const runtime = useLocalRuntime(chatAdapter, {
    initialMessages: initialMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatLayout initialMessage={initialMessage} />
    </AssistantRuntimeProvider>
  );
}
```

**Step 2: Update `frontend/src/pages/ChatPage/components/ChatLayout.tsx` — add sidebar**

Add `useState` for sidebar open state (default `false` — collapsed).

Add `Sidebar` import and render it before the left panel. Wrap everything in a relative container so the toggle button can be absolutely positioned.

Full updated file:

```tsx
import { ThreadPrimitive, useAui } from "@assistant-ui/react";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { Composer } from "./Composer";
import { CreditsBar } from "./CreditsBar";
import { ArtifactPanel } from "./ArtifactPanel";
import { Sidebar } from "./Sidebar";

const MIN_WIDTH = 240;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 330;

interface ChatLayoutProps {
  initialMessage?: string;
}

export function ChatLayout({ initialMessage }: ChatLayoutProps) {
  const { thread } = useAui();
  const sent = useRef(false);
  const [creditsVisible, setCreditsVisible] = useState(true);
  const [leftWidth, setLeftWidth] = useState(DEFAULT_WIDTH);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    if (initialMessage && !sent.current) {
      sent.current = true;
      setTimeout(() => {
        thread().append(initialMessage);
      }, 80);
    }
  }, [initialMessage, thread]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startWidth.current = leftWidth;
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const delta = e.clientX - startX.current;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
    setLeftWidth(newWidth);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.userSelect = "";
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.userSelect = "";
  };

  return (
    <div className="flex h-screen bg-white relative">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

      {/* Left panel */}
      <div
        className="flex-shrink-0 flex flex-col bg-[#f3f3f3]"
        style={{ width: leftWidth }}
      >
        <ThreadPrimitive.Root
          className="aui-root flex flex-col h-full"
          style={{ "--thread-max-width": "100%" } as React.CSSProperties}
        >
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 pt-12 pb-2">
            <div className="text-center text-[11px] text-gray-400 mb-4">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <ThreadPrimitive.Messages>
              {() => <ChatMessage />}
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>

          <div className="flex-shrink-0 px-3 pb-4 flex flex-col gap-2">
            {creditsVisible && (
              <CreditsBar onDismiss={() => setCreditsVisible(false)} />
            )}
            <Composer />
          </div>
        </ThreadPrimitive.Root>
      </div>

      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="w-1 flex-shrink-0 cursor-col-resize relative hover:bg-blue-400/30 transition-colors"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white overflow-hidden">
        <ArtifactPanel />
      </div>
    </div>
  );
}
```

Note: `pt-12` added to viewport so content clears the toggle button.

**Step 3: Export Sidebar from components index (if one exists)**

Check `frontend/src/pages/ChatPage/components/index.ts`. If it exports components, add:
```typescript
export { Sidebar } from "./Sidebar";
```

**Step 4: Commit**
```bash
git add frontend/src/pages/ChatPage/index.tsx frontend/src/pages/ChatPage/components/ChatLayout.tsx frontend/src/pages/ChatPage/components/Sidebar.tsx
git commit -m "feat: load message history and add sidebar to chat page"
```

---

### Task 7: Verify end-to-end

**Step 1: Start dev servers**
```bash
cd /path/to/atoms
pnpm dev
```

**Step 2: Manual verification checklist**
- [ ] Homepage: type a prompt, click start → creates project, navigates to `/chat/:id`
- [ ] Chat: send a message → streams, then user + assistant messages appear
- [ ] Refresh the page → historical messages reload in the thread
- [ ] Sidebar toggle button opens/closes sidebar
- [ ] Sidebar lists the project with generated title (may take a moment)
- [ ] Click "New Project" in sidebar → creates project, navigates to empty chat
- [ ] Delete a project → removed from list
- [ ] Direct URL `/chat/:id` → loads correctly

**Step 3: Commit if any fixes were made**
```bash
git add -p
git commit -m "fix: <describe what was fixed>"
```
