console.log("[Dreaming Spanish Helper] Injecting button...");

window.onload = function () {
  let listContainerSelector = "#byline-container";  // element to ultimately inject button into
  let listButtonID = "dreaming-spanish-list-button"; // DS button ID
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

  // check to see if right URL and if there are still list buttons left to inject
  function shouldInjectList(elementsArray) {
    const listButtonsExists = document.querySelector(`[id^='${listButtonID}-${elementsArray.length-1}']`);

    return (
      location.pathname.startsWith('/feed/history')
      && elementsArray 
      && !listButtonsExists
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
    const lower = label.toLowerCase().replace(",", "").trim();

    // Relative days mapping per locale
    const relativeDates = {
      en: { today: 0, yesterday: 1 },
      es: { hoy: 0, ayer: 1 }
    };

    const weekdays = {
      en: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    };

    const months = {
      en: {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      },
      es: {
        ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
        jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11
      }
    };

    const rel = relativeDates[locale];
    if (rel && lower in rel) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - rel[lower]);
    }

    const weekdayList = weekdays[locale];
    const weekdayIndex = weekdayList.indexOf(lower);
    if (weekdayIndex !== -1) {
      const todayIndex = now.getDay();
      let daysAgo = (todayIndex - weekdayIndex + 7) % 7;
      if (daysAgo === 0) daysAgo = 7;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
    }

    // Split label into parts
    const parts = lower.split(" ");
    if (parts.length < 2) return null;

    const localeMonths = months[locale];

    // Handle both "Jun 23" and "23 Jun"
    let day, month, year = now.getFullYear();

    // Case: "23 Jun" or "23 Jun 2018"
    if (!isNaN(parts[0])) {
      day = parseInt(parts[0]);
      month = localeMonths[parts[1].slice(0, 3)];
      if (parts[2]) year = parseInt(parts[2]);
    }
    else {
      month = localeMonths[parts[0].slice(0, 3)];
      day = parseInt(parts[1]);
      if (parts[2]) year = parseInt(parts[2]);
    }

    if (day != null && month != null) {
      return new Date(year, month, day);
    }

    return null;
  }

  function grabEntryDataAndSend(button){
    let closestAncestor = button.closest('#dismissible');
    
    // DATE - walk up the DOM to find the day title
    let daySectionElement = closestAncestor.closest("ytd-item-section-renderer.ytd-section-list-renderer");
    let dayTitleElement = daySectionElement.querySelector("div#title.style-scope.ytd-item-section-header-renderer");
    let ytDayWatched = dayTitleElement.textContent.trim();  // Ex. "Today" "Tuesday" "Jun 23" or "23 Jun"

    let locale = document.head.querySelector('link[rel="search"]').href.split("?locale=")[1]; // "en_US", "en_GB", "es_MX"...
    let dayWatched = ytWatchedDayToDateString(ytDayWatched, locale.split("_")[0]);
    dayWatched = formatDate(dayWatched);  // YYYY-MM-DD


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
        videoDuration: duration,  // in minutes
        tabUrl: entryUrl,
        title: title,
        author: author,
      },
      (response) => {}
    );
   }

  // Create and inject a button for each video listed on page
  function createHistPageBtns(histElements){
    if (!histElements || !histElements.length) return;

    histElements.forEach((histElement, i) => {
      if (histElement.querySelector(`[id^='${listButtonID}']`)) // prevent duplicates
        return;

      // Create the button element(s)
      const button = document.createElement("button");
      button.id = `${listButtonID}-${i}`; // Assign a unique ID

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

  // Observe DOM changes and inject the button when video history elements are available
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
          histElementsArray = document.querySelectorAll(listContainerSelector);
          if (shouldInjectList(histElementsArray)) {
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
      if (shouldInjectList(histElementsArray)){
        createHistPageBtns(histElementsArray);
      }
    }
  }, 1000); 


};
