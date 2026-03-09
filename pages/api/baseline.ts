import { pool } from "../../lib/db";

export default async function handler(req:any,res:any){

 const d=req.body

 await pool.query(`
 INSERT INTO baseline_metrics(
 participant_id,
 phone_storage_gb,
 laptop_storage_gb,
 cloud_storage_gb,
 mailbox_size_gb,
 screen_time_hours,
 streaming_hours,
 emails_per_day,
 texts_per_day,
 tiktok_minutes,
 instagram_minutes,
 facebook_minutes,
 youtube_minutes,
 downloads_gb_week
 )
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
 `,
 [
 d.participant_id,
 d.phone_storage,
 d.laptop_storage,
 d.cloud_storage,
 d.mailbox,
 d.screen_time,
 d.streaming,
 d.emails,
 d.texts,
 d.tiktok,
 d.instagram,
 d.facebook,
 d.youtube,
 d.downloads
 ])

 res.json({success:true})
}