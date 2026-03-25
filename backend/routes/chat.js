const express = require("express");
const { pool } = require("../lib/db");

const router = express.Router();

async function ensureChatTable() {
  const exists = await pool.query(
    `SELECT to_regclass('public.chat_messages') AS table_name`
  );
  if (!exists.rows[0]?.table_name) {
    await pool.query(`
      CREATE TABLE chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT,
        sender_name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  const hasReceiverColumn = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'chat_messages'
       AND column_name = 'receiver_id'`
  );
  if (hasReceiverColumn.rowCount === 0) {
    await pool.query(`ALTER TABLE chat_messages ADD COLUMN receiver_id TEXT`);
  }
}

router.get("/users", async (req, res) => {
  try {
    const currentUserId = String(req.user?.id || "");
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!currentUserId) return res.status(401).json({ error: "Unauthorized" });

    const result = await pool.query(
      `SELECT id, name, email
       FROM participants
       WHERE id <> $1
         AND role IN ('participant','admin')
         AND (
           LOWER(email) LIKE $2
           OR LOWER(name) LIKE $2
         )
       ORDER BY name ASC
       LIMIT 15`,
      [currentUserId, `%${q}%`]
    );

    return res.json({ users: result.rows });
  } catch (err) {
    console.error("Search chat users failed:", err);
    return res.status(500).json({ error: "Failed to search users" });
  }
});

router.get("/direct/:otherId", async (req, res) => {
  try {
    await ensureChatTable();
    const currentUserId = String(req.user?.id || "");
    const otherId = String(req.params.otherId || "");
    if (!currentUserId || !otherId) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const result = await pool.query(
      `SELECT id, sender_id, receiver_id, sender_name, message, created_at
       FROM chat_messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC
       LIMIT 200`,
      [currentUserId, otherId]
    );

    return res.json({ messages: result.rows });
  } catch (err) {
    console.error("Fetch direct messages failed:", err);
    return res.status(500).json({ error: "Failed to fetch direct messages" });
  }
});

module.exports = { router, ensureChatTable };
