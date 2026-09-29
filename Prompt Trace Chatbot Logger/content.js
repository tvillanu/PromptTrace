// content.js

// --- 1. SAFE MESSAGING HELPER ---

function getLlmName() {
  const host = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  if (host.includes("chatgpt")) return "ChatGPT";
  if (host.includes("claude")) return "Claude";
  if (host.includes("gemini") || host.includes("google")) return "Gemini";
  if (host.includes("microsoft") || host.includes("bing") || host.includes("copilot") || pathname.includes("chat")) return "Microsoft Copilot";

  return "Unknown LLM";
}

function safeSendMessage(payload) {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    try {
      chrome.runtime.sendMessage({
        ...payload,
        llm: payload.llm || getLlmName()
      }, () => {
        if (chrome.runtime.lastError) {
          // Swallow runtime port errors on reload
        }
      });
    } catch (err) {
      console.warn("[PromptTrace] Extension context invalidated. Refresh this page.");
    }
  }
}

// --- 2. CAPTURE ASSISTANT RESPONSES ---

let lastAssistantText = "";
let lastPromptText = "";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isPromptInput(node) {
  if (!node) return false;
  return node.matches?.('textarea, input, [contenteditable="true"], [role="textbox"], [data-testid*="input"], [data-testid*="composer"]') ||
    !!node.closest?.('textarea, input, [contenteditable="true"], [role="textbox"], [data-testid*="input"], [data-testid*="composer"]');
}

function extractAssistantText(node) {
  if (!node) return null;

  const text = normalizeText(node.innerText || node.textContent || "");
  if (!text || text.length < 30) return null;
  if (isPromptInput(node)) return null;
  if (text.includes("Interactive contentDetails could not be loaded")) return null;

  return text;
}

function findLatestAssistantText() {
  if (!document.body) return null;

  const selectors = [
    '[data-message-author-role="assistant"]',
    'article',
    '.markdown',
    '.answer',
    '.response',
    '.chat-answer',
    '.message-content',
    '.conversation-turn',
    '[data-testid*="answer"]',
    '[data-testid*="response"]',
    'model-response',
    '.response-container',
    '.agent-turn'
  ];

  let bestText = "";

  for (const selector of selectors) {
    for (const node of document.querySelectorAll(selector)) {
      const text = extractAssistantText(node);
      if (text && text.length > bestText.length) {
        bestText = text;
      }
    }
  }

  return bestText || null;
}

function captureLatestAssistant() {
  const text = findLatestAssistantText();
  if (!text || text === lastAssistantText) return;

  lastAssistantText = text;
  safeSendMessage({
    type: "RESPONSE_CAPTURE",
    text,
    llm: getLlmName()
  });
}

// --- 3. CAPTURE USER PROMPTS ---

function capturePromptValue(value) {
  const text = normalizeText(value);
  if (!text || text.length < 2 || text === lastPromptText) return;

  lastPromptText = text;
  safeSendMessage({
    type: "PROMPT_CAPTURE",
    text,
    llm: getLlmName()
  });
}

function setupPromptCapture() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      const activeEl = document.activeElement;
      if (
        activeEl && (
          activeEl.id === "prompt-textarea" ||
          activeEl.getAttribute("contenteditable") === "true" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "INPUT" ||
          activeEl.getAttribute("role") === "textbox"
        )
      ) {
        const text = activeEl.innerText || activeEl.value || "";
        capturePromptValue(text);
      }
    }
  }, true);

  document.addEventListener("click", (event) => {
    const sendButton = event.target.closest('button, [role="button"], input[type="submit"]');
    if (!sendButton) return;

    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT" || activeEl.getAttribute("contenteditable") === "true")) {
      const text = activeEl.innerText || activeEl.value || "";
      capturePromptValue(text);
    }
  }, true);
}

// --- 4. DOM OBSERVER INITIALIZATION ---

const chatObserver = new MutationObserver(() => {
  captureLatestAssistant();
});

setupPromptCapture();
chatObserver.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

captureLatestAssistant();