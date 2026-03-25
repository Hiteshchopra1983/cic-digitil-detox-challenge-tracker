const bcrypt=require("bcrypt");
const { pool }=require("../lib/db");

module.exports=async function(req,res){

 const {token,password}=req.body;

 const hash=await bcrypt.hash(password,10);

 await pool.query(
 `UPDATE participants
  SET password_hash=$1,
      reset_token=NULL
  WHERE reset_token=$2`,
 [hash,token]
 );

 res.json({success:true});

}