const { pool } = require("../lib/db");
const { logAction } = require("../services/auditLogger");

module.exports = async (req,res)=>{

try{

const { resetBaseline } = req.body;

/* DELETE WEEKLY DATA */

await pool.query("DELETE FROM weekly_progress");

/* OPTIONAL BASELINE RESET */

if(resetBaseline){
  await pool.query("DELETE FROM baseline_metrics");
}

await logAction({
admin_id: req.user.id,
action: "PROGRAM_RESET",
details: { resetBaseline }
});

res.json({
success:true,
message:"Program reset successful"
});

}catch(err){

console.error(err);

res.status(500).json({
error:"Program reset failed"
});

}
};