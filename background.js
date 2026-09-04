chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "LOG_PROMPT") {
    const newLog = message.data;

    chrome.storage.local.get({ promptLogs: [] }, (result) => {
      const logs = result.promptLogs;
      
      // Avoid duplicate consecutive entries within 3 seconds
      const lastLog = logs[0];
      if (lastLog && lastLog.prompt === newLog.prompt && (new Date(newLog.timestamp) - new Date(lastLog.timestamp) < 3000)) {
        return;
      }

      logs.unshift(newLog); // Prepend so newest appears first
      
      // Keep only the latest 500 prompts
      const cappedLogs = logs.slice(0, 500);

      chrome.storage.local.set({ promptLogs: cappedLogs }, () => {
        sendResponse({ status: "success" });
      });
    });

    return true; // Keep message channel open for async response
  }
});