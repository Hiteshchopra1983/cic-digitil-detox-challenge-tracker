const { pool } = require("../lib/db");

module.exports = async (req,res)=>{

try{

const id = req.params.id;

await pool.query("DELETE FROM weekly_progress WHERE participant_id=$1",[id]);
await pool.query("DELETE FROM baseline_metrics WHERE participant_id=$1",[id]);
await pool.query("DELETE FROM participants WHERE id=$1",[id]);

res.json({success:true});

}catch(err){

console.error(err);
res.status(500).json({error:"Delete failed"});

}

};