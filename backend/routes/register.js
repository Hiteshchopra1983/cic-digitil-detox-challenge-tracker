const { pool } = require("../lib/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = async (req,res)=>{

try{

const d = req.body;

if(!d.consent){

return res.status(400).json({
error:"Consent is required to register"
});

}

/* hash password */

const hash = await bcrypt.hash(d.password,10);

/* insert participant */

const result = await pool.query(

`INSERT INTO participants(
name,
email,
password_hash,
country,
role,
consent,
consent_given,
consent_timestamp
)
VALUES($1,$2,$3,$4,$5,true,true,NOW())
RETURNING id, role`,
[
d.name,
d.email,
hash,
d.country,
"participant"
]

);

const id = result.rows[0].id;
const role = result.rows[0].role || "participant";

/* generate token */

const token = jwt.sign(
{ id, role },
process.env.JWT_SECRET || "secret",
{ expiresIn:"30d" }
);

res.json({
token,
participant_id:id
});

}catch(err){

console.error(err);

res.status(500).json({
error:"Registration failed"
});

}

};