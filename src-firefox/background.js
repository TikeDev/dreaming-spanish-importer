// background.js

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openDreamingSpanish") {
    const duration = request.videoDuration;
    const tabUrl = request.tabUrl;
    const title = request.title;

    // Open the dreamingspanish.com/progress page
    browser.tabs.create(
      { 
        url: "https://dreamingspanish.com/progress",
        active: false // Don't focus tab when it's created
       },
      (tab) => {
        // When the new tab is fully loaded, send the video duration to the content script
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === "complete") {
            chrome.tabs.sendMessage(tabId, {
              action: "autofillForm",
              videoDuration: duration,
              tabUrl: tabUrl,
              title: title,
            });
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      }
    );
  }
});
