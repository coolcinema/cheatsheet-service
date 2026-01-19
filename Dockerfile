# Stage 1: Build
FROM node:20-alpine AS builder
# Включаем pnpm
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./

# Безопасная установка зависимостей. 
# Секрет 'npm_token' монтируется только на время выполнения команды.
# Мы читаем его из файла и экспортируем в переменную окружения, которую ждет .npmrc
RUN --mount=type=secret,id=npm_token \
    export COOLCINEMA_GH_PKG_TOKEN=$(cat /run/secrets/npm_token) && \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
COPY src/proto ./dist/proto


# Stage 2: Run
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
