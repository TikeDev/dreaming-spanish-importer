
window.onload = function () {
  // DON'T INJECT if toggle switch off
  chrome.storage.sync.get('toggleInjectSpotify', (data) => {
    if (data.toggleInjectSpotify === false) return;


  console.log("[Dreaming Languages Importer] Injecting button...");

  let controlsSelector = "[data-testid*=control-button-npv]";  // element to inject button into
  let buttonID = "dreaming-spanish-np-button";                 // DS button ID
  let buttonSelector = `#${buttonID}`;                         // DS button selector

  // podcast episode list or audiobook page
  let trackListContainerSelector = 'div[aria-labelledby^="listrow-title-chapter-"], li[aria-posinset]'; // element to inject track list button into
  let trackListButtonID = "dreaming-spanish-tracklist-button"; // track list page DS button ID
  let trackListElementsArray = [];

    // Add hover effect (slight opacity and size change)  
  function addHoverEffect(button){
    button.onmouseover = () => {
      button.style.opacity = "1";
      button.style.transform = "scale(1.04)";
    };
    button.onmouseout = () => {
      button.style.opacity = "0.8";
      button.style.transform = "scale(1.0)";
    };
  }

    // Add hover effect (slight opacity and size change)  
  function addHoverEffectTrackList(button){
    button.onmouseover = () => {
      button.style.opacity = ".7";
      button.style.transform = "scale(1.04)";
    };
    button.onmouseout = () => {
      button.style.opacity = "1";
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

  // episode list page - check to see if right URL and if there are still list buttons left to inject
  function shouldInjectTrackList(elementsArray) {
    return (
      (( location.pathname.startsWith('/collection/your-episodes') 
      || location.pathname.startsWith('/show'))
      )
      && elementsArray 
    )          
  }

  function isAudioBookPage(){
    return (document.head.querySelector("title").textContent.includes("Audiobook"))
  }

    // Create and inject a button for each video listed on page
  function createTrackListPageBtns(trackListElements){
    if (!trackListElements || !trackListElements.length) return;

    trackListElements.forEach((trackListElement) => {
      if (trackListElement.querySelector(`[id^='${trackListButtonID}']`)) // prevent duplicates
        return;

      let i = trackListElement.getAttribute('aria-posinset'); // link button id to position in list

      // Create the button element(s)
      const button = document.createElement("button");
      button.id = `${trackListButtonID}-${i}`; // Assign a unique ID

      // Create the img element
      const img = document.createElement("img");
      img.src = chrome.runtime.getURL("images/dreamingplus.png"); // Reference the image
      img.alt = "Add to Dreaming Spanish"; // Alt text for accessibility

      // Style the img to be rounded and fit within the button
      img.style.borderRadius = "50%"; // Makes the image rounded
      img.style.display = "block";
      //img.style.marginLeft = "8px";
      //img.style.marginRight = "8px";
      img.style.width = "33px";
      img.style.height = "33px";

      // style button
      button.style.background = "transparent"; // Transparent background
      button.style.border = "none"; // No border
      button.style.cursor = "pointer"; // Pointer cursor on hover
      button.style.padding = "0"; // Remove default padding
      button.style.marginLeft = "20px"; // Space between buttons
      button.style.outline = "none"; // Remove focus outline
      button.style.verticalAlign = "middle"; // Align in middle

      // if track marked as "finished," warn that there's no duration available to submit
      let markedFinishedEl = trackListElement.querySelectorAll('p[data-encore-id="text"]');
      let isMarkedFinished = false;

      if (markedFinishedEl.length == 2){
        isMarkedFinished = markedFinishedEl[1].textContent.includes("Finished");
        if (isMarkedFinished){
          img.src = chrome.runtime.getURL("images/dreamingplus-warn.png"); // Reference the image
          img.style.opacity = ".5";
          
          // add warning tooltip
          let warnToolTip = document.createElement("span");
          warnToolTip.classList.add("tooltiptext");
          warnToolTip.innerText = 'No duration available!\nWill submit with duration of 1 min.';

          button.classList.add("tooltip");
          button.appendChild(warnToolTip);
        }
      }

      // Append the img to the button
      button.appendChild(img);

      if (!isMarkedFinished){
        addHoverEffectTrackList(button);        
      }

      // insert button
      if (trackListElement) {
      let playButton = trackListElement.querySelector('button[data-testid="play-button"][data-encore-id="buttonPrimary"]');
        playButton.after(button);  // add to right of play button
      } 
      else {
      } 

      // button click listener
      button.addEventListener("click", async (event) => {
        grabEntryDataAndSendTrackList(event.target);
      });
    })

  }

  // convert '1 hr 3 min' or '3 min 2 sec' or '39 min' format to minutes
  function convertTimeToMinutes(timeString, locale = "en") {
    const seconds = {
      en: "sec",
      es: "seg",
      pt: "seg",
      fr: "sec"
    };

    const minutes = {
      en: "min",
      es: "min",
      pt: "min",
      fr: "min"
    };

    const hours = {
      en: "hr",
      es: "hr",
      pt: "hr",
      fr: "hr"
    };

    const regex = new RegExp(
      `(?:(\\d+)\\s*${hours[locale]})?\\s*` +
      `(?:(\\d+)\\s*${minutes[locale]})?\\s*` +
      `(?:(\\d+)\\s*${seconds[locale]})?`,
      "i"
    );

    const match = timeString.match(regex);
    if (!match) return null;

    const numHours = match[1] ? parseInt(match[1]) : 0;
    const numMinutes = match[2] ? parseInt(match[2]) : 0;
    const numSeconds = match[3] ? parseInt(match[3]) : 0;

    return numHours * 60 + numMinutes + Math.floor(numSeconds / 60);
  }

  function grabEntryDataAndSendTrackList(button){
    let closestAncestor = button.closest(trackListContainerSelector);
    let extraData = "";

    let mode = "podcast";
    if(isAudioBookPage()){
      mode = "audiobook";
    }
    else if (location.pathname.startsWith('/collection/your-episodes')) {
      mode = "collection"
    }

    // DATE - today. Spotify doesn't show listening history on web player :(
    //let dayWatched = new Date  // YYYY-MM-DD
    //console.log("DAY WATCHED: " + dayWatched);

    // TITLE - Retrieve the video title
    let title = "Untitled";
    const titleElement = closestAncestor.querySelector('[data-encore-id="listRowTitle"]');
    title = "Untitled Video"; // Default title if not found
    if (titleElement) {
      // Original title with \n and extra spaces
      let rawTitle = titleElement.textContent.trim();
      // Clean the title by replacing multiple whitespace characters with a single space
      let cleanTitle = rawTitle.replace(/\s+/g, " ");
      title = cleanTitle;
    }
    console.log("[SPOTIFY] VIDEO TITLE: " + title);


    // URL - Get video URL from link
    let entryUrl = location.href;
    if (mode == "collection"){
      // get episode path from element with id containing it
      entryUrl = "https://open.spotify.com/episode/" + closestAncestor.querySelector('[id*="listrow-title-book-spotify:episode:"]').id.split("listrow-title-book-spotify:episode:")[1]; // 
    }
    else if (mode == "podcast") { // podcast page
      entryUrl = titleElement.querySelector("a").href;
    }
    console.log("[SPOTIFY] VIDEO URL: " + entryUrl);


    //DURATION - get time watched so far from progress bar value
    let duration = closestAncestor.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'); // msec 
    if (duration) { 
      duration = Math.floor(duration / 1000 / 60); // convert to minutes
    }
    else { // get total duration of track if listed
      let timeString = closestAncestor.querySelector('[data-testid="episode-progress-not-played"]')?.textContent.trim();
      if (timeString){
        let locale = document.head.querySelector("link[data-translations-url-for-locale]")?.getAttribute('data-translations-url-for-locale');
        duration = convertTimeToMinutes(timeString, locale);
      }
      else { // :( no duration listed (prob marked as "finished")
        duration = null;
        extraData = "*⚠️ NO DURATION SUBMITTED*\n";
      }
    }
    console.log("[SPOTIFY] VIDEO DURATION: " + (duration || "no listed ") + " min");


    // Get the content creator's name
    let author = "Unknown Author"; 
    if (mode == "audiobook"){
      let audiobook = document.querySelector('[data-testid="entityTitle"]').textContent.trim();
      author = audiobook + " (by " + 
      document.querySelector('[data-testid="entityAuthor"]').textContent.trim() 
      + ")";
    }
    else {
      const authorElement = closestAncestor.querySelector('[data-encore-id="listRowSubtitle"]');
      if (authorElement) {
        author = authorElement.textContent.trim();
      }
    }
    console.log("[SPOTIFY] VIDEO AUTHOR: " + author);


    // Send message to the background script with the video duration, title, and tab URL
      chrome.runtime.sendMessage(
      {
        action: "openDreamingSpanish",
        videoDuration: (duration || 1),  // in minutes, default 1 min
        tabUrl: entryUrl,
        title: title,
        author: author,
        extraData: extraData
      },
      (response) => {}
    );
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
      author: author
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
    img.src = chrome.runtime.getURL("images/dreamingplus.png"); // Reference the image
    img.alt = "Add to Dreaming Spanish"; // Alt text for accessibility

    // Style the img to be rounded and fit within the button
    img.style.borderRadius = "50%"; // Makes the image rounded
    img.style.display = "block";
    img.style.marginRight = "8px";
    img.style.width = "20px";
    img.style.height = "20px";

    // Style the button to blend with spotify's controls
    button.style.background = "transparent"; // Transparent background
    button.style.border = "none"; // No border
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.padding = "0"; // Remove default padding
    button.style.marginLeft = "8px"; // Space between buttons
    button.style.outline = "none"; // Remove focus outline
    button.style.opacity = "1";
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
    const timeout = 500;

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
          // check if ready to inject now playing button
          if (shouldInject(controlsSelector, buttonID)) {
            createButton();
          }

          // episode list page - check if there are elements to inject buttons
          trackListElementsArray = document.querySelectorAll(trackListContainerSelector);
          if (shouldInjectTrackList(trackListElementsArray)) {
            createTrackListPageBtns(trackListElementsArray); 
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

      // episode list page
      if (shouldInjectTrackList(trackListElementsArray)){
        createTrackListPageBtns(trackListElementsArray);
      }
    }
  }, 1000); 
})
};
