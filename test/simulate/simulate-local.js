// Creates loggedData.csv instead of sending data to the server

const fs = require('fs')
const utils = require('./random-utils');
var ProgressBar = require('progress');

function formatLog(logID, log){
    return `${logID},${log.DeviceID},${log.TimeStamp},${log.Voltage},${log.Current},${log.EnergyWH},${log.PowerW},${log.Frequency},${log.PowerFactor}\n`
}

function getComputeIterations(simulation_matrix){
    var iterations = 0;
    const meterIDs = Object.keys(simulation_matrix).map((key) => parseInt(key));
    for (let i = 0; i < meterIDs.length; i++){
        iterations += simulation_matrix[meterIDs[i]].entries;
    }
    return iterations;
}

function Main(){
    const target = `output.csv`
    let writerStream = fs.createWriteStream(target) 

    var logID_offset = 5  +  1;
    const simulation_matrix = {
        1010: {
            days: 60,
            entries: 60
        },
        1011: {
            days: 120,
            entries: 240
        },
        1012: {
            days: 80,
            entries: 400
        },
        1013: {
            days: 100,
            entries: 100*160
        },
        1014: {
            days: 100,
            entries: 100*160
        },
        1015: {
            days: 366,
            entries: 366*24
        }
    }
    
    const csvHeaders = ['LogID', 'DeviceID', 'TimeStamp', 'Voltage', 'Current', 'EnergyWH', 'PowerW', 'Frequency', 'PowerFactor'];
    var buffer = csvHeaders.join(',') + '\n';
    writerStream.write(buffer);
    buffer = '';
    const meterIDs = Object.keys(simulation_matrix).map((key) => parseInt(key));

    var bar = new ProgressBar('Generating [:bar] :percent :etas', {
        complete: '#',
        incomplete: '.',
        width: 20,
        total: getComputeIterations(simulation_matrix)
    });

    for (let i = 0; i < meterIDs.length; i++){
        var meterID = meterIDs[i];
        var logs = utils.generate_staggered_logs(meterID, meterID, simulation_matrix[meterID].entries, simulation_matrix[meterID].days, bar);

        for (let j = 0; j < logs.length; j++){
            const log = logs[j];
            buffer += formatLog(logID_offset, log);
            if (j % 100 == 0){
                writerStream.write(buffer);
                buffer = '';
            }
            logID_offset++;
        }
    }
    
}


Main()