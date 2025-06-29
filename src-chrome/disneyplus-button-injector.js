console.log("[Dreaming Languages Importer] Injecting button...");

window.onload = function () {
  function addHoverEffect(button){
    // Optional: Add hover effect (e.g., slight opacity change)
    button.onmouseover = () => {
      button.style.opacity = "1";
    };
    button.onmouseout = () => {
      button.style.opacity = "0.6";
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
    img.style.width = "30px";
    img.style.height = "30px";

    // Style the button to blend with YouTube's controls
    button.style.background = "transparent"; // Transparent background
    button.style.border = "none"; // No border
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.padding = "0"; // Remove default padding
    button.style.marginRight = "14px"; // Space between buttons
    button.style.outline = "none"; // Remove focus outline
    button.style.opacity = "0.6"; // Match opacity of other buttons
    button.style.pointerEvents = "auto";
    button.style.transition = "0.2s ease";


    // Append the img to the button
    button.appendChild(img);

    // Add hover effect
    addHoverEffect(button);

    // Append the button to the right controls strip
    let controls = document.querySelector(".controls__right"); 

    if (controls) {
        let btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "center";

        btnContainer.append(button);
        controls.insertBefore(btnContainer, controls.firstChild); // Insert at the beginning
      } else {
    }

    // Playback controls button click event handler
    button.addEventListener("click", async (event) => {      
      button.blur(); // Remove focus to prevent spacebar re-trigger

      // URL - Get the current tab's URL
      let tabUrl = window.location.href;

      //DURATION - Get video duration watched from Disney Plus player
      let duration;
      let slider = document.querySelector(".slider-container");
      if (slider) {
        let watchedSecs = slider.getAttribute("aria-valuenow"); // get in seconds
        duration = Math.floor(parseInt(watchedSecs) / 60); // Convert to minutes
      }
        console.log("DURATION: " + duration);
   

      // TITLE - Retrieve the episode title
      let title = "Untitled";

      const titleElement = document.querySelector(".subtitle-field");
      if (titleElement) {
        // Original title with \n and extra spaces
        let rawTitle = titleElement.textContent.trim();
        // Clean the title by replacing multiple whitespace characters with a single space
        let cleanTitle = rawTitle.replace(/\s+/g, " ");
        title = cleanTitle;
      }
        console.log("TITLE: " + title);
      

      // AUTHOR - Get show name
      let author = "Unknown Author";

      const authorElement = document.querySelector('.title-field.body-copy');
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
          const controls = document.querySelector(".controls__right");
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
