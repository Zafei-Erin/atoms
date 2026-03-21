# Chat Persistence Design

## Overview

Persist chat conversations as "projects" in the database. Each project has a message history. Users can resume old projects or start new ones. A collapsible sidebar lists all projects.

---

## Data Model

### `projects`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| userId | text → user.id | cascade delete |
| title | text nullable | null while AI is generating |
| status | text DEFAULT 'active' | 'active' \| 'deleted' (soft delete) |
| createdAt | timestamp | |
| updatedAt | timestamp | updated on each new message |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| projectId | text → projects.id | cascade delete |
| role | text | 'user' \| 'assistant' |
| content | jsonb | assistant-ui content parts array: `[{ type: "text", text: "..." }, ...]` |
| createdAt | timestamp | |

Messages are always fetched `ORDER BY createdAt ASC`.

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects | Create new project, returns `{ id }` |
| GET | /api/projects | List user's active projects (updatedAt DESC) |
| GET | /api/projects/:id | Get project + messages (createdAt ASC) |
| PATCH | /api/projects/:id/title | Update project title |
| DELETE | /api/projects/:id | Soft delete (status → 'deleted') |
| POST | /api/chat/:projectId | Streaming chat + persist messages |

### Chat endpoint flow (`POST /api/chat/:projectId`)
1. Receive `{ messages: [...all messages...] }` from frontend (Method A — frontend owns full history)
2. Save the last user message to DB
3. Stream response from LLM to frontend (existing logic)
4. After stream ends, save complete assistant message to DB
5. If this is the first message in the project → async call LLM to generate a short title, PATCH to update

---

## Frontend

### Routing
```
/chat/:projectId   (replaces /chat)
```

### "Start for free" / New project flow
1. User submits prompt on homepage
2. Frontend `POST /api/projects` → gets `projectId`
3. `navigate(/chat/:projectId, { state: { initialMessage } })`

### ChatPage load flow
1. Read `projectId` from URL params
2. `GET /api/projects/:id` → fetch historical messages
3. Pass messages as `initialMessages` to `useLocalRuntime`
   - Required so LLM receives full context on next message
   - Required so UI renders historical messages in the thread
4. If `initialMessage` in location state → auto-send after mount

### Sidebar
- **Default**: collapsed
- **Toggle**: button to expand/collapse
- **Content**: project list (GET /api/projects, updatedAt DESC)
- **Each item**: title (or "New Project" if null) + delete button
- **Click item**: navigate to `/chat/:id`
- **Delete**: `DELETE /api/projects/:id` → remove from list
- **Top button**: "New Project" → `POST /api/projects` → navigate

### Title generation
- Triggered server-side after first assistant message is saved
- Sidebar refetches project list on each navigation to pick up new titles
