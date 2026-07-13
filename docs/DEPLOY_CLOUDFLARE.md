# Deploy the Next.js UI to Cloudflare Workers

This project deploys the Next.js UI as a Cloudflare Worker with
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare/get-started).
The LangGraph API in `agent/` remains a separate service: Cloudflare Workers do
not start that server.

## One-time setup

1. Deploy `agent/` to a public HTTPS service. The Koyeb configuration is
   documented in [DEPLOY_KOYEB.md](./DEPLOY_KOYEB.md). Confirm that
   `https://<agent-host>/ok` returns `200`.
2. Update the Worker name in `wrangler.jsonc` if `langgraph-js-starter` is not
   the desired production Worker name. Keep `services[0].service` identical to
   `name`.
3. Authenticate the Wrangler CLI with the Cloudflare account that owns the
   Worker.

## Local production validation

Install dependencies, then make a local environment file from the checked-in
template and set a reachable agent URL:

```sh
cp .env.example .env
# Edit .env and set AGENT_URL if your LangGraph agent is not on localhost:8123.
cp .dev.vars.example .dev.vars
bun run cf:build
bun run cf:preview
```

`cf:build` runs `next build` and produces the Worker bundle in `.open-next/`.
`cf:preview` rebuilds, then serves that exact bundle in the local Workers
runtime. It is the required local pre-push check. `bun run dev` is still useful
for normal UI and agent development.

## Cloudflare environment variables

In **Workers & Pages → <your Worker> → Settings → Variables and Secrets**, add
these **runtime** variables before deploying:

| Name | Type | Required | Value |
| --- | --- | --- | --- |
| `AGENT_URL` | Variable | Yes | Public LangGraph URL, e.g. `https://your-agent.koyeb.app` |
| `COPILOTKIT_LICENSE_TOKEN` | Secret | Optional | Enables CopilotKit Threads |
| `INTELLIGENCE_API_KEY` | Secret | Optional | CopilotKit Intelligence project API key |
| `INTELLIGENCE_API_URL` | Variable | Optional | `https://api.intelligence.copilotkit.ai` |
| `INTELLIGENCE_GATEWAY_WS_URL` | Variable | Optional | `wss://realtime.intelligence.copilotkit.ai` |
| `COPILOTKIT_USER_ID` | Variable | Optional | Fallback user identifier |
| `COPILOTKIT_USER_NAME` | Variable | Optional | Fallback user display name |

`AGENT_URL` must be an absolute HTTPS URL with no reliance on `localhost`.
`OPENAI_API_KEY` belongs to the separate LangGraph service, not to this Worker.

When using **Workers Builds** (Git integration), configure
`COPILOTKIT_LICENSE_TOKEN` as a **build secret** as well as a runtime secret if
Threads are enabled. The application derives the public Threads UI flag during
the Next.js build. Configure it in the Cloudflare build settings; do not commit
it to `.env`.

For CopilotKit Threads, add the final Worker custom domain (or
`https://<worker>.<account>.workers.dev`) to the CopilotKit Intelligence
project's allowed origins.

## Deploy

After local preview succeeds, deploy the already configured Worker:

```sh
bun run cf:deploy
```

The script passes `--keep-vars`, preserving variables and secrets created in
the Cloudflare dashboard. For Git-based deployments, set the build command to
`bun run cf:build`; Cloudflare Workers Builds deploys the generated Worker.

## Notes

- `wrangler.jsonc` enables `nodejs_compat`, required by Next.js and the
  CopilotKit runtime.
- `.open-next/`, `.dev.vars`, and `.env` are local-only and ignored by Git.
- The included `public/_headers` gives immutable caching to versioned Next.js
  static assets.