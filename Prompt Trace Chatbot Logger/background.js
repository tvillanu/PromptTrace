function escapeCsv(value) {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

const responseBuffers = {};

function flushBuffer(llm) {
  if (responseBuffers[llm]) {
    clearTimeout(responseBuffers[llm].timer);
    appendLogEntry(
      responseBuffers[llm].timestamp,
      llm,
      "ASSISTANT_RESPONSE",
      responseBuffers[llm].text
    );
    delete responseBuffers[llm];
  }
}

function appendLogEntry(timestamp, llm, recordType, text) {
  chrome.storage.local.get({ promptTraceLog: "" }, (result) => {
    let existing = typeof result.promptTraceLog === "string" ? result.promptTraceLog : "";

    if (!existing) {
      existing = "Timestamp,Model_Name,Record_Type,Content";
    }

    const row = `${escapeCsv(timestamp)},${escapeCsv(llm)},${escapeCsv(recordType)},${escapeCsv(text)}`;
    const nextLog = `${existing}\n${row}`;

    chrome.storage.local.set({ promptTraceLog: nextLog });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("[PromptTrace] Extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    sendResponse({ ok: false, error: "Missing message type" });
    return false;
  }

  const text = typeof message.text === "string" ? message.text.trim() : "";
  const llm = message.llm || "Unknown LLM";

  if (!text) {
    sendResponse({ ok: false, error: "Empty payload" });
    return false;
  }

  const currentTimestamp = new Date().toISOString();

  if (message.type === "PROMPT_CAPTURE") {
    // Flush any pending response from previous turn
    flushBuffer(llm);
    appendLogEntry(currentTimestamp, llm, "USER_PROMPT", text);
  } else if (message.type === "RESPONSE_CAPTURE") {
    if (responseBuffers[llm]) {
      clearTimeout(responseBuffers[llm].timer);
    }

    responseBuffers[llm] = {
      timestamp: responseBuffers[llm]?.timestamp || currentTimestamp,
      text: text,
      timer: setTimeout(() => {
        flushBuffer(llm);
      }, 800) // Lowered from 1500ms to 800ms
    };
  }

  sendResponse({ ok: true });
  return false;
});