const { pool } = require("../lib/db");

module.exports = async (req,res)=>{

try{

const result = await pool.query(`
SELECT 
a.id,
a.action,
a.details,
a.created_at,
p.name as admin_name

FROM audit_logs a

LEFT JOIN participants p
ON a.admin_id = p.id

ORDER BY a.created_at DESC
LIMIT 100
`);

res.json(result.rows);

}catch(err){

console.error(err);
res.status(500).json({error:"Failed to fetch logs"});

}

};