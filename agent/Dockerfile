# Production image for the standalone LangGraph API service.
# Deploy this image on Koyeb with `agent/` selected as the service root directory.
FROM oven/bun:1.3.14-slim

WORKDIR /app

# The LangGraph CLI is a development dependency, so install all locked packages.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY langgraph.json langgraph.koyeb.json tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# Koyeb supplies PORT at runtime. The start script binds to all interfaces and
# disables source reloading, which is intended only for local development.
CMD ["bun", "run", "start"]