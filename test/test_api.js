const axios = require('axios');
const baseURL = 'http://localhost:3000';

axios.get(`${baseURL}/household`).then((response) => {
    console.log(response.data);
})


axios.get(`${baseURL}/household`).then((response) => {
    console.log(response.data);
})

// /log-data/all/:deviceID

let headers = {
    password: '123',
    'Content-Type': 'application/json'
}

axios.get(`${baseURL}/household/log-data/1001`, { headers }).then((response) => {
    console.log(response.data);
}).catch((error) => {
    console.log(error.response.data);}
)

// attributes : DeviceID,TimeStamp,Voltage,Current,PowerW,EnergyWH,Frequency,PowerFactor

let data = {
    "DeviceID": 1001,
    "TimeStamp": 1711381035,
    "Voltage": 269,
    "Current": 5.3,
    "PowerW": 1225,
    "EnergyWH": 30.2,
    "Frequency": 50,
    "PowerFactor": 0.97
}

axios.post(`${baseURL}/household/log-data/${data.DeviceID}`, data, { headers }).then((response) => {
    console.log(response.data);
}).catch((error) => {
    console.log(error.response.data);
})

let startEpoch = 1372409000000
let endEpoch =   1730490006000;

axios.get(`${baseURL}/household/log-data/ranged/1001/${startEpoch}/${endEpoch}`, { headers }).then((response) => {
    console.log(response.data);
}).catch((error) => {
    console.log(error.response.data);}
)