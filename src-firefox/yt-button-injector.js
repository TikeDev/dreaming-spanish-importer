console.log("[Dreaming Spanish Helper] Injecting button...");

// Function to create and inject the button
function createButton() {
  // Prevent injecting multiple buttons
  if (document.getElementById("dreaming-spanish-button")) return;

  // Set mode by url
  let mode = "youtube";
  if (window.location.href.includes("spotify")) {
    mode = "spotify";
  }

  // Create the button element
  const button = document.createElement("button");
  button.id = "dreaming-spanish-button"; // Assign a unique ID

  // Create the img element
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("dreamingplus.png"); // Reference the image
  img.alt = "Add to Dreaming Spanish"; // Alt text for accessibility

  // Style the img to be rounded and fit within the button
  img.style.borderRadius = "50%"; // Makes the image rounded
  img.style.display = "block";
  img.style.marginRight = "8px";
  // Different styling depending on platform
  if (mode === "youtube") {
    // This is different depending on yt-right-controls being display:flex.
    // Solved by modifying it to always be flex.
    // img.style.marginTop = "-36px";
    img.style.width = "24px";
    img.style.height = "24px";
  }
  else if (mode === "spotify") {
    img.style.width = "20px";
    img.style.height = "20px";
  }
  // Append the img to the button
  button.appendChild(img);

  // Style the button to blend with YouTube's controls
  button.style.background = "transparent"; // Transparent background
  button.style.border = "none"; // No border
  button.style.cursor = "pointer"; // Pointer cursor on hover
  button.style.padding = "0"; // Remove default padding
  button.style.marginLeft = "8px"; // Space between buttons
  button.style.outline = "none"; // Remove focus outline

  // Optional: Add hover effect (e.g., slight opacity change)
  button.onmouseover = () => {
    button.style.opacity = "0.8";
  };
  button.onmouseout = () => {
    button.style.opacity = "1";
  };

  // Append the button to the .ytp-right-controls div
  let controls = document.querySelector(".ytp-right-controls, [data-testid*=control-button-npv]");
  if (controls) {
    if (mode === "youtube") {
      controls.style.display = "flex";
      controls.insertBefore(button, controls.firstChild); // Insert at the beginning
    }
    else {
      controls.parentElement.insertBefore(button, controls.parentElement.firstChild); // Insert at the beginning
    }
  } else {
  }

  // Button click event handler
  button.addEventListener("click", async () => {

    let duration;
    if (mode === "youtube") {
      // Get the video duration from YouTube player
      const video = document.querySelector("video");
      if (!video) {
        return;
      }
      duration = Math.floor(video.duration / 60); // Convert to minutes
    }
    else if (mode === "spotify") {
      // Get the duration from Spotify player
      const timer = document.querySelector('[data-testid="playback-duration"]');
      if (!timer) {
        return;
      }
      const times = timer.textContent.split(":");
      if (times.length === 2) {
        duration = parseInt(times[0], 10);
      }
      else if (times.length === 3) {
        duration = parseInt(times[0], 10) * 60 + parseInt(times[1], 10);
      }
    }

    // Get the current tab's URL
    const tabUrl = window.location.href;

    let title = "Untitled";
    // Retrieve the video title
    if (mode === "youtube") {
      const titleElement = document.querySelector("#above-the-fold #title");
      title = "Untitled Video"; // Default title if not found
      if (titleElement) {
        // Original title with \n and extra spaces
        let rawTitle = titleElement.textContent.trim();

        // Clean the title by replacing multiple whitespace characters with a single space
        let cleanTitle = rawTitle.replace(/\s+/g, " ");

        title = cleanTitle;
        console.log(title);
      } else {
      }
    }
    else if (mode === "spotify") {
      const titleElement = document.querySelector('[data-testid="context-item-link"]');
      title = "Untitled Track"; // Default title if not found
      if (titleElement) {
        title = titleElement.textContent;
      }
    }

    // Get the content creator's name
    let author = "Unknown Author";
    if (mode === "youtube") {
      const authorElement = document.querySelector("[class*=ytd-channel-name]");
      console.log(authorElement);
      if (authorElement) {
        author = authorElement.innerText;
      }
    }
    else if (mode === "spotify") {
      const authorElement = document.querySelector('[data-testid="context-item-info-show"]');
      if (authorElement) {
        author = authorElement.textContent;
      }
    }

    // Send message to the background script with the video duration, title, and tab URL
    chrome.runtime.sendMessage(
      {
        action: "openDreamingSpanish",
        videoDuration: duration,
        tabUrl: tabUrl,
        title: title,
        author: author,
      },
      (response) => {}
    );
  });
}

// Function to observe DOM changes and inject the button when .ytp-right-controls is available
function observeDOM() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  let lastExecutionTime = 0;
  const timeout = 3000;

  const callback = function (mutationsList, observer) {

    // Delay to avoid overdoing page traversal
    const currentTime = Date.now();
    if ((currentTime - lastExecutionTime) < timeout) {
      return;
    }
    lastExecutionTime = currentTime;

    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        const controls = document.querySelector(".ytp-right-controls, [data-testid*=control-button-npv]");
        if (controls && !document.getElementById("dreaming-spanish-button")) {
          createButton();
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

createButton();
observeDOM();

// Handle YouTube's Single Page Application (SPA) navigation
// Listen for history changes to re-inject the button on new video loads
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    createButton();
  }
}, 1000);
