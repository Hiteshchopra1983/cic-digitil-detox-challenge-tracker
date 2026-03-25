const { pool } = require("../lib/db");

async function logAction({ admin_id, action, target_id=null, details={} }){

try{

await pool.query(
`
INSERT INTO audit_logs (admin_id, action, target_id, details)
VALUES ($1,$2,$3,$4)
`,
[admin_id, action, target_id, details]
);

}catch(err){

console.error("Audit log failed:", err);

}

}

module.exports = {
logAction
};