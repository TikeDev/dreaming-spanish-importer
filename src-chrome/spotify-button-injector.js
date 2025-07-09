console.log("[Dreaming Languages Importer] Injecting button...");

window.onload = function () {
  let controlsSelector = "[data-testid*=control-button-npv]";  // element to ultimately inject button into
  let buttonID = "dreaming-spanish-np-button";                 // DS button ID
  let buttonSelector = `#${buttonID}`;                         // DS button selector
  
  
  function addHoverEffect(button){
    // Optional: Add hover effect (e.g., slight opacity change)
    button.onmouseover = () => {
      button.style.opacity = "1";
      button.style.transform = "scale(1.04)";
    };
    button.onmouseout = () => {
      button.style.opacity = "0.8";
      button.style.transform = "scale(1.0)";
    };
  }

  // convert hh:mm:ss, mm:ss, or :ss string to seconds
  function timeStrToSeconds(timeStr) {
    const parts = timeStr.trim().split(':').map(Number);
    return parts.length === 3
      ? parts[0]*3600 + parts[1]*60 + parts[2]
      : parts.length === 2
      ? parts[0]*60 + parts[1]
      : parts[0];
  }

  // check if right URL and ready to inject button to relevant container element
  function shouldInject(containerSel, buttonId) {
    const container = document.querySelector(containerSel);
    const buttonExists = document.getElementById(buttonId);

    return (container && !buttonExists);
  }

  function grabEntryDataAndSend(button){
    button.blur(); // Remove focus to prevent spacebar re-trigger

    //DURATION - Get listened to so far duration from Spotify player
    const timer = document.querySelector('[data-testid="playback-duration"]');
    if (!timer) {
      return;
    }
    const duration = Math.floor(timeStrToSeconds(timer.textContent) / 60); // get in minutes
    console.log("[SPOTIFY] TRACK DURATION: " + duration + " min");


    // TITLE - Retrieve the track title
    let title = "Untitled Track";
    const titleElement = document.querySelector('[data-testid="context-item-link"]');
    if (titleElement) {
      title = titleElement.textContent;
    }
    console.log("[SPOTIFY] TRACK TITLE: " + title);


    // URL - Get the current track's URL
    let tabUrl = titleElement.href; // grab episode link
    console.log("[SPOTIFY] TRACK URL: " + tabUrl);

    // AUTHOR - Get the content creator's name
    let author = "Unknown Author";
    const authorElement = document.querySelector('[data-testid="context-item-info-show"], [data-testid="context-item-info-artist"], [data-testid="context-item-info-book"]');
    if (authorElement) {
      author = authorElement.textContent;
    }
    console.log("[SPOTIFY] TRACK AUTHOR: " + author);

      
    // Send message to the background script with the video duration, title, and tab URL
      chrome.runtime.sendMessage(
      {
        action: "openDreamingSpanish",
        videoDuration: (duration || 1), // can't submit 0 min, default 1 min
        tabUrl: tabUrl,
        title: title,
        author: author,
      },
      (response) => {}
    );
  }

  // Function to create and inject the Now Playing button
  function createButton() {
    // Prevent injecting multiple buttons
    if (document.getElementById(buttonID)) return; // Now Playing button

    let controls = document.querySelector(controlsSelector); 
    if (!controls){
      return; 
    }

    // Create the button element
    const button = document.createElement("button");
    button.id = buttonID; // Assign a unique ID

    // Create the img element
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("dreamingplus.png"); // Reference the image
    img.alt = "Add to Dreaming Spanish"; // Alt text for accessibility

    // Style the img to be rounded and fit within the button
    img.style.borderRadius = "50%"; // Makes the image rounded
    img.style.display = "block";
    img.style.marginRight = "8px";
    img.style.width = "20px";
    img.style.height = "20px";

    // Style the button to blend with YouTube's controls
    button.style.background = "transparent"; // Transparent background
    button.style.border = "none"; // No border
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.padding = "0"; // Remove default padding
    button.style.marginLeft = "8px"; // Space between buttons
    button.style.outline = "none"; // Remove focus outline
    button.style.opacity = ".8";
    button.style.transition = "transform 100ms";

    // Append the img to the button
    button.appendChild(img);
    addHoverEffect(button);

    controls.parentElement.insertBefore(button, controls.parentElement.firstChild); // Insert at the beginning

    // Playback controls button click event handler
    button.addEventListener("click", async (event) => {
      grabEntryDataAndSend(button);
     });
  }

  // Function to observe and wait until DOM mutation activity
  // dies down, then check for left controls and inject button
  function observeDOM() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    let lastExecutionTime = 0;
    const timeout = 800;

    const callback = function (mutationsList, observer) {
      // Delay to avoid overdoing page traversal
      const currentTime = Date.now();
      if ((currentTime - lastExecutionTime) < timeout) {
        return;
      }
      lastExecutionTime = currentTime;

      // for each mutation observed, if there are ctrls but no DS button, create one 
      for (let mutation of mutationsList) { 
        if (mutation.type === "childList") {
          // check if there are controls
          const controls = document.querySelector(controlsSelector);
          if (shouldInject(controlsSelector, buttonID)) {
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

  // Handle Spotify's Single Page Application (SPA) navigation
  // Listen for history changes to re-inject the button
  // every second check if url has changed. If so, create new buttons 
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;     
      createButton();
    }
  }, 1000); 
};
