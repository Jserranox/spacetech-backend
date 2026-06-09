FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy manifests first for better layer caching.
# pnpm-workspace.yaml references: botBackEnd, botWorker, libs/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY botBackEnd/package.json  ./botBackEnd/
COPY botWorker/package.json   ./botWorker/
COPY libs/database/package.json ./libs/database/
COPY libs/queue/package.json    ./libs/queue/
COPY libs/types/package.json    ./libs/types/
COPY libs/logger/package.json   ./libs/logger/

RUN pnpm install --frozen-lockfile

# Copy source after deps to maximize cache hits
COPY botBackEnd/ ./botBackEnd/
COPY libs/       ./libs/

RUN pnpm --filter botBackEnd run build

EXPOSE 3000

# start:prod in botBackEnd/package.json is "node dist/main"
# from WORKDIR /app the compiled output is at botBackEnd/dist/main.js
CMD ["node", "botBackEnd/dist/main.js"]
