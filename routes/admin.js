const express = require('express');
const router = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');
const {calculateBill, makeBillingTable} = require('../billing');

/////////////////////////////////////////////////////////////
////////////////// Global Variables /////////////////////////
/////////////////////////////////////////////////////////////

const dataFolder = './data';
const logDataFile = 'loggedData.csv';
const userDataFile = 'usersdb.json';
const adminCredentials = 'adminCreds.json'; //single entry
const secretFile = 'secret.json';

/////////////////////////////////////////////////////////////
///////////////////// Helper Functions //////////////////////
/////////////////////////////////////////////////////////////

function getSecretKey(){
    const secretKey = JSON.parse(fs.readFileSync(secretFile));
    return secretKey;
}

function fetchAdminCredentials(){
    let adminCreds = fs.readFileSync(dataFolder + '/' + adminCredentials);
    return JSON.parse(adminCreds);
}

async function authenticate(req, res) {
    const { username, password } = req.body;
    const adminCreds = fetchAdminCredentials();

    // console.log("Admin creds: ")
    // console.log(adminCreds)
    // console.log(`Shit I got [${username}] [${password}]`)

    if(adminCreds[username] && password == adminCreds[username].password){
        //create a token
        const token = jwt.sign({ username }, getSecretKey().secret, { expiresIn: '24h' });

        let headers = {
            'Content-Type': 'application/json',
        }

        res.send({ message: 'Admin authenticated', token}).status(200);
    }
    else{
        return res.status(401).json({ message: 'Invalid credentials' });
    }
}

function fetchLogData(){
    //to be called at start up to set the device data
    //returns an object with the device data
    //replace this with DB call in later versions
    let deviceData = fs.readFileSync(`${dataFolder}/${logDataFile}`).toString();
    return csv2json(deviceData);
}

function fetchUserData(){
    //to be called at start up to set the user data
    //returns an object with the user data

    //replace this with DB call in later versions
    let userData = fs.readFileSync(`${dataFolder}/${userDataFile}`);
    // console.log(JSON.parse(userData));
    return JSON.parse(userData);
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

function groupEpochsByDay(epochArray) {
    const groupedEpochs = {};

    epochArray.forEach(epoch => {
        // Convert epoch to UTC date string (YYYY-MM-DD format)
        const dateKey = new Date(epoch).toISOString().split('T')[0];

        // Group epochs by the dateKey
        if (!groupedEpochs[dateKey]) {
            groupedEpochs[dateKey] = [];
        }
        groupedEpochs[dateKey].push(epoch);
    });

    // Convert the grouped epochs object to a 2D array
    return Object.values(groupedEpochs);
}

function lookUpLogDataForNodeUsingTimeStamp(logData, timestamp) {
    return logData.find(entry => entry[2] === timestamp);
}

function getMaxDemandForNode(batches, logsForNode) {

    var maxDemandsForEachDay = [];
    var maxDemandEpochsForEachDay = []; 
    console.log(`Number of days: ${batches.length}`)

    for(let dayIndex=0; dayIndex<batches.length; dayIndex++){

        const dayEpochs = batches[dayIndex];

        const logDataForNodeForDay = dayEpochs.map(epoch => {
            return lookUpLogDataForNodeUsingTimeStamp(logsForNode, epoch);
        });

        const maximumPowerEntryPerDay = logDataForNodeForDay.reduce((maxEntry, entry) => {
            return entry[6] > maxEntry[6] ? entry : maxEntry;
        });

        const maxDemandForDay = maximumPowerEntryPerDay[6];
        const EpochForMaxDemandForDay = maximumPowerEntryPerDay[2];

        maxDemandsForEachDay.push(maxDemandForDay);
        maxDemandEpochsForEachDay.push(EpochForMaxDemandForDay);
    }

    maxDemandForBillingCycle = Math.max(...maxDemandsForEachDay)
    let idx = maxDemandsForEachDay.indexOf(maxDemandForBillingCycle);
    
    return {
        "daily-max-demand": maxDemandsForEachDay,
        "daily-max-demand-timestamps": maxDemandEpochsForEachDay,
        "billing-cycle-max-demand": maxDemandForBillingCycle,
        "billing-cycle-max-demand-timestamp": maxDemandEpochsForEachDay[idx]
    };   

    
}

function getRangedData(logData, epochStart, epochEnd){
    let rangedData = logData.data.filter((val) => {
        return val[2] >= epochStart && val[2] <= epochEnd;
    }
    );
    return rangedData;
}

/////////////////////////////////////////////////////////////
/////////////////////// Routes //////////////////////////////
/////////////////////////////////////////////////////////////

/*
    - Only advanced group Fetch operations performed
    - Admin can view all data
*/ 

router.get('/', (req, res) => {
    res.json({ message: 'Admin Page' });
})

router.get('/log-data/:deviceID', (req, res) => {

    console.log(`Admin requested for ${req.params.deviceID} data`)

    let logData = fetchLogData();
    let userData = fetchUserData();

    let deviceID = req.params.deviceID;
    
    //validate if node/user/device exists
    if (!userData[deviceID]){
        res.status(404).send('Not Found');
        return;
    }

    let token = req.headers['x-auth-token'];
    if (!token){
        return res.status(401).send({ auth: false, message: 'No token provided' });
    }

    jwt.verify(token, getSecretKey().secret, (err, decoded) => {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        }
        
        //LaterVersion: Add a check for the user's device
        console.log(logData)
        res.send(JSON.stringify(logData)).status(200);
    });
});

// get ranged data
router.get('/log-data/:deviceID/:start/:end', (req, res) => 
    {
    let logData = fetchLogData();
    let userData = fetchUserData();

    let deviceID = req.params.deviceID;
    
    //validate if node/user/device exists
    if (!userData[deviceID]){
        res.status(404).send('Not Found');
        return;
    }

    let token = req.headers['x-auth-token'];

    if (!token)
        return res.status(401).send({ auth: false, message: 'No token provided' });
    

    jwt.verify(token, getSecretKey().secret, (err, decoded) => {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        }
        
        //get ranged data 
        let epochStart = req.params.start;
        let epochEnd = req.params.end;
        epochStart = Number(epochStart);
        epochEnd = Number(epochEnd);

        console.log(`Epoch start: ${epochStart} Epoch end: ${epochEnd}`)

        if(isNaN(epochStart) || isNaN(epochEnd) || epochStart > epochEnd || epochStart < 0 || epochEnd < 0 ){
            res.status(400).send('Bad Request! Check your start and end times.');
            return;
        }
    
        let rangedData = logData.data.filter((entry) => {
            return entry[2] >= epochStart && entry[2] <= epochEnd && entry[1] == deviceID;
        });

        let rangedDataObj = {
            labels: logData.labels,
            entryCount: rangedData.length,
            data: rangedData
        }

        res.send(JSON.stringify(rangedDataObj)).status(200);
    });
});

// delete a log entry
router.delete('/log-data/:deviceID/:entryID', (req, res) => {
    let logData = fetchLogData();
    let userData = fetchUserData();

    let deviceID = req.params.deviceID;
    
    //validate if node/user/device exists
    if (!userData[deviceID]){
        res.status(404).send('Not Found');
        return;
    }

    let token = req.headers['x-auth-token'];

    if (!token)
        return res.status(401).send({ auth: false, message: 'No token provided' });
    

    jwt.verify(token, getSecretKey().secret, (err, decoded) => {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        }
        
        let entryID = req.params.entryID;
        entryID = Number(entryID);

        if(isNaN(entryID) || entryID < 0){
            res.status(400).send('Bad Request! Check your entry ID.');
            return;
        }

        let entryIndex = -1;
        let entry = logData.data.find((entry, index) => {
            if(entry[0] == entryID){
                entryIndex = index;
                return true;
            }
            return false;
        });

        if(entryIndex == -1){
            res.status(404).send('Entry not found');
            return;
        }

        logData.data.splice(entryIndex, 1);
        fs.writeFileSync(`${dataFolder}/${logDataFile}`, JSON.stringify(logData));
        res.send('Entry deleted').status(200);
    });
});

router.post('/login', (req, res) => {
    authenticate(req, res);
})    

router.get('/max-demand/:deviceID/:start/:end', (req, res) => {
    
    //#region Validation
    let logData = fetchLogData();
    let userData = fetchUserData();

    let deviceID = req.params.deviceID;
    
    //validate if node/user/device exists
    if (!userData[deviceID]){
        res.status(404).send('Not Found');
        return;
    }

    let token = req.headers['x-auth-token'];

    if (!token)
        return res.status(401).send({ auth: false, message: 'No token provided' });
    

    jwt.verify(token, getSecretKey().secret, (err, decoded) => {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        }
        
        //get ranged data 
        let epochStart = req.params.start;
        let epochEnd = req.params.end;

        epochStart = Number(epochStart);
        epochEnd = Number(epochEnd);

        console.log(`Epoch start: ${epochStart} Epoch end: ${epochEnd}`)

        if(isNaN(epochStart) || isNaN(epochEnd) || epochStart > epochEnd || epochStart < 0 || epochEnd < 0 ){
            res.status(400).send('Bad Request! Check your start and end times.');
            return;
        }

        let rangedData = logData.data.filter((entry) => {
            return entry[2] >= epochStart && entry[2] <= epochEnd && entry[1] == deviceID;
        });

        const numberOfEntries = rangedData.length;
        const epochs = rangedData.map(entry => entry[2]);
        const batches = groupEpochsByDay(epochs);

        // we are returning 2 quantities, "daily-max-demand" and "billing-cycle-max-demand"

        const maxDemandObj = getMaxDemandForNode(batches, rangedData);
        
        res.status(200).send(JSON.stringify({...maxDemandObj}));
    });
});

router.get('/bill/:deviceID/:epochStart/:epochEnd', (req, res) => {
    // #region FetchData
    let logData = fetchLogData();
    let userData = fetchUserData();

    let deviceID = req.params.deviceID;
    let epochStart = req.params.epochStart;
    let epochEnd = req.params.epochEnd;
    // #endregion

    //validate if node/user/device exists
    if (!userData[deviceID]){
        res.status(404).send('Not Found');
        return;
    }

    let token = req.headers['x-auth-token'];

    if (!token)
        return res.status(401).send({ auth: false, message: 'No token provided' });

    jwt.verify(token, getSecretKey().secret, (err, decoded) => {

        if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        

        //parse the epoch values to numbers and validate them
        if(isNaN(epochStart) || isNaN(epochEnd) || epochStart > epochEnd || epochStart < 0 || epochEnd < 0 ){
            res.status(400).send('Bad Request');
            return;
        }


        let rangedData = getRangedData(logData, epochStart, epochEnd);

        // filter all data and send only that of deviceID
        let deviceData = rangedData.filter((val) => {
            return val[1] == deviceID;
        });

        // LogID,DeviceID,TimeStamp,Voltage,Current,EnergyWH,PowerW,Frequency,PowerFactor

        var total_units_in_kWh = 0;

        for(let i=0; i<deviceData.length; i++){
            total_units_in_kWh += deviceData[i][6];
        }
        total_units_in_kWh = total_units_in_kWh/1000;

        let bill = calculateBill(total_units_in_kWh);
        let billTable = makeBillingTable(total_units_in_kWh);

        res.send({'units': total_units_in_kWh, bill, billTable});
    });

});



///////////////////////////// V02 ///////////////////////////
/*
    For A Device 
    Ad -> Create a device 
    Ad -> Delete a device
    Ad -> Edit a device
    Ad -> Retrieve a device 
*/

//returns device IDs in database
router.get('/devices', (req, res) => {
    let userData = fetchUserData();
    let token = req.headers['x-auth-token'];

    if (!token)
        return res.status(401).send({ auth: false, message: 'No token provided' });
    
    jwt.verify(token, getSecretKey().secret, (err, decoded) => {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        }
        
        let devices = Object.keys(userData);
        res.send(JSON.stringify(devices)).status(200);
    });
});

router.get('/devices/:deviceId', (req, res) => {
    let userData = fetchUserData();
    let token = req.headers['x-auth-token'];
    let deviceID = req.params.deviceId;

    if (!token)
        return res.status(401).send({ auth: false, message: 'No token provided' });
    
    jwt.verify(token, getSecretKey().secret, (err, decoded) => {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        }
        
        if (!userData[deviceID]){
            res.status(404).send('Device not found');
            return;
        }

    let userDataWithoutPassword = userData[deviceID];
    delete userDataWithoutPassword.password;

    res.send(userDataWithoutPassword).status(200);
    });
});

router.post('/devices', (req, res) => {

    /*
        req.body = {
            deviceID: "1001",
            name: "deviceName",
            password: "password",
        }
    */

    let userData = fetchUserData();
    let token = req.headers['x-auth-token'];

    if (!token)
        return res.status(401).send({ auth: false, message: 'No token provided' });
    
    jwt.verify(token, getSecretKey().secret, (err, decoded) => {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        }
        
        let deviceID = req.body.deviceID;
        let devicePwd = req.body.password; 
        let deviceUserName = req.body.name;

        let newDeviceObj = {
            name: deviceUserName,
            password: devicePwd,
        }

        if(!deviceID || !devicePwd || !deviceUserName){
            res.status(400).send('Bad Request! Check your input');
            return;
        }

        if(userData[deviceID]){
            res.status(409).send('Device already exists');
            return;
        }

        userData[deviceID] = newDeviceObj;
        fs.writeFileSync(`${dataFolder}/${userDataFile}`, JSON.stringify(userData));
        res.send('Device created').status(201);
    });
});

// delete a device
router.delete('/devices/:deviceId', (req, res) => {
    let userData = fetchUserData();
    let token = req.headers['x-auth-token'];
    let deviceID = req.params.deviceId;

    if (!token)
        return res.status(401).send({ auth: false, message: 'No token provided' });
    
    jwt.verify(token, getSecretKey().secret, (err, decoded) => {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        }
        
        if (!userData[deviceID]){
            res.status(404).send('Device not found');
            return;
        }

        delete userData[deviceID];
        fs.writeFileSync(`${dataFolder}/${userDataFile}`, JSON.stringify(userData));

        res.send('Device deleted').status(200);
    });
});

router.put('/devices/:deviceId', (req, res) => {
    let userData = fetchUserData();
    let token = req.headers['x-auth-token'];
    let deviceID = req.params.deviceId;

    if (!token)
        return res.status(401).send({ auth: false, message: 'No token provided' });
    
    jwt.verify(token, getSecretKey().secret, (err, decoded) => {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });
        }
        
        if (!userData[deviceID]){
            res.status(404).send('Device not found');
            return;
        }

        let devicePwd = req.body.password; 
        let deviceUserName = req.body.name;

        if(!devicePwd || !deviceUserName){
            res.status(400).send('Bad Request! Check your input');
            return;
        }

        userData[deviceID].name = deviceUserName;
        userData[deviceID].password = devicePwd;
        fs.writeFileSync(`${dataFolder}/${userDataFile}`, JSON.stringify(userData));
        res.send('Device updated').status(200);
    });
});

//////////////////////// Exports ////////////////////////////

module.exports = router;