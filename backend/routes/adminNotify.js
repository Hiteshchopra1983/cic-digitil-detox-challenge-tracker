const { pool } = require("../lib/db");
const { sendEmail } = require("../services/emailService");
const { logAction } = require("../services/auditLogger");

async function ensureNotificationsTable() {
const exists = await pool.query(
`SELECT to_regclass('public.notifications') AS table_name`
);
if(exists.rows[0]?.table_name) return;

await pool.query(`
CREATE TABLE notifications (
id SERIAL PRIMARY KEY,
participant_id TEXT NOT NULL,
title TEXT NOT NULL,
message TEXT NOT NULL,
is_read BOOLEAN DEFAULT false,
created_at TIMESTAMP DEFAULT NOW()
)
`);
}

module.exports = async (req,res)=>{

try{

const { type, message, title, channel } = req.body;
const admin_id = req.user.id;
const cleanMessage = (message || "").trim();
const deliveryChannel = (channel || "both").toLowerCase();
const validChannels = ["in_app", "email", "both"];
if(!cleanMessage){
return res.status(400).json({ error:"Message is required" });
}
if(!validChannels.includes(deliveryChannel)){
return res.status(400).json({ error:"Invalid channel" });
}

let users = [];

/* GET USERS */

if(type === "inactive"){

const result = await pool.query(`
SELECT p.id, p.email, p.name
FROM participants p
WHERE role='participant'
AND p.id NOT IN (
SELECT DISTINCT participant_id FROM weekly_progress
)
`);

users = result.rows;

}

else if(type === "all"){

const result = await pool.query(`
SELECT id, email, name FROM participants
WHERE role='participant'
`);

users = result.rows;

}

else{

return res.status(400).json({
error:"Invalid type"
});

}

await ensureNotificationsTable();
const notificationTitle = (title || "Digital Detox Update").trim();
let notificationCount = 0;
let emailCount = 0;


/* SEND EMAILS */

for(const u of users){

if(deliveryChannel === "in_app" || deliveryChannel === "both"){
await pool.query(
`INSERT INTO notifications (participant_id, title, message, is_read)
 VALUES ($1, $2, $3, false)`,
[String(u.id), notificationTitle, cleanMessage]
);
notificationCount += 1;
}

if(deliveryChannel === "email" || deliveryChannel === "both"){
await sendEmail(
u.email,
notificationTitle,
`Hi ${u.name},<br/><br/>${cleanMessage}`
);
emailCount += 1;
}

}


/* AUDIT LOG */

await logAction({
admin_id,
action: "NOTIFICATION_SENT",
details: { type, channel: deliveryChannel, count: users.length, notificationCount, emailCount }
});


res.json({
success:true,
sent: users.length,
channel: deliveryChannel,
notificationCount,
emailCount
});

}catch(err){

console.error(err);

res.status(500).json({
error:"Notification failed",
details: err?.message || "unknown_error"
});

}

};