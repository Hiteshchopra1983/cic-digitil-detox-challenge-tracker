const { pool } = require("../lib/db");

module.exports = async (req,res)=>{

try{

const result = await pool.query(`

SELECT id,name,email
FROM participants
WHERE role='participant'
AND id NOT IN (
SELECT DISTINCT participant_id
FROM weekly_progress
)

`);

res.json(result.rows);

}catch(err){

console.error(err);
res.status(500).json({error:"Inactive fetch failed"});

}

};