console.log("[Dreaming Languages Importer] Injecting button...");

window.onload = function () {
  function addHoverEffect(button){
    // Optional: Add hover effect (e.g., slight opacity change)
    button.onmouseover = () => {
      button.style.opacity = "0.8";
    };
    button.onmouseout = () => {
      button.style.opacity = "0.5";
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
    button.style.opacity = "0.5"; // Match opacity of other buttons
    button.style.pointerEvents = "auto";
    button.style.transition = "0.2s ease";


    // Different styling depending on platform
    img.style.width = "24px";
    img.style.height = "24px";

    // Append the img to the button
    button.appendChild(img);

    // Add hover effect
    addHoverEffect(button);

    // Append the button to the controls strip
    let controls = document.querySelector(".controls__right"); 

    if (controls) {
        //controls = webPlayerUI.shadowRoot;
        let btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "center";

        btnContainer.append(button);
        controls.append(btnContainer); // Insert at the end
      } else {
    }

    // Playback controls button click event handler
    button.addEventListener("click", async (event) => {
      let duration;
      // Get the video duration from Disney Plus player

      
      // Get the current tab's URL
      let tabUrl = window.location.href;

      let title = "Untitled";
      // Retrieve the video title

      
      // Get the content creator's name
      let author = "Unknown Author";


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
