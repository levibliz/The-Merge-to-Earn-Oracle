# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm build

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable

COPY package.json ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY prisma/ ./prisma/
RUN pnpm db:generate

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
