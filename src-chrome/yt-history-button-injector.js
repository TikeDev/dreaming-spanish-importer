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

  function getTimeWatchedFromUrl(videoUrl){
    let timeWatched = parseInt(videoUrl.split("&t=")[1])
    console.log("timeWatched from url:" +timeWatched);
    return timeWatched;
  }

  let histElementsArray = []; //tk
  let mode = "youtube";
   //let histElementsArray = document.querySelectorAll("#byline-container");
  if (window.location.href.includes("pocketcasts")) {
    console.log("FOUND POCKET CASTS");
    mode = "pocketcasts";
    //histElementsArray = document.querySelectorAll("entry selector");
  }

  function grabEntryDataAndSend(button){
    let closestAncestor = button.closest('#dismissible');
    let entryUrl = window.location.href; // tab's url as default


      // Get the Title and entry's URL
      let title = "Untitled";
      // Retrieve the video title
      if (mode === "youtube") {
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
        } else {
        }
      }
      else if (mode === "pocketcasts") {
        const titleElement = document.querySelector('title selector');
        title = "Untitled Track"; // Default title if not found
        if (titleElement) {
          title = titleElement.textContent;
        }
        //entryUrl = document.querySelector("a[class*='episode-title player_episode']").href; // grab episode link
      }
          console.log("Youtube TITLE= " + title);


      let duration;
      if (mode === "youtube") {
        //get time watched so far from url (if present)
        duration = parseInt(getTimeWatchedFromUrl(entryUrl) / 60); //seconds

        if (!duration){ 
          // Get the video duration in minutes from YouTube player
          let timeEl = closestAncestor.querySelector("#time-status");
          let durationText = timeEl.textContent.trim();

          // get progress bar's width to figure out time watched so far
          let progressBarEl = closestAncestor.querySelector('#progress');
          const watchedPercent = progressBarEl ? parseFloat(progressBarEl.style.width) : null;

          if (durationText && watchedPercent != null) {
            const totalSec =  timeStrToSeconds(durationText);
            duration = parseInt((totalSec * watchedPercent) / 100 / 60); // watched so far in minutes
          }
            console.log(`Watched ${duration} minutes`);
        }

        console.log("Youtube DURATION= " + duration);
      }
      else if (mode === "pocketcasts") {
        // Get the duration from PocketCasts player
        const timer = document.querySelector('time selector');
        console.log("Youtube TIMER= " + timer.textContent);

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


 

      // Get the content creator's name
      let author = "Unknown Author";
      if (mode === "youtube") {
        const authorElement = closestAncestor.querySelector("#text-container.style-scope.ytd-channel-name");
        //console.log(authorElement);
        if (authorElement) {
          author = authorElement.textContent.trim();
        }
      }
      else if (mode === "pocketcasts") { 
        const authorElement = document.querySelector('author selector');
        if (authorElement) {
          author = authorElement.textContent;
        }
      }
           console.log("Youtube AUTHOR= " + author);

      // Send message to the background script with the video duration, title, and tab URL
        chrome.runtime.sendMessage(
        {
          action: "openDreamingSpanish",
          videoDuration: duration, // in minutes?
          tabUrl: entryUrl,
          title: title,
          author: author,
        },
        (response) => {}
      );
   }

  // Function to create and inject the button
  function createHistPageBtns(histElements){
    // Set mode by url
/*     let mode = "youtube";
    if (window.location.href.includes("pocketcasts")) {
      console.log("FOUND POCKET CASTS");
      mode = "pocketcasts";
      //histElements = document.querySelectorAll("entry selector");
    }
 */
    //histElements = document.querySelectorAll("#byline-container");
    // create and style button
    histElements.forEach((histElement, i) => {
      // Create the button element(s)
      const button = document.createElement("button");
      button.id = `dreaming-spanish-btn-${i}`; // Assign a unique ID // tk change id name

      // Create the img element
      const img = document.createElement("img");
      img.src = chrome.runtime.getURL("add_icon.jpeg"); // Reference the image
      img.alt = "Add to Dreaming Spanish"; // Alt text for accessibility

      // Style the img to be rounded and fit within the button
      img.style.borderRadius = "50%"; // Makes the image rounded
      img.style.display = "block";
      img.style.marginRight = "8px";
      // Different styling depending on platform
      if (mode === "youtube") {
        // img.style.marginTop = "-36px";
        img.style.width = "24px";
        img.style.height = "24px";
      }
      else if (mode === "pocketcasts") {
        img.style.width = "30px";
        img.style.height = "30px";
      }
      // Append the img to the button
      button.appendChild(img);
      addHoverEffect(button);

       //insert buttons here to entry, modify parent display if nec tk to modify
      if (histElement) {
        if (mode === "youtube") {
          //histElement.style.display = "flex";
          histElement.insertBefore(button, histElement.firstChild); // Insert at the beginning
        }
        else {
          //histElement.parentElement.appendChild(button, histElement.parentElement.firstChild); // Insert at the beginning
        }
      } else {
      } 

      button.addEventListener("click", async (event) => {
        if (mode === "pocketcasts") {
          event.stopPropagation(); //prevent existing elements' listeners from interfering with click event
        }
        grabEntryDataAndSend(event.target);
      });

    })// end create and style button


// Style the button to blend with YouTube's controls
/*     
    button.style.background = "transparent"; // Transparent background
    button.style.border = "none"; // No border
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.padding = "0"; // Remove default padding
    button.style.marginLeft = "8px"; // Space between buttons
    button.style.outline = "none"; // Remove focus outline
 */



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

          // check if there are history elements
          histElementsArray = document.querySelectorAll("#byline-container"); //tk
          if (histElementsArray && !document.querySelector("[id^='dreaming-spanish-btn']")) { // might have to change to a class
            createHistPageBtns(histElementsArray);

          }
        }
      }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }

  //createHistPageBtns();
  observeDOM();

  // Handle YouTube's Single Page Application (SPA) navigation
  // Listen for history changes to re-inject the button on new video loads
  // every second check if url has changed. If so, create new buttons 
/*   let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      createHistPageBtns();
    }
  }, 1000); */


};
