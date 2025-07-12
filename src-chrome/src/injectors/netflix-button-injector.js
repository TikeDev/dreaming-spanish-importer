console.log("[Dreaming Languages Importer] Injecting button...");

window.onload = function () {
  let controlsSelector = 'button[aria-label="Full screen"], button[aria-label="Pantalla completa"], button[aria-label="Tela inteira"], button[aria-label="Plein écran"]' ;  // element to ultimately inject button into
  let buttonID = "dreaming-spanish-button"; // DS button ID
  //let buttonSelector = `#${buttonID}`;      // DS button selector

  function addHoverScaleEffect(button){
    // Optional: Add hover effect (e.g., size increase animation)
    button.onmouseover = () => {
      button.style.transform = "scale(1.3)";
    };
    button.onmouseout = () => {
      button.style.transform = "scale(1.0)";
    };
  }

  // check if ready to inject button to relevant container element
  function shouldInject(containerSel, buttonId) {
    const container = document.querySelector(containerSel);
    const buttonExists = document.getElementById(buttonId);

    return (container && !buttonExists && location.pathname.startsWith('/watch'));
  }

  function grabEntryDataAndSend(button){
    button.blur(); // Remove focus to prevent spacebar re-trigger

    // URL - Get the current tab's URL
    let tabUrl = window.location.href.split("?")[0];
    console.log("[NETFLIX] VIDEO URL: " + tabUrl);


    //DURATION - Calculate video duration watched from time scrubber aria value
    let duration;
    let slider = document.querySelector('button[aria-label="Seek time scrubber"]'); 
    if (slider) {
      let watchedMSecs = parseInt(slider.getAttribute("aria-valuenow")); // get in msec
      duration = Math.floor(watchedMSecs / 1000 / 60); // Convert to minutes
    }
    console.log("[NETFLIX] VIDEO DURATION: " + duration);
  

    // TITLE - Retrieve the episode title
    let title = "Untitled";
    const titleBar = document.querySelector('[data-uia="video-title"]');
    if (titleBar) {
      // Original title with \n and extra spaces
      let episode = titleBar.querySelectorAll('span');
      title = episode[0].textContent.trim() + ": " + episode[1].textContent.trim();
    }
    console.log("[NETFLIX] VIDEO TITLE: " + title);
    

    // AUTHOR - Get show name
    let author = "Unknown Author";
    let showElement = titleBar.querySelector('h4');
    if (showElement) {
      author = showElement.textContent.trim();
    }
    console.log("[NETFLIX] VIDEO AUTHOR: " + author);


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

  // Function to create and inject the button
  function createButton() {
    // Prevent injecting multiple buttons
    if (document.getElementById(buttonID)) return;

    let controls = document.querySelector(controlsSelector); 
    if (!controls) 
      return;

    // Create the button element
    const button = document.createElement("button");
    button.id = buttonID; // Assign a unique ID

    // Create the img element
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/dreamingplus.png"); // Reference the image
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
    let btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "center";
    btnContainer.append(button);

    let controlsContainer = controls.parentElement.parentElement;
    controlsContainer.insertBefore(btnContainer, controlsContainer.lastChild);

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
    let debounceTimerId, debounceDuration = 500;

    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimerId);
      // wait until mutations die down to check for controls
      debounceTimerId = setTimeout(() => {
      if(shouldInject(controlsSelector, buttonID)){
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

