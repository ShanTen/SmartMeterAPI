const { log } = require('console');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');


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

router.post('/login', (req, res) => {
    authenticate(req, res);
})    

module.exports = router;