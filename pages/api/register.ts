import { pool } from "../../lib/db";

export default async function handler(req:any,res:any){

 if(req.method!=="POST"){
  return res.status(405).end()
 }

 const {name,email,country,city,cohort,consent}=req.body

 await pool.query(
 `INSERT INTO participants(name,email,country,city,cohort,consent)
 VALUES($1,$2,$3,$4,$5,$6)`,
 [name,email,country,city,cohort,consent]
 )

 res.json({success:true})
}