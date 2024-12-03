const axios = require('axios');
const baseURL = 'http://localhost:3000';

const credentials = {
    username: 'admin',
    password: 'admin'
}

var global_headers = {
    'Content-Type': 'application/json',
}

async function get_all_devices_from_admin(){
    const response = await axios.get(`${baseURL}/admin/devices`, {headers: global_headers});
    return response.data;
}

async function get_device_from_admin_with_id(id){
    const response = await axios.get(`${baseURL}/admin/devices/${id}`, {headers: global_headers});
    return response.data;
}

async function create_new_user(userData){
    const response = await axios.post(`${baseURL}/admin/devices`, userData, {headers: global_headers});
    return response.data;
}

async function get_max_demand(nodeID, startEpoch, endEpoch){
    const response = await axios.get(`${baseURL}/admin/max-demand/${nodeID}/${startEpoch}/${endEpoch}`, {headers: global_headers});
    return response.data;
}

axios.post(`${baseURL}/admin/login`, credentials).then((response) => {
    token = response.data.token;
    console.log(token);
    global_headers['x-auth-token'] = token;
    
    //#region test cases - old
    //run sub sequent tests tests inside here
    // get_all_devices_from_admin().then((data) => {
    //     console.log(data);
    // }).catch((error) => {
    //     console.log("Error while fetching devices from admin endpoint");
    //     console.log(error);
    // })

    // get_device_from_admin_with_id(1004)
    // .then((data) => {
    //     console.log(data);
    // }).catch((error) => {
    //     console.log("Error while fetching device with id 1001 from admin endpoint");
    //     console.log(error);
    // })

    // const newUser = {
    //     deviceID: 1003,
    //     name: 'null',
    //     password: 'testpassword'
    // }

    // create_new_user(newUser).then((data) => {
    //     console.log(data);
    // }).catch((error) => {
    //     console.log("Error while creating new user");
    //     console.log(error);
    // })
    //#endregion test cases - old


    get_max_demand(1014, 1730122471000, 1735047271000).then((data) => {
        console.log(data);
    }).catch((error) => {
        console.log("Error while fetching max demand");
        console.log(error);
    })


})

