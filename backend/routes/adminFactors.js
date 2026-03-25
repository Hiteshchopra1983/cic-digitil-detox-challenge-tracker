const { pool } = require("../lib/db");
const { logAction } = require("../services/auditLogger");

module.exports = async (req,res)=>{

try{

if(req.method==="GET"){

const result = await pool.query(
"SELECT * FROM co2_factors"
);

const obj = {};

result.rows.forEach(r=>{
obj[r.key] = r.value;
});

return res.json(obj);

}

if(req.method==="POST"){

const updates = req.body;

for(const key in updates){

await pool.query(
"UPDATE co2_factors SET value=$1 WHERE key=$2",
[updates[key], key]
);

}

await logAction({
admin_id: req.user.id,
action: "CO2_FACTORS_UPDATED",
details: updates
});

return res.json({success:true});

}

}catch(err){

console.error(err);

res.status(500).json({
error:"Factor config failed"
});

}
};