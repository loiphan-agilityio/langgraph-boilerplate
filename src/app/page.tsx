"use client";

import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotThreadsDrawer,
} from "@copilotkit/react-core/v2";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <CopilotChatConfigurationProvider agentId="default">
      <div className={styles.layout}>
        <CopilotThreadsDrawer agentId="default" />
        <div className={styles.mainPanel}>
          <CopilotChat
            attachments={{ enabled: true }}
            input={{ disclaimer: () => null, className: "pb-6" }}
          />
        </div>
      </div>
    </CopilotChatConfigurationProvider>
  );
}
