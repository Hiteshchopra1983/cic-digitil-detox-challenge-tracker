const { pool } = require("../lib/db");
const { hashPassword } = require("../lib/password");
const jwt = require("jsonwebtoken");

module.exports = async (req,res)=>{

try{

const d = req.body;

if(!d.consent){

return res.status(400).json({
error:"Consent is required to register"
});

}

const emailNorm = String(d.email || "").trim().toLowerCase();
if (!emailNorm) {
  return res.status(400).json({ error: "Email is required" });
}

/* hash password */

const hash = await hashPassword(d.password, 10);

const cityTrim = String(d.city ?? "").trim();
const cohortTrim = String(d.cohort ?? "").trim();

/* insert participant */

const result = await pool.query(

`INSERT INTO participants(
name,
email,
password_hash,
country,
city,
cohort,
role,
consent,
consent_given,
consent_timestamp
)
VALUES($1,$2,$3,$4,$5,$6,$7,true,true,NOW())
RETURNING id, role`,
[
d.name,
emailNorm,
hash,
d.country || null,
cityTrim || null,
cohortTrim || null,
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