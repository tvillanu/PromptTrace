document.addEventListener("DOMContentLoaded", () => {
  const logContainer = document.getElementById("logContainer");
  const exportBtn = document.getElementById("exportBtn");
  const clearBtn = document.getElementById("clearBtn");

  function loadLogs() {
    chrome.storage.local.get({ promptLogs: [] }, (result) => {
      const logs = result.promptLogs;
      if (logs.length === 0) {
        logContainer.innerHTML = '<div class="empty">No prompts logged yet.</div>';
        return;
      }

      logContainer.innerHTML = "";
      logs.forEach((log) => {
        const card = document.createElement("div");
        card.className = "log-card";

        const date = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const host = log.platform.replace("www.", "");

        card.innerHTML = `
          <div class="meta">
            <span><strong>${host}</strong></span>
            <span>${date}</span>
          </div>
          <div class="prompt-text">${escapeHtml(log.prompt)}</div>
        `;
        logContainer.appendChild(card);
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  exportBtn.addEventListener("click", () => {
    chrome.storage.local.get({ promptLogs: [] }, (result) => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.promptLogs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `prompt_trace_audit_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  });

  clearBtn.addEventListener("click", () => {
    if (confirm("Clear all captured prompt logs?")) {
      chrome.storage.local.set({ promptLogs: [] }, () => {
        loadLogs();
      });
    }
  });

  loadLogs();
});
