const express = require('express');
const router = express.Router();
const fs = require('fs');

/////////////////////////////////////////////////////////////
////////////////// Global Variables /////////////////////////
/////////////////////////////////////////////////////////////

const dataFolder = './data';
const logDataFile = 'loggedData.csv';
const userDataFile = 'usersdb.json';


/////////////////////////////////////////////////////////////
///////////////////// Helper Functions //////////////////////
/////////////////////////////////////////////////////////////

function arr2csvRow(arr){
    //returns a csv row from an array
    let csvRow = '';
    for(let i=0; i<arr.length; i++){
        csvRow += arr[i];
        if(i != arr.length-1){
            csvRow += ',';
        }
    }
    return csvRow;
}

function csv2json(data){
    //take each row and convert it to an array
    //finally send it in an Object with 3 attributes 
    //attributes are entry_count, labels data
    let rows = data.split('\n');    

    let arr = [];
    let labels = [];
    let entryCount = 0;
    for(let i=0; i<rows.length; i++)
    {
        //set labels
        let toPush = [];
        let row = rows[i].split(',');
        row[row.length-1] = row[row.length-1].replace('\r', ''); //remove the \r from the last element
        if(i==0)
        {
            labels = row;
            toPush = labels; //redundant much?
            continue;
        }
        else{
            let _temp = row;
            _temp.map((val, index) => {
                if(isNaN(val)){
                    _temp[index] = val;
                }
                else{
                    _temp[index] = Number(val);
                }
            });
            toPush = _temp;
            // console.log(`i:${i}`)
            // console.log(arr)
            //console.log(toPush)
            entryCount++;
        }

        arr.push(toPush)
    }

    let obj = {
        labels,
        entryCount,
        data: arr,
    }
    // console.log("Converted data to JSON")
    // console.log(obj);
    return obj;
}

function writeToCSVwithLogData(data){
    //writes a logObject to the csv file

    //In logObject.data each row is a list of values in the csv file
    //In logObject.labels the first row is the labels for the csv file
    //In logObject.entryCount the number of entries in the csv file
    
    // console.log("Bandana")
    // console.log(data)

    let csvFile = `${dataFolder}/${logDataFile}`;
    let csv = '';

    //data is 2D array
    csv += arr2csvRow(data.labels);
    csv += '\n';

    for(let i=0; i<data.entryCount; i++){
        csv += arr2csvRow(data.data[i]);
        if(i != data.entryCount-1)
            csv += '\n';
    }

    // console.log("CSV is")
    // console.log(csv)

    fs.writeFileSync(csvFile, csv);
}

function fetchUserData(){
    //to be called at start up to set the user data
    //returns an object with the user data

    //replace this with DB call in later versions
    let userData = fs.readFileSync(`${dataFolder}/${userDataFile}`);
    // console.log(JSON.parse(userData));
    return JSON.parse(userData);
}

function fetchLogData(){
    //to be called at start up to set the device data
    //returns an object with the device data
    //replace this with DB call in later versions
    let deviceData = fs.readFileSync(`${dataFolder}/${logDataFile}`).toString();
    return csv2json(deviceData);
}

function isValid(data){
    //assuming data is valid from the start...
    //ToDo: Add validation for data
    //DocTag :: A validation function must be implemented based on if the values appear to be corrupted or not in the future.
    //DocTag :: Update this to reflect a SQL insert query in the future
    //DeviceID,TimeStamp,Voltage,Current,PowerW,EnergyWH,Frequency,PowerFactor

    let {DeviceID,TimeStamp,Voltage,Current,PowerW,EnergyWH,Frequency,PowerFactor} = data;
    let _t = [DeviceID,TimeStamp,Voltage,Current,PowerW,EnergyWH,Frequency,PowerFactor];
    for(let attr of _t){
        if(attr === undefined || attr === null){
            return false;
        }
    }

    return true;
}

function updateLogData(newLog){
    //adds a new entry to the log data
    //logData will be an object of values 
    //used in post request to add new data
    let logData = fetchLogData();
    // console.log("fetched data")
    // console.log(logData)

    //get the last log id
    let lastLogId = logData.entryCount
    
    //create a new log with the new log id
    let newLogWithLogId = [lastLogId+1, newLog.DeviceID ,newLog.TimeStamp, newLog.Voltage, newLog.Current, newLog.PowerW, newLog.EnergyWH, newLog.Frequency, newLog.PowerFactor];
    logData.data.push(newLogWithLogId);
    logData.entryCount += 1;
    //write the updated logData to the csv file
    //return;
    writeToCSVwithLogData(logData);
    
    return logData;
}

/////////////////////////////////////////////////////////////
/////////////////////// Routes //////////////////////////////
/////////////////////////////////////////////////////////////

router.get('/', (req, res) => {
    res.send('Household root.');
    }
);

router.get('/test', (req, res) => {
    res.send('Household test.');
    }
);

router.get('/log-data/:deviceID', (req, res) => {
    /*
        param: deviceID
        headers: password
        response: 200 OK, 404 Not Found, 401 Unauthorized
    */

    console.log(`${req.params.deviceID} requested for its data`)

    let logData = fetchLogData();
    let userData = fetchUserData();

    let deviceID = req.params.deviceID;

    //validate if node/user/device exists
    if (!userData[deviceID]){
        res.status(404).send('Not Found');
        return;
    }

    let headers = req.headers;
    let password = headers['password'];

    //validate password
    // console.log(`Received password: ${password}`)
    // console.log(`Expected password: ${userData[deviceID].password}`)

    if (password != userData[deviceID].password){
        res.status(401).send('Unauthorized');
        return;
    }

    //send the data --> Sends All Data
    console.log("Sending device data")
    res.send(JSON.stringify(logData.data));
    
});

router.post('/log-data/:deviceID', (req, res) => {
    /*
        param: deviceID
        headers: password
        response: 200 OK, 404 Not Found, 401 Unauthorized
    */

    //LaterVersion: Add a check for the user's device

    console.log(`${req.params.deviceID} requested to log some data`)
    
    let userData = fetchUserData();
    let deviceID = req.params.deviceID;

    //validate if node/user/device exists
    if (!userData[deviceID]){
        res.status(404).send('Not Found');
        return;
    }

    let headers = req.headers;
    // console.log("headers: ")
    // console.log(headers)

    let password = headers.password;


    if (password != userData[deviceID].password){
        // console.log("TroubleShootLog")
        // console.log(password)
        // console.log(userData[deviceID].password)

        res.status(401).send('Unauthorized');
        return;
    }

    //get the newLog
    let newLog = req.body;
    //newLog.TimeStamp = dateStrToEpoch(newLog.TimeStamp);

    if(isValid(newLog)){
        updateLogData(newLog);
        res.status(200).send('Data logged successfully');
    }
    else{
        res.status(400).send('Bad Request');
    }
});

router.get('/log-data/ranged/:deviceID/:epochStart/:epochEnd', (req, res) => {
    /*
        param: deviceID, epochStart, epochEnd
        headers: password
        response: 200 OK, 404 Not Found, 401 Unauthorized
    */

    let logData = fetchLogData();
    let userData = fetchUserData();

    let deviceID = req.params.deviceID;
    let epochStart = req.params.epochStart;
    let epochEnd = req.params.epochEnd;

    //validate if node/user/device exists
    if (!userData[deviceID]){
        res.status(404).send('Not Found');
        return;
    }

    let headers = req.headers;
    let password = headers['password'];

    //validate password
    // console.log(`Received password: ${password}`)
    // console.log(`Expected password: ${userData[deviceID].password}`)

    if (password != userData[deviceID].password){
        res.status(401).send('Unauthorized');
        return;
    }

    //send the data --> Sends All Data
    console.log("Sending device data")
    //parse the epoch values to numbers
    //ToDo: Add validation for epoch values for float and negative values

    epochStart = Number(epochStart);
    epochEnd = Number(epochEnd);

    console.log(`The starting day is ${new Date(epochStart).toDateString()} and the ending day is ${new Date(epochEnd).toDateString()}`)

    if(isNaN(epochStart) || isNaN(epochEnd) || epochStart > epochEnd || epochStart < 0 || epochEnd < 0 ){
        res.status(400).send('Bad Request');
        return;
    }

    let rangedData = logData.data.filter((val) => {
        return val[2] >= epochStart && val[2] <= epochEnd;
    }
    );
    // console.log(rangedData)
    res.send(JSON.stringify(rangedData));
});

router.post('/login/:deviceID', (req, res) => {
    /*
        param: deviceID
        response: 200 OK, 404 Not Found
    */
    console.log(`${req.params.deviceID} requested to login`)

    let userData = fetchUserData();
    let deviceID = req.params.deviceID;
    let password = req.body.password;

    if (!userData[deviceID]){
        res.status(404).send('Not Found');
        return;
    }

    if (password != userData[deviceID].password){
        res.status(401).send('Unauthorized');
        return;
    }

    res.status(200).send('Login Successful');
    console.log("Login Successful for id " + deviceID);
});


module.exports = router;