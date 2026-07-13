"use client";

import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotThreadsDrawer,
  useAgent,
  UseAgentUpdate,
} from "@copilotkit/react-core/v2";

import styles from "./page.module.css";

type WritingAgentState = {
  document?: string;
};

function LiveDocumentPanel() {
  const { agent } = useAgent({
    agentId: "default",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });

  const state = agent.state as WritingAgentState | undefined;
  const document = state?.document ?? "";

  return (
    <section className={styles.documentPanel} aria-label="Live document">
      <header className={styles.documentHeader}>
        <div>
          <p className={styles.eyebrow}>Shared agent state</p>
          <h1>Live document</h1>
        </div>
        <div className={styles.statusGroup}>
          {document ? (
            <span className={styles.characterCount}>{document.length} chars</span>
          ) : null}
          {agent.isRunning ? (
            <span className={styles.liveStatus}>
              <span className={styles.liveDot} aria-hidden="true" />
              Streaming
            </span>
          ) : null}
        </div>
      </header>

      <div className={styles.documentPaper} aria-live="polite">
        {document ? (
          <div className={styles.documentContent}>
            {document}
            {agent.isRunning ? <span className={styles.cursor}>▋</span> : null}
          </div>
        ) : (
          <div className={styles.emptyDocument}>
            <span className={styles.emptyDocumentMark}>✦</span>
            <p>Ask the assistant to draft something.</p>
            <span>
              Its <code>write_document</code> tool call will appear here as it
              streams.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <CopilotChatConfigurationProvider agentId="default">
      <div className={styles.layout}>
        <CopilotThreadsDrawer agentId="default" />
        <div className={styles.mainPanel}>
          <div className={styles.workspace}>
            <LiveDocumentPanel />
            <section className={styles.chatPanel} aria-label="Assistant chat">
              <CopilotChat
                attachments={{ enabled: true }}
                input={{ disclaimer: () => null, className: "pb-6" }}
              />
            </section>
          </div>
        </div>
      </div>
    </CopilotChatConfigurationProvider>
  );
}
