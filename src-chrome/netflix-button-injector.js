console.log("[Dreaming Languages Importer] Injecting button...");

window.onload = function () {
  function addHoverScaleEffect(button){
    // Optional: Add hover effect (e.g., size increase animation)
    button.onmouseover = () => {
      button.style.transform = "scale(1.3)";
    };
    button.onmouseout = () => {
      button.style.transform = "scale(1.0)";
    };
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

    // Styling depending on platform
    img.style.borderRadius = "50%"; // Makes the image rounded
    img.style.width = "4.7rem";
    img.style.height = "4.7rem";

    // Style the button to blend with YouTube's controls
    button.style.background = "transparent"; // Transparent background
    button.style.border = "none"; // No border
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.padding = "0"; // Remove default padding
    button.style.marginRight = "3.3rem"; // Space between buttons
    button.style.outline = "none"; // Remove focus outline
    //button.style.opacity = "0.6"; // Match opacity of other buttons
    button.style.pointerEvents = "auto";
    button.style.transition = "transform 150ms";
    button.style.zIndex = "1";

    // Append the img to the button
    button.appendChild(img);

    // Add hover effect
    addHoverScaleEffect(button);

    // Append the button to the right controls strip
    let controls = document.querySelector('button[aria-label="Full screen"]'); 

    if (controls) {
        let btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "center";
        btnContainer.append(button);

        let controlsContainer = controls.parentElement.parentElement;
        controlsContainer.insertBefore(btnContainer, controlsContainer.lastChild);
      } else {
    }

    // Playback controls button click event handler
      button.addEventListener("click", async (event) => {      
      button.blur(); // Remove focus to prevent spacebar re-trigger

      // URL - Get the current tab's URL
      let tabUrl = window.location.href.split("?")[0];

      //DURATION - Get video duration watched from time scrubber
      let duration;
      let slider = document.querySelector('button[aria-label="Seek time scrubber"]'); 
      if (slider) {
        let watchedSecs = parseInt(slider.getAttribute("aria-valuenow")); // get in milliseconds
        duration = Math.floor(watchedSecs / 1000 / 60); // Convert to minutes
      }
        console.log("DURATION: " + duration);
   

      // TITLE - Retrieve the episode title
      let title = "Untitled";
      const titleBar = document.querySelector('[data-uia="video-title"]');

      if (titleBar) {
        // Original title with \n and extra spaces
        let episode = titleBar.querySelectorAll('span');
        title = episode[0].textContent.trim() + ": " + episode[1].textContent.trim();
      }
      console.log("TITLE: " + title);
      

      // AUTHOR - Get show name
      let author = "Unknown Author";
      let showElement = titleBar.querySelector('h4');

      if (showElement) {
        author = showElement.textContent.trim();
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
          const controls = document.querySelector('button[aria-label="Full screen"]');
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

