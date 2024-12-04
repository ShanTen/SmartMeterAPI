const utils = require('./random-utils');
const fs = require('fs');
const axios = require('axios');
const baseURL = 'http://localhost:3000';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
    Create nodes 1010, 1011, 1012, 1013, 1014
    common password: 'password'
    username = 'user<nodeNr>'

    Create staggered logs for each node
    1010: 10 days, 10 entries
    1011: 20 days, 50 entries
    1012: 30 days, 120 entries
    1013: 40 days, 100 entries
*/

const credentials = {
    username: 'admin',
    password: 'admin'
}


var global_headers_admin = {
    'Content-Type': 'application/json',
}

function get_log_object(log_list){
    // let data = {
    //     "DeviceID": 1001,
    //     "TimeStamp": 1711381035,
    //     "Voltage": 231,
    //     "Current": 5.3,
    //     "PowerW": 1225,
    //     "EnergyWH": 30.2,
    //     "Frequency": 50,
    //     "PowerFactor": 0.97
    // }

    let log_object = {
        "DeviceID": log_list[0],
        "TimeStamp": log_list[1],
        "Voltage": log_list[2],
        "Current": log_list[3],
        "PowerW": log_list[4],
        "EnergyWH": log_list[5],
        "Frequency": log_list[6],
        "PowerFactor": log_list[7]
    }

    return log_object;
}

async function login_as_admin(){
    const response = await axios.post(`${baseURL}/admin/login`, credentials);
    return response.data.token;
}

async function Main(){

    //step-1 login as admin
    //#region  
    console.log("Logging in as admin");
    const token  = await login_as_admin();
    global_headers_admin['x-auth-token'] = token;
    //#endregion

    // step - 2 create nodes
    //#region  
    console.log("Creating nodes");
    const nodes = [1010, 1011, 1012, 1013];
    const common_password = 'wordpass';
    const common_username = 'user';

    var global_headers_household = {
        'Content-Type': 'application/json',
        'password': common_password
    }

    for(let i = 0; i < nodes.length; i++){
        const newUser = {
            deviceID: nodes[i],
            name: `${common_username}${nodes[i]}`,
            password: common_password
        }
        const response = await axios.post(`${baseURL}/admin/devices`, newUser, {headers: global_headers_admin});
        console.log(response.data);
    }
    //#endregion  

    // step - 3 create staggered logs
    //#region  
    console.log("Creating staggered logs");
    const num_of_days = [10, 20, 30, 40];
    const num_of_entries = [10, 50, 120, 100];

    for(let i = 0; i < nodes.length; i++){
        const logs = utils.generate_staggered_logs(nodes[i], nodes[i], num_of_entries[i], num_of_days[i]);

        console.log(`Generated logs for node ${nodes[i]} 333`);
        console.log(logs);
        
        // logs seem okay

        let log = null
        for(let j = 0; j < logs.length; j++){
            log = logs[j];

            console.log(`Logging data for node ${nodes[i]}`);
            console.log(log);

            const response = await axios.post(
                `${baseURL}/household/log-data/${nodes[i]}`, 
                log, 
                {headers: global_headers_household}
            );

            await sleep(500);
            console.log(response.data);
        }
        await sleep(100);
    }
    //#endregion  

    // step - 4 get all devices
    //#region  
    console.log("Getting list of all devices");
    const response = await axios.get(`${baseURL}/admin/devices`, {headers: global_headers_admin});
    console.log(response.data);
    //#endregion

    // step - 5 get all logs
    //#region
    console.log("Dumping list of all logs in dump-logs.txt");
    const logs = [];
    for(let i = 0; i < nodes.length; i++){
        const response = await axios.get(`${baseURL}/household/log-data/${nodes[i]}`, {headers: global_headers_household});
        logs.push(response.data);
    }
    fs.writeFileSync('dump-logs.txt', JSON.stringify(logs));
    //#endregion  

    // step - 6 cleanup (delete all nodes)
    //#region  
        console.log("Cleaning up...");
        for(let i = 0; i < nodes.length; i++){
            const response = await axios.delete(`${baseURL}/admin/devices/${nodes[i]}`, {headers: global_headers_admin});
            console.log(response.data);
        }
    //#endregion  

}

try{
    Main();
}
catch(e){
    console.log(e);
}