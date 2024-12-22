const fs = require('fs');
const path2billingConfig = './billing.config.jsonc'
const JSON5 = require('json5')
const jsonText = fs.readFileSync(path2billingConfig, 'utf8');
const billingConfig = JSON5.parse(jsonText);

function getRatesPerSlab(total_units_in_kWh){
    let slabMap = chooseSlabMap(total_units_in_kWh)
    const ratesPerSlab = Object.values(slabMap).map(item => item.rate);
    ratesPerSlab.push(billingConfig.maxRate)
    return ratesPerSlab
}

function chooseSlabMap(total_units_in_kWh){
    let slabMap = null
    if(total_units_in_kWh <= billingConfig.adnSubsidyUnitsCap)
        slabMap = billingConfig.slabsLTadnSub
    else 
        slabMap = billingConfig.slabsGTadnSub
    return slabMap 
}

function makeSplits(total_units_in_kWh){
    let slabs = chooseSlabMap(total_units_in_kWh);
    let splits = [];
    let runningUnits = total_units_in_kWh;

    for(let slab of slabs){
        slabDelta = slab.to - slab.from;
        if(runningUnits < slabDelta){
            splits.push(runningUnits)
            runningUnits = 0;
            break
        }
        else{
            splits.push(slabDelta);
            runningUnits -= slabDelta;
        }
    }

    let remaining = runningUnits;
    return {splits, remaining}
}

function calculateBill(total_units_in_kWh){
    let {splits, remaining} = makeSplits(total_units_in_kWh);
    let totalAmount = 0;
    if(remaining>0) splits.push(remaining);
    const ratesPerSlab = getRatesPerSlab(total_units_in_kWh);
        
    for(let i=0; i<splits.length; i++){
        let split = splits[i]
        let slab_rate = ratesPerSlab[i];
        slabAmount = split*slab_rate
        totalAmount += slabAmount;
    }

    return totalAmount;
}

function makeBillingTable(total_units_in_kWh){
    //Table as Hashmap
    let {splits, remaining} = makeSplits(total_units_in_kWh);
    if(remaining>0) splits.push(remaining);
    let slabMap = chooseSlabMap(total_units_in_kWh)
    let slabRates = getRatesPerSlab(total_units_in_kWh);
    let totalAmount = 0;

    let makeTableItem = (from, to, units, rate, amount, total) => {
        return {from, to, units, rate, amount}
    }

    let billingTable = []

    for(let splitIndex=0; splitIndex<splits.length;splitIndex++) {
        let slab = slabMap[splitIndex];
        let splitUnits = splits[splitIndex];
        let rate = slabRates[splitIndex]

        let fromUnit = 0;
        let toUnit = 0;

        if(slab){
            fromUnit = slab.from;
            toUnit = slab.to    
        }
        else{
            fromUnit = slabMap[splitIndex-1].to;
            toUnit = total_units_in_kWh
        }
        let amount = rate*splitUnits

        billingTable.push(makeTableItem(fromUnit, toUnit, splitUnits, rate, parseFloat(amount.toFixed(2))))

        totalAmount += amount
    }

    billingTable.push({"total":parseFloat(totalAmount.toFixed(2))})

    return billingTable
}

module.exports = {calculateBill, makeBillingTable}