console.log("[Dreaming Languages Importer] Injecting button...");

window.onload = function () {
  let controlsSelector = ".controls__right"; // element to ultimately inject button into
  let buttonID = "dreaming-spanish-button";  // DS button ID
  let buttonSelector = `#${buttonID}`;       // DS button selector

  function addHoverEffect(button){
    // Optional: Add hover effect (e.g., slight opacity change)
    button.onmouseover = () => {
      button.style.opacity = "1";
    };
    button.onmouseout = () => {
      button.style.opacity = "0.6";
    };
  }

  // check if right URL and ready to inject button to relevant container element
  function shouldInject(containerSel, buttonId) {
    const container = document.querySelector(containerSel);
    const buttonExists = document.getElementById(buttonId);

    return (container && !buttonExists && location.pathname.includes('/play'));
  }

  function grabEntryDataAndSend(button){
      button.blur(); // Remove focus to prevent spacebar re-trigger

      // URL - Get the current tab's URL
      let tabUrl = window.location.href;
      console.log("[DISNEY PLUS] VIDEO URL: " + tabUrl);


      //DURATION - Calulate video duration watched from Disney Plus player time scrubber aria value
      let duration;
      let slider = document.querySelector(".slider-container");
      if (slider) {
        let watchedSecs = slider.getAttribute("aria-valuenow"); // get in seconds
        duration = Math.floor(parseInt(watchedSecs) / 60); // Convert to minutes
      }
      console.log("[DISNEY PLUS] VIDEO DURATION: " + duration);
   

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
      console.log("[DISNEY PLUS] VIDEO TITLE: " + title);
      

      // AUTHOR - Get show name
      let author = "Unknown Author";
      const authorElement = document.querySelector('.title-field.body-copy');
      if (authorElement) {
        author = authorElement.textContent;
      }
      console.log("[DISNEY PLUS] VIDEO AUTHOR: " + author);


      // Send message to the background script with the video duration, title, and tab URL
       chrome.runtime.sendMessage(
        {
          action: "openDreamingSpanish",
          duration: (duration || 1), // can't submit 0 min, default 1 min
          activity: "watching",  
          tabUrl: tabUrl,
          title: title,
          author: author,
        },
        (response) => {}
      );
  }

  // Function to create and inject the button
  function createButton() {
    // Prevent injecting multiple buttons
    if (document.querySelector(buttonSelector)) return;

    let controls = document.querySelector(controlsSelector); 
    if (!controls){
      return; 
    }
    // Create the button element
    const button = document.createElement("button");
    button.id = buttonID; // Assign a unique ID

    // Create the img element
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/dreamingplus.png"); // Reference the image
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
    addHoverEffect(button); // Add hover effect

    // create container to hold button
    let btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "center";
    btnContainer.append(button);

    // Append the button to the right controls strip
    controls.insertBefore(btnContainer, controls.firstChild); // Insert at the beginning

    // Playback controls button click event handler
    button.addEventListener("click", async (event) => {   
      grabEntryDataAndSend(button);   
     });
  }

  // Function to observe and wait until DOM mutation activity
  // dies down, then check for right controls and inject button
  function observeDOM(){
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    let debounceTimerId, debounceDuration = 1000;

    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimerId);
      // wait until mutations die down to check for controls
      debounceTimerId = setTimeout(() => {
        if (shouldInject(controlsSelector, buttonID)) {
          createButton();
        }
      }, debounceDuration);
    });

    observer.observe(targetNode, config);
      if(shouldInject(controlsSelector, buttonID)){
        createButton();
      }
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
      if(shouldInject(controlsSelector, buttonID)){
        createButton();
      }
    }
  }, 1000);
};
