document.getElementById("open-import-manager").addEventListener("click", async (event) => {
  // Send message to the background script to open import manager in new tab
  chrome.runtime.sendMessage(
    {
      action: "openImportManager"      
    },
    (response) => {}
  );
})