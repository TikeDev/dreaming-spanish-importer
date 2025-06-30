console.log("[Dreaming Languages Importer] Injecting button...");

window.onload = function () {
  function addHoverEffect(button){
    // Optional: Add hover effect (e.g., slight opacity change)
    button.onmouseover = () => {
      button.style.opacity = "0.8";
    };
    button.onmouseout = () => {
      button.style.opacity = "1";
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

  // Function to create and inject the button
  function createButton() {
    // Prevent injecting multiple buttons
    if (document.getElementById("dreaming-spanish-button")) return;

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
    img.style.width = "30px";
    img.style.height = "30px";
    button.style.marginLeft = "25px"; // Space between buttons

    // Style the button to blend with Pocket Cast's controls
    button.style.background = "transparent"; // Transparent background
    button.style.border = "none"; // No border
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.padding = "0"; // Remove default padding
    button.style.marginLeft = "8px"; // Space between buttons
    button.style.outline = "none"; // Remove focus outline


    // Append the img to the button
    button.appendChild(img);

    // Add hover effect
    addHoverEffect(button);

    // Append the button to the left controls strip
    let controls = document.querySelector("div.controls-left"); 

    if (controls) {
        controls.append(button); // Insert at the end
        button.style.zIndex = "2"; // Keep button clickable between page resizes
      } else {
    }

    // Playback controls button click event handler
    button.addEventListener("click", async (event) => {      
      button.blur(); // Remove focus to prevent spacebar re-trigger

      //DURATION - Get listened to so far duration from Pocket Casts player
      const timer = document.querySelector('[data-testid="current-time"]');
      if (!timer) {
        return;
      }
      const duration = Math.floor(timeStrToSeconds(timer.textContent) / 60); // get in minutes
      console.log("TIMER= " + duration);
        

      // TITLE - Retrieve the episode title
      let title = "Untitled Track"; // Default title if not found
      
      const titleElement = document.querySelector("a[class*='episode-title player_episode");
      if (titleElement) {
        title = titleElement.textContent;
      }
      console.log("TITLE: " + title);
      
      
      // URL - Get the current track's URL
      let tabUrl = titleElement.href; // grab episode link
      console.log("TRACK URL= " + tabUrl);


      // AUTHOR - Get podcast name
      let author = "Unknown Podcast";

      const authorElement = document.querySelector('.podcast-title.player_podcast_title');
      if (authorElement) {
        author = authorElement.textContent;
      }
      console.log("AUTHOR: " + author);


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
     });
  }

  // watch for appearance of playback ctrl strip in DOM
  // Function to observe DOM changes and inject the button when playback ctrl strip is available
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

      // for each mutation observed, if there are ctrls but no DS button, create one 
      for (let mutation of mutationsList) { 
        if (mutation.type === "childList") {
          // check if there are controls
          const controls = document.querySelector("div.controls-left");
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
  

  // Handle Single Page Application (SPA) navigation
  // Listen for history changes to re-inject the button on new video loads
  // every second check if url has changed. If so, create new buttons 
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      createButton();
    }
  }, 1000);
};
