
window.onload = function () {
  console.log("[Dreaming Languages Importer] Injecting button...");
  // now playing button
  let controlsSelector = ".controls-left";  // element to ultimately inject button into
  let buttonID = "dreaming-spanish-button"; // DS button ID
  let buttonSelector = `#${buttonID}`;      // DS button selector

  // history page buttons
  let histContainerSelector = 'div[data-index]';   // element to ultimately inject history button into
  let histButtonID = "dreaming-spanish-hist-button"; // history page DS button ID
  let histElementsArray = [];

  function addHoverEffect(button){
    // Optional: Add hover effect (e.g., slight opacity change)
    button.onmouseover = () => {
      button.style.opacity = "0.8";
    };
    button.onmouseout = () => {
      button.style.opacity = "1";
    };
  }

  // NOW PLAYING BUTTON //////////
  // convert hh:mm:ss, mm:ss, or :ss string to seconds
  function timeStrToSeconds(timeStr) {
    const parts = timeStr.trim().split(':').map(Number);
    return parts.length === 3
      ? parts[0]*3600 + parts[1]*60 + parts[2]
      : parts.length === 2
      ? parts[0]*60 + parts[1]
      : parts[0];
  }

  // check if ready to inject button to relevant container element
  function shouldInject(containerSel, buttonId) {
    const container = document.querySelector(containerSel);
    const buttonExists = document.getElementById(buttonId);

    return (container && !buttonExists);
  }

  function grabEntryDataAndSend(button){
    button.blur(); // Remove focus to prevent spacebar re-trigger

    //DURATION - Get listened to so far duration from Pocket Casts player
    const timer = document.querySelector('[data-testid="current-time"]');
    if (!timer) {
      return;
    }
    const duration = Math.floor(timeStrToSeconds(timer.textContent) / 60); // get in minutes
    console.log("[POCKET CASTS] TRACK DURATION: " + duration + " min");
      

    // TITLE - Retrieve the track title
    let title = "Untitled Track"; // Default title if not found    
    const titleElement = document.querySelector("a[class*='episode-title player_episode");
    if (titleElement) {
      title = titleElement.textContent;
    }
    if (document.querySelector(".chapter")){  // Note: if the episode has sections, the player displays the title as the current section :(    
      let timeScrubber = document.querySelector(".knob");
      let timeScrubberPos = parseFloat(window.getComputedStyle(timeScrubber)?.left);
      let chapterDotElements = document.querySelectorAll(".dot");
      let firstChapterLimit = parseFloat(window.getComputedStyle(chapterDotElements[1])?.left);

      if (timeScrubberPos > firstChapterLimit){
        extraData = "*UNKNOWN EP (see link)*";  
        title = "";
      }
    }
    console.log("[POCKET CASTS] TRACK TITLE: " + title);
    
    
    // URL - Get the current track's URL
    let tabUrl = titleElement.href; // grab episode link
    console.log("[POCKET CASTS] TRACK URL: " + tabUrl);


    // AUTHOR - Get the content creator's name
    let author = "Unknown Author";
    const authorElement = document.querySelector('.podcast-title.player_podcast_title');
    if (authorElement) {
      author = authorElement.textContent;
    }
    console.log("[POCKET CASTS] TRACK AUTHOR: " + author);


    // Send message to the background script with the track duration, title, and tab URL
      chrome.runtime.sendMessage(
      {
        action: "openDreamingSpanish",
        duration: (duration || 1), // can't submit 0 min, default 1 min
        activity: "listening",  
        tabUrl: tabUrl,
        title: title,
        author: author,
        extraData: extraData
      },
      (response) => {}
    ); 
  }

  // Function to create and inject the button
  function createButton() {
    // Prevent injecting multiple buttons
    if (document.getElementById(buttonSelector)) return;

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
    img.style.marginLeft = "8px";
    img.style.marginRight = "8px";
    img.style.width = "30px";
    img.style.height = "30px";

    // Style the button to blend with Pocket Cast's controls
    button.style.background = "transparent"; // Transparent background
    button.style.border = "none"; // No border
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.padding = "0"; // Remove default padding
    button.style.marginLeft = "25px"; // Space between buttons
    button.style.outline = "none"; // Remove focus outline

    // Append the img to the button
    button.appendChild(img);
    addHoverEffect(button); // Add hover effect

    // Append the button to the left controls strip
    controls.append(button); // Insert at the end
    button.style.zIndex = "2"; // Keep button clickable between page resizes

    // Playback controls button click event handler
    button.addEventListener("click", async (event) => {  
      grabEntryDataAndSend(button);    
    });
  }  
  

// HISTORY PAGE BUTTONS //////////
  // history page - check to see if right URL and if there are elements to inject buttons into
  function shouldInjectHist(elementsArray) {
    return (
      location.pathname.startsWith('/history')
      && elementsArray       
    )          
  }

  // convert '1 h 3 m' or '39 min' format to minutes
  function convertTimeToMinutes(timeString, locale) {
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

    const min = {
      en: "m",
      es: "m",
      pt: "m",
      fr: "m"
    };

    const hr = {
      en: "h",
      es: "h",
      pt: "h",
      fr: "h"
    };


    // "2 secs" or "1 sec"
    if (timeString.includes(seconds[locale])){ // under a min
      return parseFloat(timeString) / 60;
    }

    // regex to extract hours and minutes
    let regex = new RegExp(`(\\d+)\\s*${hr[locale]}\\s*(\\d+)\\s*${min[locale]}`);
    let match = timeString.match(regex);    
    let totalMinutes;

    // "1h 8m" format
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);

      totalMinutes = (hours * 60) + minutes;
      return totalMinutes;
    }
    // "39 min" format
    else {
      totalMinutes = parseInt(timeString)
      if (totalMinutes) {
        return (totalMinutes)
      }
    }

    console.error("Invalid time format. Expected '1 h 3 m', '39 min', or '2 secs' format.");
    return null; // Or throw an error
  }

  // use path data to infer percentage
  function extractWatchProgressFromSVG(svgElement) {
      const paths = svgElement.querySelectorAll('path');
      
      let watchedArc = null;
      let unwatchedArc = null;
      let hasGrayArc = false;
      let solidBlueArcs = [];
      
      // check for gray stroke first (100% watched indicator)
      const grayColors = ['#EFF3F5', '#eff3f5', 'rgb(239,243,245)', 'rgb(239, 243, 245)'];
      
      paths.forEach(path => {
          const stroke = path.getAttribute('stroke');
          const opacity = path.getAttribute('opacity');
          const fill = path.getAttribute('fill');
          
          if (fill && fill !== 'none' && !stroke) return; // Skip play button
          
          // check if this is a gray arc (100% watched)
          if (stroke && grayColors.includes(stroke)) {
              hasGrayArc = true;
              return 100;
          }
          
          if (stroke === '#03A9F4') {
              if (opacity === '0.3') {
                  watchedArc = path;
              } else if (!opacity || opacity === '1') {
                  unwatchedArc = path;
                  solidBlueArcs.push(path);
              }
          }
      });
      
      // if gray arc, it's 100% watched
      if (hasGrayArc) {
          return 100;
      }
      
      // if only one full solid blue circle, it's 0% watched
      if (solidBlueArcs.length === 1 && !watchedArc) {
          return 0;
      }
      
      // we need both arcs for partial progress 
      if (!watchedArc || !unwatchedArc) {
          console.error('Could not find both watched and unwatched arcs for partial progress');
          return null;
      }
      
      // get path lengths (approximate)
      const watchedLength = watchedArc.getTotalLength();
      const unwatchedLength = unwatchedArc.getTotalLength();
      
      const totalLength = watchedLength + unwatchedLength;
      const progressPercentage = (watchedLength / totalLength) * 100;
      
      return progressPercentage;
  }

  function calcWatchedTime(svgElement, timeLeft, locale){
    let percentWatched = extractWatchProgressFromSVG(svgElement);
    let minutesLeft = convertTimeToMinutes(timeLeft, locale);

    console.log("WATCHED PERCENTAGE " + percentWatched);
    if (percentWatched >= 0 && minutesLeft){
      let percentLeft = 100 - percentWatched;
      let totalTime = minutesLeft / (percentLeft / 100);
      let minutesWatched = Math.floor(totalTime - minutesLeft);
      return minutesWatched;
    }
    return null;
  }

  function grabEntryDataAndSendHist(button){
    //  current columns appearance:
    //    0            1                   2          3          4       5    6  
    // |image|title/podcast/(DS btn)|date published|time left|btn strip|???|play btn|

    let closestAncestor = button.closest('div[data-index]'); // list container
    let spanEls = closestAncestor.querySelectorAll("span");
    let linkEls = closestAncestor.querySelectorAll('[href^="/podcasts/"]');

    // DATE - unfortunately the date displayed is the date of publication :(


    // TITLE - Retrieve the track title
    let title = "Untitled";
    let titleElement = linkEls[0];
    title = "Untitled track"; // Default title if not found
    if (titleElement) {
      // Original title with \n and extra spaces
      let rawTitle = titleElement.textContent.trim();
      // Clean the title by replacing multiple whitespace characters with a single space
      let cleanTitle = rawTitle.replace(/\s+/g, " ");
      title = cleanTitle;
    }
    console.log("[POCKET CASTS] TRACK TITLE: " + title);


    // URL - Get track URL from link
    let entryUrl = location.href; // tab url as default
    let entryUrlEl = titleElement;
    if (entryUrlEl){
      entryUrl = entryUrlEl.href;
    }    
    console.log("[POCKET CASTS] TRACK URL: " + entryUrl);


    // DURATION - figure out time watched so far by using 
    // time left to watch and the play button's progress circle
    let duration;
    let durationLeftText = spanEls[4].textContent.trim(); //Ex. "1 h 9 m" or "39 min"

    if (durationLeftText){ 
      let playButtonEl = closestAncestor.querySelector('button[aria-label="Play"]');
      let progressCircleEl = playButtonEl.querySelector('svg');
      let localeEl = document.head.querySelector('meta[property="og:locale"]');
      let locale = localeEl.content.split("-")[0]; // Ex. "en-US" -> "en"
      duration = calcWatchedTime(progressCircleEl, durationLeftText, locale);
      console.log("WATCHED: " + duration + " min");
    }
    console.log("[POCKET CASTS] TRACK DURATION: " + (duration || "no listed ") + " min");


    // AUTHOR - Get the content creator's name
    let author = "Unknown Author";
    const authorElement = linkEls[1];
    if (authorElement) {
      author = authorElement.textContent.trim();
    }
    console.log("[POCKET CASTS] TRACK AUTHOR: " + author);


    // Send message to the background script with the track duration, title, and tab URL
      chrome.runtime.sendMessage(
      {
        action: "openDreamingSpanish",
        duration: (duration || 1), // can't submit 0 min, default 1 min
        activity: "listening",  
        tabUrl: entryUrl,
        title: title,
        author: author
      },
      (response) => {}
    );
  }

  // Create and inject a button for each track listed on page
  function createHistPageBtns(histElements){
    if (!histElements || !histElements.length) return;

    histElements.forEach((histElement) => {
      if (histElement.querySelector(`[id^='${histButtonID}']`)) // prevent duplicates
        return;
        
      const i = histElement.getAttribute('data-index');
      const button = document.createElement("button");
      button.id = `${histButtonID}-${i}`; // Assign a unique ID

      // Create the img element
      const img = document.createElement("img");
      img.src = chrome.runtime.getURL("images/dreamingplus.png"); // Reference the image
      img.alt = "Add to Dreaming Spanish"; // Alt text for accessibility

      // Style the img to be rounded and fit within the button
      img.style.borderRadius = "50%"; // Makes the image rounded
      img.style.display = "block";
      img.style.marginLeft = "2px";
      img.style.marginRight = "2px";
      img.style.width = "auto";
      img.style.height = "100%";
      img.style.minWidth = "15px";
      img.style.minHeight = "15px";
      img.style.backgroundColor = "rgba(3, 169, 244, .8)";

      // style button
      button.style.background = "transparent"; // Transparent background
      button.style.border = "none"; // No border
      button.style.cursor = "pointer"; // Pointer cursor on hover
      button.style.padding = "0"; // Remove default padding
      //button.style.marginLeft = "8px"; // Space between buttons
      button.style.outline = "none"; // Remove focus outline
      button.style.marginRight = "0px";
      button.style.height = "100%";
      button.style.width = "auto";
      button.style.position = "relative";
      button.style.top = "40%";

      // Append the img to the button
      button.appendChild(img);
      addHoverEffect(button);

      // insert button
      if (histElement) {
          let divContainer = document.createElement("div");
          divContainer.style.minWidth = "25%";
          divContainer.style.display = "flex";
          divContainer.style.justifyContent = "flex-end";
          divContainer.style.width = "auto";
          divContainer.style.flexGrow = "1";
          divContainer.style.height = "25px";
          divContainer.style.marginRight = "10px";

          divContainer.appendChild(button);

          // add button container to podcast title's grid box
          let row = histElement.childNodes[0];
          let podcastTitleGridBox = row.childNodes[1];
          let insertEl = podcastTitleGridBox.childNodes[0];
          insertEl.appendChild(divContainer);  // insert at the end
          insertEl.style.overflow = "visible"; // prevent clipping of button

          // when page width < 768px, apply this style to maintain button's vertical alignment 
          const smallWidthStyle = document.createElement("style");
          smallWidthStyle.textContent = 
            `@media (max-width: 768px) {
              [id^='${histButtonID}'] {
                top: 3% !important;
              }
            }`;
          document.head.appendChild(smallWidthStyle);
      } 
      else {
      } 

      // button click listener
      button.addEventListener("click", async (event) => {
          event.stopPropagation();
          grabEntryDataAndSendHist(event.target);
      });
    })

  }


  // Function to observe and wait until DOM mutation activity
  // dies down, then check for left controls and inject button
  function observeDOM(){
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    let debounceTimerId, debounceDuration = 300;

    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimerId);
      // wait until mutations die down to check for controls
      debounceTimerId = setTimeout(() => {
        if (shouldInject(controlsSelector, buttonID)) {
          createButton();
        }
        // history page - check if there are history elements
        histElementsArray = document.querySelectorAll(histContainerSelector);
        if (shouldInjectHist(histElementsArray)) {
          createHistPageBtns(histElementsArray); 
        }
      }, debounceDuration);
    });

    observer.observe(targetNode, config);
    if (shouldInject(controlsSelector, buttonID)) {
      createButton();
    }
    // history page - check if there are history elements
    histElementsArray = document.querySelectorAll(histContainerSelector);
    if (shouldInjectHist(histElementsArray)) {
      createHistPageBtns(histElementsArray); 
    }
  }

  createButton();
  observeDOM();
    
  // Handle Single Page Application (SPA) navigation
  // Listen for history changes to re-inject the button on new track loads
  // every second check if url has changed. If so, create new buttons 
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (shouldInject(controlsSelector, buttonID)) {
        createButton();
      }
      // history page
      if (shouldInjectHist(histElementsArray)){
        createHistPageBtns(histElementsArray);
      }
    }
  }, 1000);
};
