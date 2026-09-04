// Captures user inputs from text areas and contenteditable elements on submission
function getPromptText(target) {
  if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
    return target.value.trim();
  }
  return target.innerText ? target.innerText.trim() : "";
}

function sendPromptToBackground(text) {
  if (!text || text.length < 2) return;

  chrome.runtime.sendMessage({
    action: "LOG_PROMPT",
    data: {
      prompt: text,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      platform: window.location.hostname
    }
  });
}

// Intercept Enter keypresses (without Shift key)
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable)) {
      const text = getPromptText(activeElement);
      sendPromptToBackground(text);
    }
  }
}, true);

// Intercept clicks on send buttons
document.addEventListener("click", (event) => {
  const sendButton = event.target.closest('button[aria-label*="Send"], button[data-testid*="send"], button#send-button');
  if (sendButton) {
    const inputContainer = document.querySelector('textarea, [contenteditable="true"]');
    if (inputContainer) {
      const text = getPromptText(inputContainer);
      sendPromptToBackground(text);
    }
  }
}, true);