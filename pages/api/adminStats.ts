import { pool } from "../../lib/db";

export default async function handler(req:any,res:any){

 const participants=await pool.query(`SELECT COUNT(*) FROM participants`)

 const gbDeleted=await pool.query(`SELECT SUM(gb_deleted) FROM weekly_progress`)

 res.json({
  participants:participants.rows[0].count,
  gb_deleted:gbDeleted.rows[0].sum
 })
}