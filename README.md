# Atoms

AI 驱动的产品原型构建工具。通过自然语言对话描述想法，AI 实时生成可交互的 HTML 原型，帮助快速验证和迭代产品设计。

## 技术栈

**前端**
- React 19 + TypeScript
- Vite 8 + Tailwind CSS v4
- assistant-ui（AI 对话 UI 组件）
- Zustand（状态管理）
- better-auth（认证客户端）

**后端**
- Hono + Node.js
- Drizzle ORM + PostgreSQL
- better-auth（Google OAuth）
- OpenAI 兼容 API（默认 MiniMax-M2.5）

## 快速开始

### 前置要求

- Node.js 23+（见 `.nvmrc`）
- pnpm
- PostgreSQL 数据库（本地或云服务如 Neon）
- Google OAuth 凭据（[Google Cloud Console](https://console.cloud.google.com/apis/credentials)）
- MiniMax API Key（或其他 OpenAI 兼容 API）

### 1. 克隆并安装依赖

```bash
git clone git@github.com:Zafei-Erin/atoms.git
cd atoms
pnpm install
```

### 2. 配置环境变量

**后端：**

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`，填入以下配置：

```env
# 认证
BETTER_AUTH_SECRET=          # 运行 openssl rand -base64 32 生成
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:5173
DOMAIN=                     # 前后端的公共域名，确保cookie可以正常传递

# Google OAuth
GOOGLE_CLIENT_ID=            # 从 Google Cloud Console 获取
GOOGLE_CLIENT_SECRET=

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/atoms

# AI 模型
OPENAI_API_KEY=              # MiniMax API Key
OPENAI_BASE_URL=https://api.minimax.io/v1
OPENAI_MODEL=MiniMax-M2.7
```

**前端：**

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost:3000
VITE_APP_URL=http://localhost:5173
```

### 3. 初始化数据库

```bash
cd backend
pnpm drizzle-kit push
```

### 4. 配置 Google OAuth 回调

在 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 中，将以下地址添加为授权重定向 URI：

```
http://localhost:3000/api/auth/callback/google
```

### 5. 启动开发服务器

```bash
# 在项目根目录
pnpm dev

# 或者分别运行
pnpm --filter backend dev
pnpm --filter frontend dev
```

前端运行在 http://localhost:5173 
后端运行在 http://localhost:3000 

## 部署

### CI/CD 自动部署

项目配置了 GitHub Actions，推送到 `main` 分支会自动触发：

1. **CI**：安装依赖 → 前端 lint + 构建 → 后端构建
2. **Deploy**：SSH 到 VPS → `git pull` → `docker compose up --build -d`

需要在 GitHub 仓库的 Settings → Secrets 中配置：

- `SSH_HOST` — 服务器地址
- `SSH_USER` — SSH 用户名
- `SSH_PRIVATE_KEY` — SSH 私钥

### 手动 Docker 部署

```bash
docker build -f frontend/Dockerfile -t atoms-frontend .
docker build -f backend/Dockerfile -t atoms-backend .
docker compose up -d
```

## 项目结构

```
atoms/
├── backend/
│   ├── src/
│   │   ├── agents/html/       # AI Agent（Agent Loop + 工具调用）
│   │   ├── db/                # 数据库 schema（Drizzle ORM）
│   │   ├── routes/            # API 路由（auth、chat、projects）
│   │   ├── repositories/     # 数据访问层
│   │   ├── middleware/        # 认证中间件
│   │   └── lib/               # 认证配置、Skills 加载
│   ├── drizzle/               # 数据库迁移文件
│   └── skills/                # Skills 目录（SKILL.md 文件）
├── frontend/
│   ├── src/
│   │   ├── pages/             # HomePage、ChatPage、LoginPage
│   │   ├── components/        # UI 组件、assistant-ui 定制
│   │   ├── store/             # Zustand 状态（artifact 解析）
│   │   ├── api/               # API 客户端
│   │   └── context/           # Auth Context
├── docker-compose.yml
└── DESIGN.md                  # 设计说明文档
```
