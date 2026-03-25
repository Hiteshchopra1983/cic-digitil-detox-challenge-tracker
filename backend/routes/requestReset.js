const crypto=require("crypto");
const { pool }=require("../lib/db");

module.exports=async function(req,res){

 const {email}=req.body;

 const token=crypto.randomBytes(32).toString("hex");

 await pool.query(
 `UPDATE participants
  SET reset_token=$1,
  reset_token_expiry=NOW()+interval '1 hour'
  WHERE email=$2`,
 [token,email]
 );

 res.json({message:"Reset link generated"});
}