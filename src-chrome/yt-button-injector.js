console.log("[Dreaming Spanish Helper] Injecting button...");

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

  function createPlaybackStripBtn(mode){
    // Prevent injecting multiple buttons
    if (document.getElementById("dreaming-spanish-button")) 
      return;

  }

  // Function to create and inject the button
  function createButton() {
    // Prevent injecting multiple buttons
    if (document.getElementById("dreaming-spanish-button")) return;

    // Set mode by url
    let mode = "youtube";
    if (window.location.href.includes("spotify")) {
      mode = "spotify";
    }
    else if (window.location.href.includes("pocketcasts")) {
      console.log("FOUND POCKET CASTS");
      mode = "pocketcasts";
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

    // Style the button to blend with YouTube's controls
    button.style.background = "transparent"; // Transparent background
    button.style.border = "none"; // No border
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.padding = "0"; // Remove default padding
    button.style.marginLeft = "8px"; // Space between buttons
    button.style.outline = "none"; // Remove focus outline


    // Different styling depending on platform
    if (mode === "youtube") {
      // img.style.marginTop = "-36px";
      img.style.width = "24px";
      img.style.height = "24px";
    }
    else if (mode === "spotify") {
      img.style.width = "20px";
      img.style.height = "20px";
    }
    else if (mode === "pocketcasts") {
      img.style.width = "30px";
      img.style.height = "30px";
      button.style.marginLeft = "25px"; // Space between buttons
    }
    else {
      img.style.width = "24px";
      img.style.height = "24px";

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

    addHoverEffect(button);

    // Append the button to the controls strip
    let controls = document.querySelector(".ytp-right-controls, [data-testid*=control-button-npv], div.controls-left", "div.controls__right"); 

    if (controls) {
      if (mode === "youtube") {
        controls.style.display = "flex";
        controls.insertBefore(button, controls.firstChild); // Insert at the beginning
      }
      else if (mode === "spotify") {
        controls.parentElement.insertBefore(button, controls.parentElement.firstChild); // Insert at the beginning
      }
      else if (mode === "pocketcasts") {
        controls.append(button); // Insert at the end
      }
     } else {
    }

    // Playback controls button click event handler
    button.addEventListener("click", async (event) => {

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
      else if (mode === "pocketcasts") {
        event.stopPropagation(); //prevent existing elements' listeners from interfering with click event
        // Get the duration from PocketCasts player
        const timer = document.querySelector('[data-testid="current-time"]');
        console.log("POCKETCASTS TIMER= " + timer.textContent);

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
        console.log("POCKETCASTS DURATION= " + duration);

      }
 
      // Get the current tab's URL
      let tabUrl = window.location.href;

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
        tabUrl = document.querySelector('a[data-testid="context-item-link"]').href; // grab episode link
      }
      else if (mode === "pocketcasts") {
        const titleElement = document.querySelector('.episode-title.player_episode');
        title = "Untitled Track"; // Default title if not found
        if (titleElement) {
          title = titleElement.textContent;
          console.log("POCKETCASTS TITLE= " + title);
        }
        tabUrl = document.querySelector("a[class*='episode-title player_episode']").href; // grab episode link
      }
 
      // Get the content creator's name
      let author = "Unknown Author";
      if (mode === "youtube") {
        const authorElement = document.querySelector("a[class*='yt-simple-endpoint style-scope yt-formatted-string']");
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
       else if (mode === "pocketcasts") { 
        const authorElement = document.querySelector('.podcast-title.player_podcast_title');
        if (authorElement) {
          author = authorElement.textContent;
          console.log("POCKETCASTS AUTHOR= " + author);
        }
      }
 
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
          const controls = document.querySelector(".ytp-right-controls, [data-testid*=control-button-npv], div.controls-left");
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
  // every second check if url has changed. If so, create new buttons 
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      createButton();
    }
  }, 1000);
};
