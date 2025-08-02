// background.js

// when background receives openDreamingSpanish message from content script,
// open DS tab and pass along info to time adder
//  or...
// when background receives DSHTTPRequest message from content script,
// make HTTP request to DS with info

// get bearer token from Chrome Devtools -> Local Storage -> www.dreamingspanish.com -> token value
const bearerToken = '';  // <-- ENTER BEARER TOKEN HERE 
///////////////////////////////////////////////////////////////////////////////////////////////////

const STORAGE_KEY = 'submissionQueue';
const MAX_PER_SECOND = 2;
const DELAY_MS = 1000 / MAX_PER_SECOND;

let isProcessing = false;

async function loadQueue() {
  const result = await browser.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

async function saveQueue(queue) {
  await browser.storage.local.set({ [STORAGE_KEY]: queue });
}

async function addToQueue(newItems, apiUrl, bearerToken) {
  const queue = await loadQueue();
  const updatedQueue = [...queue, ...newItems];
  await saveQueue(updatedQueue);

  if (!isProcessing) {
    processQueue(apiUrl, bearerToken); // fire and forget
  }
}

async function processQueue(apiUrl, bearerToken) {
  isProcessing = true;
  let queue = await loadQueue();

  while (queue.length > 0) {
    const item = queue[0];

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + bearerToken,
        },
        body: JSON.stringify(item),
      });

      const responseText = await response.text(); // Read response body as text

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      console.log('[HTTP Queue Manager] ✅ SENT!', item);
      console.log('[HTTP Queue Manager] 📬 Response:', responseText);

      queue.shift(); // remove item from queue
      await saveQueue(queue);
    } 
    catch (err) {
      console.warn('[HTTP Queue Manager] ❌ FAILED TO SEND', item, err.message);
      break; // stop processing if request failed
    }

    await new Promise((res) => setTimeout(res, DELAY_MS));
  }

  isProcessing = false;
}

  var tempJson = [
    {
        date: "2025-07-07",
        description: "Learn Spanish and Go--Un Vistazo al 2024 - A Glance at 2024",
        timeSeconds: 480,
        type: "watching"
    },
    {
        date: "2025-07-06",
        description: "Learn Spanish and Go--Un Vistazo al 2024 - A Glance at 2024",
        timeSeconds: 360,
        type: "listening"
    }
  ]
  //postHTTPDSData(tempJson, "externalTime");


// POST DS loaded data directly to website
async function postHTTPDSData(jsonObjArray, endPoint){
  const apiUrl = 'https://www.dreamingspanish.com/.netlify/functions/' + endPoint;
  
  if (!bearerToken){
    console.error("No Bearer Token set!");
  }

  addToQueue(jsonObjArray, apiUrl, bearerToken);  
}

// POST DS loaded data directly to website
/* async function postHTTPDSData(jsonObjArray, endPoint){
  const apiUrl = 'https://www.dreamingspanish.com/.netlify/functions/' + endPoint;

  jsonObjArray.forEach((item) => {
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + bearerToken
      },
      body: JSON.stringify(item)
    })
      .then((response) => response.json())
      .then((data) => {})//console.log('Success:', data))
      .catch((error) => console.error('Error:', error));
  });
  
} */

// GET DS history directly from website
async function getHTTPDSData(endPoint){
  const apiUrl = 'https://www.dreamingspanish.com/.netlify/functions/' + endPoint;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + bearerToken
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Success:', data);
    return data;
  } 
  catch (error) {
    console.error('Error:', error);
    return null;
  }
}

//deleteHTTPDSData({"id":"17522866452620.7092854046029238"})
//deleteHTTPDSData({"id":"17522866460190.32359512340042995"})

// DELETE DS entry directly from website
async function deleteHTTPDSData(idsToDelete){
  const apiUrl = 'https://www.dreamingspanish.com/.netlify/functions/externalTime';

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + bearerToken
      },
      body: JSON.stringify(idsToDelete)
    });

    const responseText = await response.text(); // Read response body as text

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    console.log('[HTTP Queue Manager] ✅ SENT!', item);
    console.log('[HTTP Queue Manager] 📬 Response:', responseText);
    return true;
  } 
  catch (error) {
    console.error('Error:', error);
    return null;
  }
  
}


// MESSAGE LISTENERS ////////////////////////////

// OPEN DS PAGE SIMULATE USER INPUT (to be replaced w HTTP request)
let pendingTabInfo = null;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "DSHTTPRequest") {
    if (request.requestType == "POST") {
      postHTTPDSData(request.jsonEntries, request.endPoint).then(() => {
        sendResponse("");
      });
    } else if (request.requestType == "GET") {
      getHTTPDSData(request.endPoint).then((data) => {
        sendResponse(data);
      });
    } else {
      sendResponse("NO entries to " + request.requestType);
    }
    return true;
  }

  if (request.action === "openImportManager") {
    browser.tabs.create({ url: 'src/openCSVFile.html' });
    return true;
  }

  if (request.action === "openDreamingSpanish") {
    pendingTabInfo = {
      tabId: null,
      duration: request.videoDuration,
      tabUrl: request.tabUrl,
      title: request.title,
      author: request.author,
      extraData: request?.extraData
    };

    browser.tabs.create(
      { url: "https://dreamingspanish.com/progress/time-outside" },
      (tab) => {
        pendingTabInfo.tabId = tab.id;
      }
    );
    return true;
  }

  if (request.action === "dsScriptReady" && sender.tab && pendingTabInfo?.tabId === sender.tab.id) {
    browser.tabs.sendMessage(sender.tab.id, {
      action: "autofillForm",
      videoDuration: pendingTabInfo.duration,
      tabUrl: pendingTabInfo.tabUrl,
      title: pendingTabInfo.title,
      author: pendingTabInfo.author,
      extraData: pendingTabInfo?.extraData
    });
    pendingTabInfo = null;
    return true;
  }
});
