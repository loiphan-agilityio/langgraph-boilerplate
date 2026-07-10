# Stage 1: Build Next.js frontend
FROM oven/bun:1.3.14-slim AS frontend

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY src/ ./src/
COPY public/ ./public/
COPY next.config.ts tsconfig.json ./

# Docker override: use AG-UI HttpAgent instead of LangGraphAgent.
# Next.js 16+ rejects both /api/copilotkit/route.ts AND /api/copilotkit/[[...slug]]/route.ts
# at the same time — remove the default catch-all and drop in the HttpAgent route.
RUN rm -f ./src/app/api/copilotkit/\[\[...slug\]\]/route.ts
COPY docker-route-override.ts ./src/app/api/copilotkit/route.ts

ENV NODE_OPTIONS="--max-old-space-size=4096"
# Next.js 16+ uses Turbopack by default; use --webpack for serverExternalPackages compat
RUN bun run build:webpack

# Stage 2: Production image
FROM oven/bun:1.3.14-slim AS runner

WORKDIR /app

# Copy agent source and install its deps
COPY agent/ ./agent/
RUN cd agent && bun install --frozen-lockfile --ignore-scripts

# Copy Next.js standalone build
COPY --from=frontend /app/.next/standalone ./
COPY --from=frontend /app/.next/static ./.next/static
COPY --from=frontend /app/public ./public

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENV NODE_ENV=production

CMD ["./entrypoint.sh"]