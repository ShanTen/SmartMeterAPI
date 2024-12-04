// A bunch of utility functions to generate random data for testing purposes to be used in simulate.js

function get_current_time_stamp(){
    return new Date().getTime();
}

function get_staggered_time_stamp(num_of_ts, num_of_days) {
    // num_of_ts: number of time stamps to generate
    // num_of_days: number of days over which the timestamps are distributed

    let time_stamps = [];
    let current_time = get_current_time_stamp();

    // Calculate the interval in milliseconds between each timestamp
    let total_time_period = num_of_days * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    let interval = total_time_period / (num_of_ts - 1); // Divide time period into equal intervals

    for (let i = 0; i < num_of_ts; i++) {
        let time_stamp = current_time - i * interval; // Calculate each timestamp
        time_stamps.push(Math.round(time_stamp)); // Round to avoid fractional milliseconds
    }

    return time_stamps.reverse(); // Reverse to make the earliest timestamp the first
}

function randint(min, max){
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randfloat(min, max){
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function generate_random_voltage(){
    return randint(200, 240);
}

function generate_random_current(){
    return randfloat(2, 6);
}

function generate_random_log(deviceIDmin, deviceIDmax){

    // DeviceID,TimeStamp,Voltage,Current,PowerW,EnergyWH,Frequency,PowerFactor - 8 fields
    let headings = [`DeviceID`,`TimeStamp`,`Voltage`,`Current`,`PowerW`,`EnergyWH`,`Frequency`,`PowerFactor`]
    let log = [];
    log.push(randint(deviceIDmin, deviceIDmax)); // 1
    log.push(get_current_time_stamp()); // 2
    log.push(generate_random_voltage()); // 3
    log.push(generate_random_current()); // 4
    log.push( parseFloat((log[2] * log[3]).toFixed(2)) ); // 5
    log.push( parseFloat((log[4] *  0.5  ).toFixed(2)) ); // 6
    log.push(randfloat(50, 60)); // 7
    log.push(randfloat(0.9, 1)); // 8

    let toSend={};
    for(let i = 0; i < headings.length; i++){
        toSend[headings[i]] = log[i];
    }

    // console.log("Generated log: ")
    // console.log(toSend)

    return toSend;
}

function generate_random_logs(deviceIDmin, deviceIDmax, num){
    let logs = [];
    for(let i = 0; i < num; i++){
        logs.push(generate_random_log(deviceIDmin, deviceIDmax));
    }
    return logs;
}

function generate_logs_for_device(deviceID, num){
    return generate_random_logs(deviceID, deviceID, num);
}

function generate_staggered_logs(deviceIDmin, deviceIDmax, num_of_ts, num_of_days, bar=null){
    let logs = [];
    let time_stamps = get_staggered_time_stamp(num_of_ts, num_of_days);
    for(let i = 0; i < num_of_ts; i++){
        logs.push(generate_random_log(deviceIDmin, deviceIDmax));
        if(bar)  bar.tick();
        logs[i].TimeStamp = time_stamps[i];
    }
    // console.log("Generated staggered logs 248we: ")
    // console.log(logs)

    return logs;
}

module.exports = {
    get_current_time_stamp,
    get_staggered_time_stamp,
    randint,
    randfloat,
    generate_random_voltage,
    generate_random_current,
    generate_random_log,
    generate_random_logs,
    generate_logs_for_device,
    generate_staggered_logs,
}