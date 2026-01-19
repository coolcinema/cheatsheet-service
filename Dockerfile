    FROM node:20-alpine AS builder
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml .npmrc ./
    RUN --mount=type=secret,id=npm_token \
        export COOLCINEMA_GH_PKG_TOKEN=$(cat /run/secrets/npm_token) && \
        pnpm install --frozen-lockfile
    COPY . .
    # Сборка + Копирование статики (views, data)
    RUN pnpm run build

    FROM node:20-alpine
    WORKDIR /app
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    CMD ["node", "dist/main.js"]
