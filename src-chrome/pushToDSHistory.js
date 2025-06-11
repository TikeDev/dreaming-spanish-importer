//Opened CSV file
// DATA AND ARRAYS
var csvFileData, externalTimeData, DSHistoryData, testObj;

//BUTTONS and DISPLAY///////////////////////////////
const fileInputBtn = document.getElementById('file_input');
const fileNameDsply = document.getElementById('file_name');
//fileNameDsply.disabled = true;
const fileLoadBtn = document.getElementById('file_load');
const fileImportBtn = document.getElementById('file_import');
const fileExportBtn = document.getElementById('file_export');
const fileExportPOSTBtn = document.getElementById('file_export_POST');
const getExternalTimeGETBtn = document.getElementById('external_time_GET');
const getDSOnlyHistGETBtn = document.getElementById('DS_only_hist_GET');


const pickerOpts = {
  types: [
    {
      description: "CSV",
      accept: {
        "text/csv": [".csv"],
      },
    },
  ],
  excludeAcceptAllOption: true,
  multiple: false
};
  //{date,endTime,podcastName,episodeName,totalMinPlayed}
let histTable;

function minutesToSec(numMinutes){
  return numMinutes * 60
}
function secondsToMin(numSeconds){
  return Math.floor(numSeconds / 60)
}

// Optional: Trigger DataTables initialization after doc ready
$(document).ready( function () {
  histTable = $('#hist-table').DataTable({
    columns: [ //col data to enable adding objects as rows
      { data: 'date' },
      { data: 'endTime' },
      { data: 'podcastName' },
      { data: 'episodeName' },
      { data: 'totalMinPlayed', 
        render: function(data){ // expects minutes, display ex. "1h 3m"
          return Math.floor(data / 60) + "h " + (data % 60) + "m";
        }
      }
    ],
    columnDefs: [ // remove third click for column sorting
    { orderSequence: ['asc','desc'], targets: "_all" },
    ],
    colReorder: true,
    fixedHeader: true,
    layout: {
      top2Start: 'pageLength',
      top2: {
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print'] //export buttons
      },//'search',
      topStart: 'info',
      topEnd: 'search',
      top2End: null, //'paging',
      
      bottomStart: null, //'pageLength',
      bottomEnd: null, //'search',
      bottom2Start: 'info',
      bottom2End: 'paging'
    },   
  /*
            {
      topEnd: {
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
      },
      top: 'search',
      top2Start: 'info'
    },     */     
    lengthMenu: [10, 25, 50, 100, -1], //custom show length options per page
    order: [[0, 'asc']],
    scrollX: true,
    select: "multi+shift",
    retrieve: true
  });
    
} ); // ...


//---MIN AND MAX DATE PICKER LOGIC
let minDate, maxDate;
 
// Custom filtering function which will search data in column four between two values
DataTable.ext.search.push(function (settings, data, dataIndex) {
  let min = minDate.val();
  let max = maxDate.val();
  let date = new Date(data[0]);

  if (
    (min === null && max === null) ||
    (min === null && date <= max) ||
    (min <= date && max === null) ||
    (min <= date && date <= max)
  ) {
      return true;
  }
  return false;
});
 
// Create date inputs
minDate = new DateTime('#min', {
  buttons: {
      today: true,
      //clear: true
  },
  format: 'MMMM Do YYYY'
});
maxDate = new DateTime('#max', {
  buttons: {
      today: true,
      //clear: true
  },
  format: 'MMMM Do YYYY'
});

// Refilter the table
document.querySelectorAll('#min, #max').forEach((el) => {
    el.addEventListener('change', () => table.draw());
}); 





//FUNCTIONS///////////////////////////////////////////
// file open and update filename display
async function openCSVFile(pickerOpts) {
  let [fileHandle] = await window.showOpenFilePicker(pickerOpts);
  if (fileHandle.name.split(".")[1] != "csv"){
    alert("Please open a .csv file!");
    return
  }
  csvFileData = await fileHandle.getFile();
  fileNameDsply.innerText = csvFileData.name;// + "# of entries";
}

// Open file picker and return file text
async function extractCSVFileText(fileData) {
  let fileText = await fileData.text();
  if (fileText)
    console.log("CSV FILE LOADED");
  else{
    console.log("NO CSV FILE LOADED");
    return
  }
  var csvAsArray = parseCSVTextToArray(fileText);
  if (!csvAsArray){
    console.log("CSV FILE NOT PARSED TO ARRAY");
    return
  }
  console.log("CSV FILE PARSED TO ARRAY");
  var jsonObj = convertCSVTextToJSON(csvAsArray);
  if (!jsonObj){
    console.log("CSV NOT CONVERTED TO JSON");
    return
  }
  console.log("TEST OBJ POPULATED")
  testObj= jsonObj[0];
  buildTableDisplay(jsonObj);
}

// Parse csv string to return arrays of data
function parseCSVTextToArray(csvString){
  //Split the array into rows
  return csvString.split('\n').map(row => {
    return row
  })
}

// convert rows of CSV text data to json objects
function convertCSVTextToJSON(csvAsArray){
  if (!csvAsArray)
    return false;

  // split cvs by delimiter (tab '\t')
  var jsonObj = [];
  var headers = csvAsArray[0].split('\t');  //first csv row is the headers
  for(var i = 1; i < csvAsArray.length; i++) {
    var data = csvAsArray[i].split('\t');
    if (data.length<2) //if empty line/incomplete data
      continue
    var obj = {};
    for(var j = 0; j < data.length; j++) {
      obj[headers[j]] = data[j];
    }
    jsonObj.push(obj);
  }
  JSON.stringify(jsonObj);
  return jsonObj;
}

// build/update DataTable from loaded data and display
function buildTableDisplay(jsonObj){
  const histTableBody = $('#hist-table').DataTable();
  histTableBody.clear();
  //{date,endTime,podcastName,episodeName,totalMinPlayed}
  for(var i = 0; i<jsonObj.length; i++){
/*     var row = `
              <tr>
               <td>${jsonObj[i].date}</td>
               <td>${jsonObj[i].endTime}</td>
               <td>${jsonObj[i].podcastName}</td>
               <td>${jsonObj[i].episodeName}</td>
               <td>${jsonObj[i].totalMinPlayed}</td>
               <td>${jsonObj[i].totalHrsPlayed}</td>
               <td><input class="form-check-input" type="checkbox" value="" id="flexCheckDefault"></td>
              </tr>
               `
 */    //histTableBody.innerHTML += row;
    var row = jsonObj[i];
    
    histTableBody.row.add(row);

    //histTableBody.row.add(["2025-01-01",	"01:21",	"Learn Spanish and Go",	"Un Vistazo al 2024 - A Glance at 2024",	"8",	"0.13",	"False"]);
    //histTableBody.row.add({date:"2025-01-01",	endTime:"01:21",	podcastName:"Learn Spanish and Go",	episodeName:"Un Vistazo al 2024 - A Glance at 2024",	totalMinPlayed:"8",	totalHrsPlayed:"0.13",	importToDS:"False"});
  }
  histTableBody.draw();
  return true
}

function isEmptyDSEntry(data){
  var compare = (
    data.timeSeconds == 0 &&
    data.description == "" &&
    data.type == "watching" &&
    data.date == "1970-01-01"
  );
  return compare
}

// from DS =  {date,description,timeSeconds,type}
// to display {date,endTime,podcastName,episodeName,totalMinPlayed}
async function convertDSToDisplayData(dsData){
  var displayData = [];
  dsData.forEach(obj => {
    // filter out header/empty entries into new array
    if (!Object.values(obj).includes("__empty__") && !isEmptyDSEntry(obj)){
      var row = {
        date:obj.date,
        endTime:"-",
        podcastName:obj.description,
        episodeName:"-",
        totalMinPlayed:(secondsToMin(obj.timeSeconds))
      };
      displayData.push(row);   
    }
  })
  return displayData;  
}


// sent info to background to pass on to new DS tab
function sendToDSUserSim(){
   // COMMUNICATION
  chrome.runtime.sendMessage(
    {
      action: "openDreamingSpanish",
      videoDuration: testObj['totalMinPlayed'],
      tabUrl: "Spotify",
      title: testObj['podcastName'] + "--" + testObj['episodeName'],
    },
    (response) => {
      if (!chrome.runtime.lastError) {
        // if you have any response
        console.log("Response")
      } 
      else {
          // if you don't have any response it's ok but you should actually handle
          // it and we are doing this when we are examining chrome.runtime.lastError
          console.log("NO response")
      }
    }  
  );
}


// send HTTP requests to background to pass on to DS site
async function sendHTTPRequestToDS(requestType, endPoint, jsonDSData = []){
   // COMMUNICATION
  chrome.runtime.sendMessage(
    {
      action: "DSHTTPRequest",
      requestType: requestType,
      endPoint: endPoint,
      jsonEntries: jsonDSData
    },
    (response) => { // if you have any response
      if (!chrome.runtime.lastError) {        
        console.log("Response from background: ", response);

        if (endPoint == "externalTime"){
          convertDSToDisplayData(response.externalTimes).then(
            (data) => buildTableDisplay(data)
          );
        }
        return true;
      } 
      else {
        // if you don't have any response it's ok but you should actually handle
        // it and we are doing this when we are examining chrome.runtime.lastError
        console.log("NO response from background")
      }
    }  
  );
  return true
}




//BUTTON LISTENERS///////////////////////////////////////////
// File input button
fileInputBtn.addEventListener('click', function(event) {
  openCSVFile(pickerOpts);
  //fileNameDsply.disabled = false;    
});

// File load button, display info
fileLoadBtn.addEventListener('click', function(event) {
  if (fileNameDsply.textContent && csvFileData) {
    extractCSVFileText(csvFileData);
  } 
  else {
  }
});

// File import button, submit to DS via user input
fileImportBtn.addEventListener('click', function(event) {
  sendToDSUserSim();
});

// File export POST button
fileExportPOSTBtn.addEventListener('click', function(event) {
// from DS = { date:, description:, timeSeconds:, type:}
  var tempJson = [
    {
        date: "2025-06-05",
        description: "Learn Spanish and Go--Un Vistazo al 2024 - A Glance at 2024",
        timeSeconds: 480,
        type: "watching"
    },
    {
        date: "2025-06-04",
        description: "Learn Spanish and Go--Un Vistazo al 2024 - A Glance at 2024",
        timeSeconds: 360,
        type: "listening"
    }
  ]
  sendHTTPRequestToDS("POST",tempJson);
});

// GET externalTime DS button
getExternalTimeGETBtn.addEventListener('click', function(event) {
  sendHTTPRequestToDS("GET", "externalTime");
});

// GET internal DS time only button
getDSOnlyHistGETBtn.addEventListener('click', function(event) {
  sendHTTPRequestToDS("GET", "history");
});


