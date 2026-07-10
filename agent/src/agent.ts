import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { copilotkitMiddleware } from "@copilotkit/sdk-js/langgraph";

const model = new ChatOpenAI({
  model: "gpt-5.4",
});

export const graph = createAgent({
  model,
  tools: [],
  middleware: [copilotkitMiddleware],
  systemPrompt: `
    You are a helpful chatbot assistant.
    Keep responses concise, clear, and professional.
  `,
});
