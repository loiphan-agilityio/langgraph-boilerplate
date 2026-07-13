import {
  CopilotRuntime,
  CopilotKitIntelligence,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { handle } from "hono/vercel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAgentDeploymentUrl(): string {
  const configuredUrl =
    process.env.AGENT_URL ?? process.env.LANGGRAPH_DEPLOYMENT_URL;

  if (!configuredUrl) {
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:8123";
    }

    throw new Error(
      "Missing AGENT_URL. Set AGENT_URL in the Vercel project environment variables to the public HTTPS URL of the deployed LangGraph service.",
    );
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error(
      "AGENT_URL must be an absolute HTTP(S) URL, for example https://your-agent.koyeb.app.",
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("AGENT_URL must use the http or https protocol.");
  }

  return configuredUrl.replace(/\/+$/, "");
}

const defaultAgent = new LangGraphAgent({
  deploymentUrl: getAgentDeploymentUrl(),
  graphId: "sample_agent",
  langsmithApiKey: process.env.LANGSMITH_API_KEY,
});

const copilotRuntime = new CopilotRuntime({
  agents: { default: defaultAgent },
  ...(process.env.COPILOTKIT_LICENSE_TOKEN
    ? {
        intelligence: new CopilotKitIntelligence({
          apiKey: process.env.INTELLIGENCE_API_KEY ?? "",
          apiUrl: process.env.INTELLIGENCE_API_URL ?? "http://localhost:4201",
          wsUrl:
            process.env.INTELLIGENCE_GATEWAY_WS_URL ?? "ws://localhost:4401",
        }),
        identifyUser: (request) => ({
          id:
            request.headers.get("x-user-id") ??
            process.env.COPILOTKIT_USER_ID ??
            "local-user",
          name:
            request.headers.get("x-user-name") ??
            process.env.COPILOTKIT_USER_NAME ??
            "Local User",
        }),
        licenseToken: process.env.COPILOTKIT_LICENSE_TOKEN,
      }
    : { runner: new InMemoryAgentRunner() }),
});

const app = createCopilotEndpoint({
  runtime: copilotRuntime,
  basePath: "/api/copilotkit",
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
