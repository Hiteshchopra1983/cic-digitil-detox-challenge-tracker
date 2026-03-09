import { pool } from "../../lib/db";

export default async function handler(req:any,res:any){

 const d=req.body

 await pool.query(`
 INSERT INTO weekly_progress(
 participant_id,
 week_number,
 gb_deleted,
 streaming_reduction_minutes,
 screen_time_change,
 downloads_avoided_gb,
 emails_reduced,
 messages_reduced,
 ritual_completed,
 alumni_touchpoints
 )
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
 `,
 [
 d.participant_id,
 d.week,
 d.gb_deleted,
 d.streaming_reduction,
 d.screen_change,
 d.downloads,
 d.emails,
 d.messages,
 d.ritual,
 d.touchpoints
 ])

 res.json({success:true})
}