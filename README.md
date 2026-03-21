# Atoms

一个支持多项目管理的 AI 对话应用，基于 React + Hono 构建。

## 技术栈

**前端**
- React 19 + TypeScript
- Vite + Tailwind CSS v4
- assistant-ui（对话 UI 组件）
- better-auth（认证）
- Zustand（状态管理）

**后端**
- Hono + Node.js
- Drizzle ORM + PostgreSQL
- better-auth
- OpenAI 兼容 API（默认 MiniMax）

## 本地开发

```bash
pnpm install
pnpm dev

# 或分别启动前后端
pnpm --filter backend dev
pnpm --filter frontend dev
```

前端运行在 http://localhost:5173，后端运行在 http://localhost:3000。

配置 `backend/.env`（参考 `backend/.env.example`），需要填写数据库地址和 API Key。

## Docker 部署

```bash
# 构建
docker build -f frontend/Dockerfile -t atoms-frontend .
docker build -f backend/Dockerfile -t atoms-backend .

# 启动
docker run -d --name atoms-frontend -p 5173:80 atoms-frontend
docker run --name atoms-backend -p 3000:3000 --env-file backend/.env atoms-backend
```
