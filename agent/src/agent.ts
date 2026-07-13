import { randomUUID } from "node:crypto";

import { z } from "zod";
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { Command, StateSchema } from "@langchain/langgraph";
import {
  CopilotKitStateSchema,
  copilotkitMiddleware,
  zodState,
} from "@copilotkit/sdk-js/langgraph";
import {
  stateItem,
  stateStreamingMiddleware,
} from "@copilotkit/sdk-js/langgraph-middlewares";

const AgentStateSchema = new StateSchema({
  // `stateStreamingMiddleware` progressively mirrors this field to the UI.
  document: zodState(z.string().default("")),
  ...(CopilotKitStateSchema.fields as Record<string, any>),
});

const writeDocument = tool(
  async ({ document }, runtime) => {
    return new Command({
      // The final update is still needed: intermediate streaming state is
      // temporary and may otherwise be replaced when the graph node finishes.
      update: {
        document,
        messages: [
          new ToolMessage({
            content: "Document saved to shared state.",
            name: "write_document",
            id: randomUUID(),
            tool_call_id: runtime.toolCall?.id ?? randomUUID(),
          }),
        ],
      },
    });
  },
  {
    name: "write_document",
    description:
      "Write a complete document for the user. Always call this tool for " +
      "writing, drafting, or revising requests. Put the entire result in the " +
      "`document` argument; it streams live to the document panel.",
    schema: z.object({
      document: z.string().describe("The complete document content."),
    }),
  },
);

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
});

export const graph = createAgent({
  model,
  tools: [writeDocument],
  stateSchema: AgentStateSchema,
  middleware: [
    copilotkitMiddleware,
    // Map partial `write_document.document` tool arguments to state.document.
    stateStreamingMiddleware(
      stateItem({
        stateKey: "document",
        tool: "write_document",
        toolArgument: "document",
      }),
    ),
  ],
  systemPrompt: `
    You are a collaborative writing assistant.
    When the user asks you to write, draft, or revise text, always call the
    write_document tool with the full result in its document argument. Do not
    paste the document into a chat response; the application renders it from
    shared state. For other requests, keep responses concise and professional.
  `,
});
