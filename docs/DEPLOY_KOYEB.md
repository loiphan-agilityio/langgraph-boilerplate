# Deploy the LangGraph API on Koyeb

This repository can deploy its standalone LangGraph server as a Koyeb Web Service. The service uses `agent/Dockerfile`; it does **not** start the Next.js UI.

## Before deploying

1. Commit and push this repository to a Git provider connected to Koyeb.
2. Create an OpenAI API key.
3. Do not commit `.env` files. Koyeb injects secrets at runtime.

## Create the service

In the Koyeb control panel, create a **Web Service** from the repository and configure it as follows:

| Setting | Value |
| --- | --- |
| Builder | Dockerfile |
| Service root directory | Leave empty (repository root) |
| Dockerfile | `agent/Dockerfile` |
| Exposed port | `8000` |
| Protocol | HTTP |
| Public route | `/` |
| Health-check path | `/ok` |

Koyeb automatically sets `PORT` to the lowest exposed port. The container's `start` script reads that variable, binds to `0.0.0.0`, and starts the LangGraph API without file watching.

## Environment variables

Add these variables in **Environment variables and files**:

| Name | Type | Required | Value |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Secret | Yes | Your OpenAI API key |
| `OPENAI_MODEL` | Plaintext | No | Model name, such as `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Secret or plaintext | No | OpenAI-compatible API base URL |

`OPENAI_MODEL` defaults to `gpt-4o-mini` when it is not set. Use `OPENAI_BASE_URL` only when routing requests through an OpenAI-compatible provider.

Deploy the service, then copy its generated `https://…koyeb.app` URL. Confirm it is healthy by opening `https://<your-service>.koyeb.app/ok`.

## Connect the Next.js application

Deploy the frontend as a separate Web Service. Configure its `AGENT_URL` (or `LANGGRAPH_DEPLOYMENT_URL`) environment variable with the public LangGraph service URL, without a trailing slash. The CopilotKit route in `src/app/api/copilotkit/[[...slug]]/route.ts` will use that server and graph ID `sample_agent`.

### Vercel frontend

Vercel deploys only the Next.js application; it does not start the `agent/` LangGraph server. After deploying the agent service above, add the following Vercel project environment variable for **Production**, **Preview**, and **Development** as appropriate:

| Name | Value |
| --- | --- |
| `AGENT_URL` | The public agent URL, e.g. `https://your-agent.koyeb.app` |

Do not use `http://localhost:8123` on Vercel: within a Vercel Serverless Function, `localhost` points to that function rather than to the separately deployed LangGraph agent. Redeploy the Vercel project after saving the variable. The application now fails fast with a clear configuration error if `AGENT_URL` is missing in production.

### CopilotKit Intelligence realtime (Threads)

When Threads are enabled, the browser connects **directly** to the CopilotKit
Intelligence realtime gateway. Vercel does not proxy this WebSocket. Therefore,
adding the Vercel domain to the Intelligence project's allowed origins is
required in addition to setting the runtime secrets.

1. Sign in to the [CopilotKit Intelligence dashboard](https://dashboard.operations.copilotkit.ai/), then open the project matching the API key deployed to Vercel.
2. In the project's security/origin settings, add the exact frontend origin:
   `https://langgraph-boilerplate.vercel.app`.
3. Add each additional Vercel preview or custom-domain origin that should be
   allowed. Origins must include `https://`, omit paths, and must not have a
   trailing slash.
4. Configure these Vercel variables for the same environment scope, then
   redeploy:

| Name | Value |
| --- | --- |
| `COPILOTKIT_LICENSE_TOKEN` | License token issued for the Intelligence project |
| `INTELLIGENCE_API_KEY` | Project API key from the Intelligence dashboard |
| `INTELLIGENCE_API_URL` | `https://api.intelligence.copilotkit.ai` |
| `INTELLIGENCE_GATEWAY_WS_URL` | `wss://realtime.intelligence.copilotkit.ai` |

If the API routes `/api/copilotkit/threads` and
`/api/copilotkit/threads/subscribe` return `200` but the browser reports a
WebSocket handshake `403`, the runtime credentials are valid; the frontend
origin is not authorized by the realtime gateway. Updating application code or
using a Vercel rewrite cannot resolve that server-side authorization failure.

## Operational notes

- The image runs the LangGraph development API in no-reload mode. It is appropriate for this stateless starter. For durable threads, add a production checkpointer and configure its external database before enabling multi-instance scaling.
- Koyeb exposes only port `8000`; do not hard-code a port in service settings that conflicts with `PORT`.
- The Koyeb service URL is public in the configuration above. Add application-level authentication before exposing privileged tools or private data.
