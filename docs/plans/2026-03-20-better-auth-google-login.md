# Better Auth Google Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 使用 Better Auth 实现 Google OAuth 登录，接通前后端，支持 session 管理。

**Architecture:** 后端在 `backend/src/lib/auth.ts` 初始化 Better Auth（PostgreSQL + Google OAuth），通过 Hono 挂载到 `/api/auth/*`；前端在 `frontend/src/lib/auth-client.ts` 创建 Better Auth 客户端，LoginPage 的 Google 按钮调用 `authClient.signIn.social({ provider: "google" })`。

**Tech Stack:** Better Auth 1.x, Hono 4.x, pg (node-postgres), React 19, Vite, Neon PostgreSQL

---

## 前置条件

- Node.js / pnpm 已安装
- Neon PostgreSQL 连接串已就绪（用户已提供）
- Google Cloud Console 已创建 OAuth 2.0 Client ID（需手动配置，见 Task 1）

---

### Task 1: 配置 .env 文件 + 更新 .gitignore

**Files:**
- Create: `backend/.env`
- Create: `backend/.env.example`
- Modify: `.gitignore`

**Step 1: 在 .gitignore 添加 .env**

```
# .gitignore 追加内容
.env
.env.local
```

**Step 2: 创建 backend/.env**

```env
# Better Auth
BETTER_AUTH_SECRET=<运行 openssl rand -base64 32 生成>
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth（从 Google Cloud Console 获取）
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Database（Neon PostgreSQL）
DATABASE_URL=postgresql://neondb_owner:<password>@<host>/neondb?sslmode=require&channel_binding=require
```

**Step 3: 创建 backend/.env.example（提交到 git 的模板）**

```env
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

**Step 4: 生成 BETTER_AUTH_SECRET**

```bash
openssl rand -base64 32
```

将输出填入 `backend/.env` 的 `BETTER_AUTH_SECRET`。

**Step 5: Commit**

```bash
git add .gitignore backend/.env.example
git commit -m "chore: add .env template and gitignore .env files"
```

---

### Task 2: 安装后端依赖

**Files:**
- Modify: `backend/package.json`（pnpm 自动更新）

**Step 1: 安装 better-auth 和 pg**

```bash
cd backend && pnpm add better-auth pg
pnpm add -D @types/pg
```

**Step 2: 验证安装**

```bash
cat backend/package.json | grep -E "better-auth|\"pg\""
```

Expected output:
```
"better-auth": "^1.x.x",
"pg": "^8.x.x",
```

**Step 3: Commit**

```bash
git add backend/package.json backend/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "chore(backend): add better-auth and pg dependencies"
```

---

### Task 3: 安装前端依赖

**Files:**
- Modify: `frontend/package.json`

**Step 1: 安装 better-auth 客户端**

```bash
cd frontend && pnpm add better-auth
```

**Step 2: 验证安装**

```bash
cat frontend/package.json | grep "better-auth"
```

**Step 3: Commit**

```bash
git add frontend/package.json pnpm-lock.yaml
git commit -m "chore(frontend): add better-auth dependency"
```

---

### Task 4: 创建后端 auth 配置

**Files:**
- Create: `backend/src/lib/auth.ts`

**Step 1: 创建目录**

```bash
mkdir -p backend/src/lib
```

**Step 2: 创建 auth 配置文件**

```typescript
// backend/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const auth = betterAuth({
  database: {
    db: pool,
    type: "postgres",
  },
  trustedOrigins: ["http://localhost:5173"],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
```

**注意：**
- `trustedOrigins` 设为前端地址（开发时 5173）
- `ssl: { rejectUnauthorized: false }` 适用于 Neon 等托管 PostgreSQL
- 生产部署时 `BETTER_AUTH_URL` 改为实际域名

**Step 3: Commit**

```bash
git add backend/src/lib/auth.ts
git commit -m "feat(backend): add better-auth config with Google OAuth"
```

---

### Task 5: 修改 Hono 入口，挂载 auth 路由 + CORS

**Files:**
- Modify: `backend/src/index.ts`

**Step 1: 安装 @hono/cors（如未包含）**

```bash
cd backend && pnpm add @hono/cors
```

**Step 2: 修改 backend/src/index.ts**

```typescript
// backend/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { auth } from "./lib/auth";

const app = new Hono();

// CORS：允许前端访问，携带 cookie
app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"],
    credentials: true,
  })
);

// Better Auth 处理所有 /api/auth/* 请求
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.get("/", (c) => {
  return c.json({ message: "Hello from Hono!" });
});

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
});
```

**Step 3: Commit**

```bash
git add backend/src/index.ts backend/package.json
git commit -m "feat(backend): mount better-auth routes with CORS"
```

---

### Task 6: 运行数据库迁移，创建 Better Auth 表

**Step 1: 在 backend 目录运行迁移**

```bash
cd backend && npx @better-auth/cli migrate
```

如果提示选择数据库，选 `PostgreSQL`，并确认使用 `.env` 里的 `DATABASE_URL`。

**Step 2: 验证迁移成功**

连接到 Neon 数据库，检查是否创建了以下表：
- `user`
- `session`
- `account`
- `verification`

```bash
# 可用 psql 或 Neon Console 查看
psql "$DATABASE_URL" -c "\dt"
```

Expected output 包含：
```
 public | account      | table | ...
 public | session      | table | ...
 public | user         | table | ...
 public | verification | table | ...
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(backend): run better-auth database migration"
```

---

### Task 7: 创建前端 auth 客户端

**Files:**
- Create: `frontend/src/lib/auth-client.ts`

**Step 1: 创建目录**

```bash
mkdir -p frontend/src/lib
```

**Step 2: 创建 auth-client.ts**

```typescript
// frontend/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});
```

**Step 3: Commit**

```bash
git add frontend/src/lib/auth-client.ts
git commit -m "feat(frontend): add better-auth client"
```

---

### Task 8: 接通 LoginPage 的 Google 登录按钮

**Files:**
- Modify: `frontend/src/pages/LoginPage/index.tsx`

**Step 1: 修改 LoginPage，添加 Google 登录逻辑**

在文件顶部导入 authClient：

```typescript
import { authClient } from "../../lib/auth-client";
```

将 Google 按钮的 `onClick` 改为调用 Google OAuth：

```typescript
const handleGoogleLogin = async () => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "http://localhost:5173",
  });
};
```

将 Google 按钮更新为：

```typescript
<button
  type="button"
  onClick={handleGoogleLogin}
  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl text-[14.5px] font-medium text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
>
  <GoogleIcon />
  Log in with Google
</button>
```

**Step 2: Commit**

```bash
git add frontend/src/pages/LoginPage/index.tsx
git commit -m "feat(frontend): connect Google login button to better-auth"
```

---

### Task 9: 手动测试整个流程

**Step 1: 启动开发服务器**

```bash
# 项目根目录
pnpm dev
```

**Step 2: 验证后端 auth 端点可访问**

```bash
curl http://localhost:3000/api/auth/get-session
```

Expected: `{"session": null}` 或 `{"user": null}`

**Step 3: 打开前端，测试 Google 登录**

1. 访问 `http://localhost:5173/login`
2. 点击 "Log in with Google"
3. 应跳转到 Google OAuth 授权页
4. 授权后重定向回 `http://localhost:5173`
5. 登录成功

---

## Google Cloud Console 配置（必须手动完成）

在实现前，需要在 Google Cloud Console 创建 OAuth 凭据：

1. 访问 https://console.cloud.google.com/apis/credentials
2. 创建 OAuth 2.0 客户端 ID（应用类型：Web 应用）
3. 授权的重定向 URI 添加：`http://localhost:3000/api/auth/callback/google`
4. 将 Client ID 和 Client Secret 填入 `backend/.env`

---

## 文件结构总览

```
atoms/
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── auth.ts          ← NEW: Better Auth 配置
│   │   └── index.ts             ← MODIFIED: 挂载 auth 路由 + CORS
│   ├── .env                     ← NEW: 环境变量（不提交）
│   └── .env.example             ← NEW: 模板（提交）
└── frontend/
    └── src/
        ├── lib/
        │   └── auth-client.ts   ← NEW: Better Auth 客户端
        └── pages/
            └── LoginPage/
                └── index.tsx    ← MODIFIED: 接通 Google 登录
```
