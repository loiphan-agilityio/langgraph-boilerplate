# Install the locked Bun dependency tree, then run LangGraph on Node.js.
# LangGraph CLI uses tsx, whose CommonJS loader must be launched by Node rather
# than Bun in this version of the LangGraph CLI.
FROM oven/bun:1.3.14-slim AS dependencies

WORKDIR /app/agent

COPY agent/package.json agent/bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM node:20-bookworm-slim AS runner

WORKDIR /app/agent

COPY --from=dependencies /app/agent/node_modules ./node_modules
COPY agent/package.json ./
COPY agent/langgraph.koyeb.json agent/tsconfig.json ./
COPY agent/src ./src

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# `npm run` executes the CLI's `#!/usr/bin/env node` entry point with Node.js.
# The script reads Koyeb's PORT and binds to all interfaces.
CMD ["npm", "run", "start"]