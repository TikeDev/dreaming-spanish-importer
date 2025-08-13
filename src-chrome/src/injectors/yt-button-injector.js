
window.onload = function () {
  console.log("[Dreaming Languages Importer] Injecting button...");

  let controlsSelector = ".ytp-right-controls"; // element to ultimately inject button into
  let buttonID = "dreaming-spanish-np-button";  // DS button ID
  let buttonSelector = `#${buttonID}`;          // DS button selector
  let adShowingSelector = ".ad-showing, .ad-interrupting";        // when ad is playing

  // history page
  let histContainerSelector = "#byline-container";   // element to ultimately inject history button into
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

  // convert hh:mm:ss, mm:ss, or :ss string to seconds
  function timeStrToSeconds(timeStr) {
    const parts = timeStr.trim().split(':').map(Number);
    return parts.length === 3
      ? parts[0]*3600 + parts[1]*60 + parts[2]
      : parts.length === 2
      ? parts[0]*60 + parts[1]
      : parts[0];
  }

  // get time in seconds from youtube video link
  function getTimeWatchedFromUrl(videoUrl){
    let timeWatched = parseInt(videoUrl.split("&t=")[1])
    console.log("timeWatched from url:" +timeWatched);
    return timeWatched;
  }

  // check if correct URL, no ads playing, and ready to inject button to relevant container element
  function shouldInject(containerSel, buttonId) {
    const container = document.querySelector(containerSel);
    const buttonExists = document.getElementById(buttonId);

    return (location.pathname.startsWith('/watch') && container && !buttonExists);
  }

  // history page - check to see if right URL and if there are still list buttons left to inject
  function shouldInjectHist(elementsArray) {
    const histButtonsExists = document.querySelector(`[id^='${histButtonID}-${elementsArray.length-1}']`);

    return (
      location.pathname.startsWith('/feed/history')
      && elementsArray 
      && !histButtonsExists
    )          
  }

  // Date object to YYYY-MM-DD
  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");  // Months are 0-indexed
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // get date from the day listed
  function ytWatchedDayToDateString(label, locale = 'en') {
    const now = new Date();

    // Normalize strings by lowercasing, removing accents, dots, trimming
    function normalizeKey(str) {
      return str
        .toLowerCase()
        .normalize("NFD")                // decompose accents
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/\./g, "")              // remove dots
        .trim();
    }

    const normalize = str => str.toLowerCase().replace(/[,’‘´`]/g, "'").trim();
    const lower = normalize(label);

    // mappings
    const relativeDates = {
      en: { "today": 0, "yesterday": 1 },
      es: { "hoy": 0, "ayer": 1 },
      fr: { "aujourd'hui": 0, "hier": 1 },
      pt: { "hoje": 0, "ontem": 1 }
    };

    const weekdays = {
      en: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
      fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
      pt: ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]
    };

    const months = {
      en: { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 },
      es: { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 },
      fr: {
        janvier: 0, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5, juillet: 6, aout: 7, septembre: 8, octobre: 9, novembre: 10, decembre: 11,
        jan: 0, fev: 1, mar: 2, avr: 3, mai: 4, jun: 5, jul: 6, aou: 7, sep: 8, oct: 9, nov: 10, dec: 11
      },
      pt: {
        janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5, julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
        jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11
      }
    };


    // Check relative days ("today", "yesterday")
    const rel = relativeDates[locale];
    if (rel && lower in rel) {
      const daysAgo = rel[lower];
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
    }

    // Check weekdays ("monday", "lunes"..)
    const weekdayList = weekdays[locale];
    const weekdayIndex = weekdayList.indexOf(lower);
    if (weekdayIndex !== -1) {
      const todayIndex = now.getDay();
      let daysAgo = (todayIndex - weekdayIndex + 7) % 7;
      if (daysAgo === 0) daysAgo = 7;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
    }

    const localeMonths = months[locale];
    if (!localeMonths) return null;

    let day, month, year = now.getFullYear();

    // formatting based on locale
    if (locale === 'pt') {
      // Portuguese: "16 de jun." or "14 de jun. de 2018"
      // remove 'de' tokens and dots in months
      const parts = lower.split(' ').filter(p => p !== 'de');
      if (parts.length >= 2) {
        day = parseInt(parts[0]);
        const monthKey = normalizeKey(parts[1]);
        month = localeMonths[monthKey];
        if (parts[2]) year = parseInt(parts[2]);
      }
    } 
    else if (locale === 'fr') {
      // French: "20 juin" or "14 juin 2018"
      // day + month + optional year
      const parts = lower.split(' ');
      if (parts.length >= 2) {
        day = parseInt(parts[0]);
        let monthKey = normalizeKey(parts[1]);
        month = localeMonths[monthKey];
        if (!month && parts[1].length > 3) {
          // fallback: try first 3 letters normalized
          month = localeMonths[normalizeKey(parts[1].slice(0, 3))];
        }
        if (parts[2]) year = parseInt(parts[2]);
      }
    } 
    else {
      // English, Spanish, or fallback: day month year or month day year
      const parts = lower.split(" ");
      if (parts.length < 2) return null;
      if (!isNaN(parts[0])) {
        day = parseInt(parts[0]);
        month = localeMonths[normalizeKey(parts[1].slice(0, 3))];
        if (parts[2]) year = parseInt(parts[2]);
      } else {
        month = localeMonths[normalizeKey(parts[0].slice(0, 3))];
        day = parseInt(parts[1]);
        if (parts[2]) year = parseInt(parts[2]);
      }
    }

    if (day != null && month != null && !isNaN(day) && !isNaN(month)) {
      return new Date(year, month, day);
    }

    return null;
  }

  function grabEntryDataAndSend(button){
    const video = document.querySelector("video");
    if (!video) {
      return;
    }

    //DURATION - Get the current time watched from YouTube player video element
    let duration = Math.floor(video.currentTime / 60); // Convert to minutes
    console.log("[YOUTUBE] VIDEO DURATION: " + duration + " min");

    // URL - Get the current tab's URL
    let tabUrl = window.location.href;
    console.log("[YOUTUBE] VIDEO URL: " + tabUrl);

    
    // TITLE - Retrieve the video title
    let title = "Untitled";
    const titleElement = document.querySelector("#above-the-fold #title");
    title = "Untitled Video"; // Default title if not found
    if (titleElement) {
      // Original title with \n and extra spaces
      let rawTitle = titleElement.textContent.trim();

      // Clean the title by replacing multiple whitespace characters with a single space
      let cleanTitle = rawTitle.replace(/\s+/g, " ");

      title = cleanTitle;
    } else {
    }
    console.log("[YOUTUBE] VIDEO TITLE: " + title);

      // AUTHOR - Get the channel name
    let author = "Unknown Author";
    const authorElement = document.querySelector("yt-formatted-string.ytd-channel-name");
    if (authorElement) {
      author = authorElement.innerText;
    }
    console.log("[YOUTUBE] VIDEO AUTHOR: " + author);


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

  function grabEntryDataAndSendHist(button){
    let closestAncestor = button.closest('#dismissible');
    
    // DATE - walk up the DOM to find the day title
    let daySectionElement = closestAncestor.closest("ytd-item-section-renderer.ytd-section-list-renderer");
    let dayTitleElement = daySectionElement.querySelector("div#title.style-scope.ytd-item-section-header-renderer");
    let ytDayWatched = dayTitleElement.textContent.trim();  // Ex. "Today" "Tuesday" "Jun 23" or "23 Jun"

    let locale = document.head.querySelector('link[rel="search"]').href.split("?locale=")[1]; // "en_US", "en_GB", "es_MX"...
    let dayWatched = ytWatchedDayToDateString(ytDayWatched, locale.split("_")[0]);
    dayWatched = formatDate(dayWatched);  // YYYY-MM-DD

    console.log("DAY WATCHED: " + dayWatched);

    // TITLE - Retrieve the video title
    let title = "Untitled";
    const titleElement = closestAncestor.querySelector("#video-title");
    title = "Untitled Video"; // Default title if not found
    if (titleElement) {
      // Original title with \n and extra spaces
      let rawTitle = titleElement.textContent.trim();
      // Clean the title by replacing multiple whitespace characters with a single space
      let cleanTitle = rawTitle.replace(/\s+/g, " ");
      title = cleanTitle;
    }
    console.log("[YOUTUBE] VIDEO TITLE: " + title);


    // URL - Get video URL from link
    let entryUrl = titleElement.href;
    console.log("[YOUTUBE] VIDEO URL: " + entryUrl);


    //DURATION - get time watched so far from url's &t= param (if present)
    let duration = parseInt(getTimeWatchedFromUrl(entryUrl) / 60); //seconds -> min

    if (!duration){ // fallback = get video duration from YouTube player progress bar width    
      let timeEl = closestAncestor.querySelector("#time-status");
      let durationText = timeEl.textContent.trim();
      let progressBarEl = closestAncestor.querySelector('#progress');
      const watchedPercent = progressBarEl ? parseFloat(progressBarEl.style.width) : null;
      if (durationText && watchedPercent != null) {
        const totalSec =  timeStrToSeconds(durationText);
        duration = parseInt((totalSec * watchedPercent) / 100 / 60); // watched so far in minutes
      }
    }
    console.log("[YOUTUBE] VIDEO DURATION: " + duration + " min");


    // Get the content creator's name
    let author = "Unknown Author";
    const authorElement = closestAncestor.querySelector("#text-container.style-scope.ytd-channel-name");
    if (authorElement) {
      author = authorElement.textContent.trim();
    }
    console.log("[YOUTUBE] VIDEO AUTHOR: " + author);


    // Send message to the background script with the video duration, title, and tab URL
      chrome.runtime.sendMessage(
      {
        action: "openDreamingSpanish",
        duration: (duration || 1),  // can't submit 0 min, default 1 min
        activity: "watching",  
        tabUrl: entryUrl,
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

    // Style the img to be rounded and fit within the button
    img.style.borderRadius = "50%"; // Makes the image rounded
    img.style.display = "block";
    img.style.marginLeft = "10px";
    img.style.marginRight = "14px";
    img.style.width = "24px";
    img.style.height = "24px";

    // Style the button to blend with YouTube's controls
    button.style.background = "transparent"; // Transparent background
    button.style.border = "none"; // No border
    button.style.cursor = "pointer"; // Pointer cursor on hover
    button.style.padding = "0"; // Remove default padding
    //button.style.marginLeft = "8px"; // Space between buttons
    button.style.outline = "none"; // Remove focus outline
    button.style.opacity = "1";
    button.style.transition = ".05s cubic-bezier(0,0,.2,1)";

    // Append img to the button
    button.appendChild(img);
    addHoverEffect(button);

    // hide button if ad is playing
    const adShowing = document.querySelector(adShowingSelector);        
    button.style.display = adShowing ? "none" : "block";

    // Append the button to the controls strip
    controls.style.display = "flex";
    controls.insertBefore(button, controls.firstChild); // Insert at the beginning

    // Playback controls button click event handler
    button.addEventListener("click", async (event) => {
      grabEntryDataAndSend(button);
     });
  }

  // Create and inject a button for each video listed on page
  function createHistPageBtns(histElements){
    if (!histElements || !histElements.length) return;

    histElements.forEach((histElement, i) => {
      let closestAncestor = histElement.closest('#dismissible');
      let isShort = closestAncestor.querySelector('[href^="/shorts/"]');
      if (isShort || histElement.querySelector(`[id^='${histButtonID}']`)) // prevent duplicates and youtube shorts
        return;

      // Create the button element(s)
      const button = document.createElement("button");
      button.id = `${histButtonID}-${i}`; // Assign a unique ID

      // Create the img element
      const img = document.createElement("img");
      img.src = chrome.runtime.getURL("images/dreamingplus.png"); // Reference the image
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
        grabEntryDataAndSendHist(event.target);
      });
    })

  }

  // watch for appearance of playback ctrl strip in DOM
  // Function to observe DOM changes and inject the button when playback ctrl strip is available
  function observeDOM() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    let lastExecutionTime = 0;
    const timeout = 800;

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
          
          // hide button if ad is playing
          const button = document.getElementById(buttonID);
          if (button){
            const adShowing = document.querySelector(adShowingSelector);        
            button.style.display = adShowing ? "none" : "block";
          }

          // check if good to inject
          if (shouldInject(controlsSelector, buttonID)) {
            createButton();
          }

          // history page - check if there are history elements
          histElementsArray = document.querySelectorAll(histContainerSelector);
          if (shouldInjectHist(histElementsArray)) {
            createHistPageBtns(histElementsArray); 
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
