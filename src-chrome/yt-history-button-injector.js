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

  // convert hh:mm:ss, mm:ss, or :ss string to seconds
  function timeStrToSeconds(timeStr) {
    const parts = timeStr.trim().split(':').map(Number);
    return parts.length === 3
      ? parts[0]*3600 + parts[1]*60 + parts[2]
      : parts.length === 2
      ? parts[0]*60 + parts[1]
      : parts[0];
  }

  // get time in seconds
  function getTimeWatchedFromUrl(videoUrl){
    let timeWatched = parseInt(videoUrl.split("&t=")[1])
    console.log("timeWatched from url:" +timeWatched);
    return timeWatched;
  }

  let histElementsArray = [];
   //let histElementsArray = document.querySelectorAll("#byline-container");

  function grabEntryDataAndSend(button){
    let closestAncestor = button.closest('#dismissible');
    let entryUrl = window.location.href; // tab's url as default


    // Get the Title and entry's URL
    let title = "Untitled";

    const titleElement = closestAncestor.querySelector("#video-title");
    entryUrl = titleElement.href;
    title = "Untitled Video"; // Default title if not found
    if (titleElement) {
      // Original title with \n and extra spaces
      let rawTitle = titleElement.textContent.trim();
      // Clean the title by replacing multiple whitespace characters with a single space
      let cleanTitle = rawTitle.replace(/\s+/g, " ");
      title = cleanTitle;
      //console.log(title);
    }
      console.log("Youtube TITLE= " + title);


    let duration;
    //get time watched so far from url's &t= param (if present)
    duration = parseInt(getTimeWatchedFromUrl(entryUrl) / 60); //seconds -> min

    if (!duration){ // fallback = get video duration from YouTube player progress bar width    
      let timeEl = closestAncestor.querySelector("#time-status");
      let durationText = timeEl.textContent.trim();
      let progressBarEl = closestAncestor.querySelector('#progress');
      const watchedPercent = progressBarEl ? parseFloat(progressBarEl.style.width) : null;
      if (durationText && watchedPercent != null) {
        const totalSec =  timeStrToSeconds(durationText);
        duration = parseInt((totalSec * watchedPercent) / 100 / 60); // watched so far in minutes
      }
      console.log(`Watched ${duration} minutes`);
      console.log("Youtube DURATION= " + duration);
    }

    // Get the content creator's name
    let author = "Unknown Author";
    const authorElement = closestAncestor.querySelector("#text-container.style-scope.ytd-channel-name");
    //console.log(authorElement);
    if (authorElement) {
      author = authorElement.textContent.trim();
    }
    console.log("Youtube AUTHOR= " + author);


    // Send message to the background script with the video duration, title, and tab URL
      chrome.runtime.sendMessage(
      {
        action: "openDreamingSpanish",
        videoDuration: duration,  // in minutes
        tabUrl: entryUrl,
        title: title,
        author: author,
      },
      (response) => {}
    );
   }

  // Function to create and inject the button
  function createHistPageBtns(histElements){

    histElements.forEach((histElement, i) => {
      if (histElement.querySelector("[id^='dreaming-spanish-btn-']")) // prevent duplicates
        return;

      // Create the button element(s)
      const button = document.createElement("button");
      button.id = `dreaming-spanish-btn-${i}`; // Assign a unique ID

      // Create the img element
      const img = document.createElement("img");
      img.src = chrome.runtime.getURL("dreamingplus.png"); // Reference the image
      img.alt = "Add to Dreaming Spanish"; // Alt text for accessibility

      // Style the img to be rounded and fit within the button
      img.style.borderRadius = "50%"; // Makes the image rounded
      img.style.display = "block";
      img.style.marginLeft = "8px";
      img.style.marginRight = "8px";
      img.style.width = "18px";
      img.style.height = "18px";

      // style button
      button.style.background = "transparent"; // Transparent background
      button.style.border = "none"; // No border
      button.style.cursor = "pointer"; // Pointer cursor on hover
      button.style.padding = "0"; // Remove default padding
      //button.style.marginLeft = "8px"; // Space between buttons
      button.style.outline = "none"; // Remove focus outline

      // Append the img to the button
      button.appendChild(img);
      addHoverEffect(button);

      // insert button
      if (histElement) {
        histElement.insertBefore(button, histElement.firstChild); // Insert at the beginning
      } 
      else {
      } 

      // button click listener
      button.addEventListener("click", async (event) => {
        grabEntryDataAndSend(event.target);
      });
    })

  }

  // Function to observe DOM changes and inject the button when video history elements are available
  function observeDOM() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    let lastExecutionTime = 0;
    const timeout = 1000;

    const callback = function (mutationsList, observer) {

      // Delay to avoid overdoing page traversal
      const currentTime = Date.now();
      if ((currentTime - lastExecutionTime) < timeout) {
        return;
      }
      lastExecutionTime = currentTime;

      // for each mutation observed, if there are history elements but no DS button, create one 
      for (let mutation of mutationsList) { 
        if (mutation.type === "childList") {

          // check if there are history elements
          histElementsArray = document.querySelectorAll("#byline-container");
          if (histElementsArray && !document.querySelector(`[id^='dreaming-spanish-btn-${histElementsArray.length-1}']`)) {
            createHistPageBtns(histElementsArray); 
          }
        }
      }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }

  observeDOM();

  // Handle YouTube's Single Page Application (SPA) navigation
  // Listen for history changes to re-inject the button on new video loads
  // every second check if url has changed. If so, create new buttons 
   let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      createHistPageBtns();
    }
  }, 1000); 


};
