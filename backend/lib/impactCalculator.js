function convertImpact(co2){

const car_km = co2 * 5;
const trees = co2 / 21;
const phone_charges = co2 * 120;

return{
car_km:Math.round(car_km),
trees:Math.round(trees),
phone_charges:Math.round(phone_charges)
};

}


function calculateBaselineStorage(baseline){

return(
(baseline.phone_devices || 0) * (baseline.phone_storage_gb || 0) +
(baseline.laptop_devices || 0) * (baseline.laptop_storage_gb || 0) +
(baseline.tablet_devices || 0) * (baseline.tablet_storage_gb || 0) +
(baseline.cloud_accounts || 0) * (baseline.cloud_storage_gb || 0)
);

}


function storageReductionImpact(baseline,weekly){

const baselineStorage = calculateBaselineStorage(baseline);

const reduction = weekly.storage_deleted_gb || 0;

const percent = baselineStorage > 0
? (reduction / baselineStorage) * 100
: 0;

return{
absolute:reduction,
percent:Number(percent.toFixed(2))
};

}


module.exports={
convertImpact,
storageReductionImpact
};