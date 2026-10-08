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

if (Object.prototype.hasOwnProperty.call(updates, "llm_per_query")) {
  try {
    await pool.query(
      `UPDATE emission_config SET llm_per_query = $1::double precision
       WHERE id = (SELECT id FROM emission_config ORDER BY id LIMIT 1)`,
      [updates.llm_per_query]
    );
  } catch (syncErr) {
    console.warn(
      "emission_config.llm_per_query sync skipped (run migration 005?):",
      syncErr && syncErr.message
    );
  }
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