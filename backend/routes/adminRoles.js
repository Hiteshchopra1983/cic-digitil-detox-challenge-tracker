const { pool } = require("../lib/db");
const { logAction } = require("../services/auditLogger");

module.exports = async (req,res)=>{

try{

const { user_id, role } = req.body;

/* VALID ROLES */

const allowed = ["admin","participant","disabled"];

if(!allowed.includes(role)){
return res.status(400).json({
error:"Invalid role"
});
}

/* UPDATE */

await pool.query(
"UPDATE participants SET role=$1 WHERE id=$2",
[role,user_id]
);

await logAction({
admin_id: req.user.id,
action: "ROLE_UPDATED",
target_id: user_id,
details: { role }
});

res.json({success:true});

}catch(err){

console.error(err);
res.status(500).json({
error:"Role update failed"
});

}
};