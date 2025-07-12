// background.js

// when background receives openDreamingSpanish message from content script,
// open DS tab and pass along info to time adder
//  or...
// when background receives DSHTTPRequest message from content script,
// make HTTP request to DS with info

// get bearer token from Chrome Devtools -> Local Storage -> www.dreamingspanish.com -> token value
const bearerToken = '';  // <-- ENTER BEARER TOKEN HERE 
///////////////////////////////////////////////////////////////////////////////////////////////////

// import 
importScripts('httpQueueManager.js');


// POST DS loaded data directly to website
async function postHTTPDSData(jsonObjArray, endPoint){
  const apiUrl = 'https://www.dreamingspanish.com/.netlify/functions/' + endPoint;
  
  if (!bearerToken){
    console.error("No Bearer Token set!");
  }

  addToQueue(jsonObjArray, apiUrl, bearerToken);  
}


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


// Listen for HTTP request message from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "DSHTTPRequest") {
    if (request.requestType == "POST"){
      postHTTPDSData(request.jsonEntries, request.endPoint).then(() => {
        sendResponse(""); // send data back to content script
      });
    }
    else if (request.requestType == "GET"){
      getHTTPDSData(request.endPoint).then((data) => {
        sendResponse(data); // send data back to content script
      })
    }  
  }
  else {
      sendResponse("NO entries to " + request.requestType);
  }

  return true
  
});




// OPEN IMPORT MANAGER
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openImportManager") {
    const type = request.type;

    // Open import manager page
    chrome.tabs.create({ url: 'src/openCSVFile.html' }, function(tab) {
    }); 
  }
});

// OPEN DS PAGE SIMULATE USER INPUT (to be replaced w HTTP request)
let pendingTabInfo = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openDreamingSpanish") {
    const tabInfo = {
      duration: request.videoDuration,
      tabUrl: request.tabUrl,
      title: request.title,
      author: request.author,
      extraData: request?.extraData
    };

    chrome.tabs.create(
      { url: "https://dreamingspanish.com/progress/time-outside" },
      (tab) => {
        // Store tab info to use when content script says it's ready
        pendingTabInfo = { tabId: tab.id, ...tabInfo };
      }
    );
  }

  // handshake with ds-time-adder.js to make sure it's ready before doing anything
  if (request.action === "dsScriptReady" && sender.tab && pendingTabInfo) {
    if (sender.tab.id === pendingTabInfo.tabId) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "autofillForm",
        videoDuration: pendingTabInfo.duration,
        tabUrl: pendingTabInfo.tabUrl,
        title: pendingTabInfo.title,
        author: pendingTabInfo.author,
        extraData: pendingTabInfo?.extraData
      });

      // clear after sending
      pendingTabInfo = null;
    }
  }
});