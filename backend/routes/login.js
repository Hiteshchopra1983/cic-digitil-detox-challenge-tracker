const { pool } = require("../lib/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = async (req,res)=>{

try{

const { email,password } = req.body;

const result = await pool.query(
"SELECT * FROM participants WHERE email=$1",
[email]
);

if(result.rows.length === 0){

return res.status(401).json({
error:"Invalid email or password"
});

}

const user = result.rows[0];

const valid = await bcrypt.compare(
password,
user.password_hash
);

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