const { pool } = require("../lib/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = async (req,res)=>{

try{

const { email,password } = req.body;

const emailNorm = String(email || "").trim().toLowerCase();

if (!emailNorm || password == null || password === "") {
  return res.status(400).json({ error: "Email and password are required" });
}

const result = await pool.query(
  `SELECT * FROM participants
   WHERE lower(trim(email)) = $1`,
  [emailNorm]
);

if(result.rows.length === 0){

return res.status(401).json({
error:"Invalid email or password"
});

}

const user = result.rows[0];

if (!user.password_hash) {
  console.error("Login: missing password_hash for user id", user.id);
  return res.status(401).json({
    error: "Invalid email or password"
  });
}

let valid = false;
try {
  valid = await bcrypt.compare(String(password), user.password_hash);
} catch (e) {
  console.error("Login: bcrypt compare failed", e?.message || e);
  return res.status(401).json({
    error: "Invalid email or password"
  });
}

if(!valid){

return res.status(401).json({
error:"Invalid email or password"
});

}

/* JWT TOKEN */

const token = jwt.sign(
{
id:user.id,
role:user.role
},
process.env.JWT_SECRET || "secret",
{ expiresIn:"30d" }
);

res.json({
token,
participant_id:user.id,
role:user.role
});

}catch(err){

console.error(err);
res.status(500).json({error:"Login failed"});

}

};