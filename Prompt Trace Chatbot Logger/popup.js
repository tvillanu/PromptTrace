const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    console.log("[PromptTrace] Export button clicked");

    chrome.storage.local.get({ promptTraceLog: "" }, (result) => {
      const logData = typeof result.promptTraceLog === "string" && result.promptTraceLog
        ? result.promptTraceLog
        : "Timestamp,Model_Name,Record_Type,Content";

      console.log("[PromptTrace] Export data loaded", {
        length: logData.length,
        preview: logData.slice(0, 120)
      });

      // Prepend \ufeff (UTF-8 BOM) so Excel automatically recognizes UTF-8 encoding
      const blob = new Blob(["\ufeff" + logData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const filename = `PromptTraceLogs_${new Date().toISOString().slice(0, 10)}.csv`;

      console.log("[PromptTrace] Exporting CSV", { filename, blobSize: blob.size });

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log("[PromptTrace] CSV download trigger complete");
    });
  });
} else {
  console.warn("[PromptTrace] exportBtn was not found in the popup DOM");
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    const shouldClear = window.confirm("Clear all stored PromptTrace entries?");

    if (!shouldClear) {
      return;
    }

    chrome.storage.local.remove("promptTraceLog", () => {
      if (chrome.runtime.lastError) {
        console.warn("[PromptTrace] Failed to clear stored data", chrome.runtime.lastError.message);
        return;
      }

      console.log("[PromptTrace] Stored PromptTrace entries cleared");
    });
  });
} else {
  console.warn("[PromptTrace] clearBtn was not found in the popup DOM");
}