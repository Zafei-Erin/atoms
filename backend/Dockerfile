# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# Install dependencies (including dev for tsc)
RUN pnpm install --frozen-lockfile --filter backend

# Copy source
COPY backend/ ./backend/

# Compile TypeScript
WORKDIR /app/backend
RUN pnpm build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# Install production deps only
RUN pnpm install --frozen-lockfile --filter backend --prod

# Copy compiled output
COPY --from=builder /app/backend/dist ./backend/dist

EXPOSE 3000

CMD ["node", "backend/dist/index.js"]
