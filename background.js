chrome.runtime.onInstalled.addListener(() => {
  console.log("PromptTrace installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  const text = typeof message.text === "string" ? message.text.trim() : "";

  if (!text) {
    return;
  }

  if (message.type === "PROMPT_CAPTURE") {
    console.log("[PromptTrace] User prompt:", text);
  }

  if (message.type === "RESPONSE_CAPTURE") {
    console.log("[PromptTrace] Assistant response:", text);
  }

  sendResponse({ ok: true });
});