const express = require("express");
const { pool } = require("../lib/db");

const router = express.Router();

async function ensureNotificationsTable() {
  const exists = await pool.query(
    `SELECT to_regclass('public.notifications') AS table_name`
  );
  if (exists.rows[0]?.table_name) return;

  await pool.query(`
  CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    participant_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  )
  `);
}

router.get("/", async (req, res) => {
  try {
    await ensureNotificationsTable();
    const participantId = String(req.user?.id || "");
    if (!participantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, title, message, is_read, created_at
       FROM notifications
       WHERE participant_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [participantId]
    );

    const unreadResult = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notifications
       WHERE participant_id = $1 AND is_read = false`,
      [participantId]
    );

    return res.json({
      notifications: result.rows,
      unread_count: unreadResult.rows[0]?.unread_count || 0
    });
  } catch (err) {
    console.error("Fetch notifications failed:", err);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    await ensureNotificationsTable();
    const participantId = String(req.user?.id || "");
    const notificationId = Number(req.params.id);
    if (!participantId || !Number.isFinite(notificationId)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND participant_id = $2
       RETURNING id`,
      [notificationId, participantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Mark notification read failed:", err);
    return res.status(500).json({ error: "Failed to mark read" });
  }
});

router.post("/read-all", async (req, res) => {
  try {
    await ensureNotificationsTable();
    const participantId = String(req.user?.id || "");
    if (!participantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE participant_id = $1 AND is_read = false`,
      [participantId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Mark all notifications read failed:", err);
    return res.status(500).json({ error: "Failed to mark all read" });
  }
});

module.exports = router;
