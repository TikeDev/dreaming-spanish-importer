// background.js

// when background receives openDreamingSpanish message from content script,
// open DS tab and pass along info to time adder

// open main page
  chrome.tabs.create({ url: 'openCSVFile.html' }, function(tab) {
});
 
var bearerToken = 'enter bearer token here'

// POST DS loaded data directly to website
async function postHTTPDSData(jsonObjArray, endPoint){
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
async function deleteHTTPDSData(idToDelete){
  const apiUrl = 'https://www.dreamingspanish.com/.netlify/functions/externalTime';

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + bearerToken
      },
      body: JSON.stringify(idToDelete)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Success:', data);
    return true;
  } 
  catch (error) {
    console.error('Error:', error);
    return null;
  }
  
}



// OPEN DS PAGE SIMULATE USER INPUT
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openDreamingSpanish") {
    const duration = request.videoDuration;
    const tabUrl = request.tabUrl;
    const title = request.title;
    const author = request.author;

    // Open the dreamingspanish.com/progress/time-outside page
    chrome.tabs.create(
      { url: "https://dreamingspanish.com/progress/time-outside" },
      (tab) => {
        // When the new tab is fully loaded, send the video duration to the content script
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === "complete") {
            chrome.tabs.sendMessage(tabId, {
              action: "autofillForm",
              videoDuration: duration,
              tabUrl: tabUrl,
              title: title,
              author: author
            });
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      }
    );
  }
});


// LISTENERS //////////////
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



