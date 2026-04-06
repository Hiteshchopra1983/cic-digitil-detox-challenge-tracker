function weeklyPayloadFromRequestBody(d) {
  const b = d || {};
  return {
    gb_deleted: Number(b.storage_deleted_gb) || 0,
    downloads_avoided_gb: Number(b.downloads_avoided_gb) || 0,
    streaming_reduction_minutes: Number(b.streaming_reduction_minutes) || 0,
<<<<<<< HEAD
=======
    screen_time_change_minutes: Number(b.screen_time_change_minutes) || 0,
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)
    emails_reduced: Number(b.emails_reduced) || 0,
    messages_reduced: Number(b.messages_reduced) || 0,
    tiktok_reduction_minutes: Number(b.tiktok_reduction_minutes) || 0,
    instagram_reduction_minutes: Number(b.instagram_reduction_minutes) || 0,
    facebook_reduction_minutes: Number(b.facebook_reduction_minutes) || 0,
    youtube_reduction_minutes: Number(b.youtube_reduction_minutes) || 0
  };
}

module.exports = { weeklyPayloadFromRequestBody };
