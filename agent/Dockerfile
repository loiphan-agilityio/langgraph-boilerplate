# Production image for the standalone LangGraph API service.
# This Dockerfile is built from the repository root (for example, with
# `docker build -f agent/Dockerfile .`), as Koyeb does by default.
FROM oven/bun:1.3.14-slim

WORKDIR /app/agent

# The LangGraph CLI is a runtime dependency because it starts the API service.
COPY agent/package.json agent/bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY agent/langgraph.koyeb.json agent/tsconfig.json ./
COPY agent/src ./src

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# Koyeb supplies PORT at runtime. The start script binds to all interfaces and
# disables source reloading, which is intended only for local development.
CMD ["bun", "run", "start"]