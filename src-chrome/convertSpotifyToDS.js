// Takes requested spotify account's listening history data (json) 
// coverts to more usable/readable Dreaming Spanish-friendly data
// (Ex. https://www.spotify.com/us/account/privacy/)


var spotifyDataAsJson, filterMinData = true, minMinutesFilter = 0;
var inputFileName = './OGStreamingHistory_podcast_0.json'

minMinutesFilter=5; // optional: entries w shorter durations will be excluded in final output 

// Load spotify json
async function loadSpotifyData(filename) {
  const data = require(filename);
  if (!data){
    console.log("NO FILE OPENED!");
  }

  spotifyDataAsJson = data;
}

// Filter and make spotify json more usable
function makeSpotifyDataReadable(){
    if (filterMinData){ // filter data based on duration
      spotifyDataAsJson = spotifyDataAsJson.filter(
        jsonObj => jsonObj["msPlayed"] > (minMinutesFilter*1000*60)
      )
    }

  spotifyDataAsJson.map(jsonObj => { //replace msPlayed w readable variable
    var totalMin = Math.floor(jsonObj["msPlayed"] / 1000 / 60);
    jsonObj["totalMinPlayed"] = totalMin;
    delete jsonObj["msPlayed"];
    // Split date and time to different properties
    var dateTime = jsonObj["endTime"].split(" ");
    var date = dateTime[0], time = dateTime[1];
    jsonObj["endTime"] = time;
    jsonObj["date"] = date;

  });
}

function convertJsonToCsv() {
  const headers = Object.keys(spotifyDataAsJson[0]);
  const csvRows = spotifyDataAsJson.map(row =>
    headers.map(header => row[header]).join("\t")
  );
  const csvString = [headers.join("\t"), ...csvRows].join("\n");
  return csvString;
}

function saveProcessedSpotifyData(){
  const fs = require('node:fs');

  fs.writeFile('saveProcessedSpotifyData.csv', processedSpotifyData, (err) => {
     if (err) {
       console.error('Error writing file:', err);
     } else {
       console.log('File saved successfully!');
     }
  });  
}

///////////////////
loadSpotifyData(inputFileName);
makeSpotifyDataReadable();
var processedSpotifyData = convertJsonToCsv();
saveProcessedSpotifyData();
