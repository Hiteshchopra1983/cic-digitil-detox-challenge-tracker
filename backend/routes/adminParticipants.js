const { pool } = require("../lib/db");
const { logAction } = require("../services/auditLogger");

/* GET PARTICIPANTS */

async function getParticipants(req,res){

try{

const result = await pool.query(`
SELECT
p.id,
p.name,
p.email,
p.country,
p.city,
p.role,

CASE
WHEN w.participant_id IS NOT NULL THEN 'active'
ELSE 'inactive'
END as status

FROM participants p

LEFT JOIN (
SELECT DISTINCT participant_id
FROM weekly_progress
) w

ON p.id = w.participant_id

WHERE p.role != 'super_admin'

ORDER BY p.created_at DESC
`);

res.json(result.rows);

}catch(err){

console.error(err);
res.status(500).json({error:"Fetch failed"});

}

}


/* DISABLE USER */

async function disableUser(req,res){

try{

const id = req.params.id;

await pool.query(
"UPDATE participants SET role='disabled' WHERE id=$1",
[id]
);

await logAction({
admin_id: req.user.id,
action: "USER_DISABLED",
target_id: id
});

res.json({success:true});

}catch(err){

console.error(err);
res.status(500).json({error:"Disable failed"});

}
}


/* DELETE USER */

async function deleteUser(req,res){

try{

const id = req.params.id;

await pool.query("DELETE FROM weekly_progress WHERE participant_id=$1",[id]);
await pool.query("DELETE FROM baseline_metrics WHERE participant_id=$1",[id]);
await pool.query("DELETE FROM participants WHERE id=$1",[id]);

await logAction({
admin_id: req.user.id,
action: "USER_DELETED",
target_id: id
});

res.json({success:true});

}catch(err){

console.error(err);
res.status(500).json({error:"Delete failed"});

}
}


module.exports = {
getParticipants,
disableUser,
deleteUser
};