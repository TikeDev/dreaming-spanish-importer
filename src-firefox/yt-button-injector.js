console.log("[Dreaming Spanish Helper] Injecting button...");

// Function to create and inject the button
function createButton() {
  // Prevent injecting multiple buttons
  if (document.getElementById("dreaming-spanish-button")) return;

  // Create the button element
  const button = document.createElement("button");
  button.id = "dreaming-spanish-button"; // Assign a unique ID

  // Create the img element
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("add_icon.jpeg"); // Reference the image
  img.alt = "Add to Dreaming Spanish"; // Alt text for accessibility

  // Style the img to be rounded and fit within the button
  img.style.width = "24px"; // Adjust size as needed
  img.style.height = "24px";
  img.style.borderRadius = "50%"; // Makes the image rounded
  img.style.display = "block";
  img.style.marginTop = "-36px";
  img.style.marginRight = "8px";

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
  const controls = document.querySelector(".ytp-right-controls");
  if (controls) {
    controls.insertBefore(button, controls.firstChild); // Insert at the beginning
  } else {
  }

  // Button click event handler
  button.addEventListener("click", async () => {
    // Get the video duration from YouTube player
    const video = document.querySelector("video");
    if (!video) {
      return;
    }
    const duration = Math.floor(video.duration / 60); // Convert to minutes

    // Get the current tab's URL
    const tabUrl = window.location.href;

    // Retrieve the video title
    const titleElement = document.querySelector("#above-the-fold #title");
    let title = "Untitled Video"; // Default title if not found
    if (titleElement) {
      // Original title with \n and extra spaces
      let rawTitle = titleElement.textContent.trim();

      // Clean the title by replacing multiple whitespace characters with a single space
      let cleanTitle = rawTitle.replace(/\s+/g, " ");

      title = cleanTitle;
      console.log(title);
    } else {
    }

    // Send message to the background script with the video duration, title, and tab URL
    chrome.runtime.sendMessage(
      {
        action: "openDreamingSpanish",
        videoDuration: duration,
        tabUrl: tabUrl,
        title: title,
      },
      (response) => {}
    );
  });
}

// Function to observe DOM changes and inject the button when .ytp-right-controls is available
function observeDOM() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const callback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        const controls = document.querySelector(".ytp-right-controls");
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
