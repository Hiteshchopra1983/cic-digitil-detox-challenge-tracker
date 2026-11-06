require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { pool } = require("./lib/db");

const login = require("./routes/login");
const register = require("./routes/register");
const baseline = require("./routes/baseline");
const weekly = require("./routes/weekly");

const leaderboard = require("./routes/leaderboard");

const auth = require("./middleware/auth");
const adminOnly = require("./middleware/adminOnly");
const adminAuth = require("./middleware/adminAuth");

const adminConfig = require("./routes/adminConfig");
const programConfig = require("./routes/programConfig");
const impactRoute = require("./routes/impact");
const notificationsRoute = require("./routes/notifications");
const { router: chatRoute, ensureChatTable } = require("./routes/chat");

const adminExport = require("./routes/adminExport");
const adminImpact = require("./routes/adminImpact");
const adminReset = require("./routes/adminReset");
const adminStats = require("./routes/adminStats");
const adminParticipants = require("./routes/adminParticipants");
const adminRoles = require("./routes/adminRoles");

const app = express();
const server = http.createServer(app);
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

const { ensureSchema } = require("./lib/ensureSchema");
let schemaReady;
async function warmSchema(_req, _res, next) {
  try {
    if (!schemaReady) {
      schemaReady = ensureSchema(pool).then(() => {
        console.log("Schema ready");
      });
    }
    await schemaReady;
  } catch (err) {
    console.error("Schema bootstrap failed:", err && err.message);
  }
  next();
}
app.use(warmSchema);

/* Health — Render / uptime checks */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "cic-dd2-api" });
});
app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});


/* ========================= */
/* PUBLIC ROUTES */
/* ========================= */

app.post("/api/login", login);
app.post("/api/register", register);
app.post("/api/auth/forgot-password", require("./routes/forgotPassword"));
app.post("/api/auth/reset-password", require("./routes/resetPassword"));
app.get("/api/auth/reset-token", require("./routes/verifyResetToken"));


/* ========================= */
/* PARTICIPANT ROUTES */
/* ========================= */

app.post("/api/baseline", auth, baseline);
app.get("/api/baseline/:id", auth, require("./routes/getBaseline"));
app.post("/api/weekly/reach-out", auth, require("./routes/weeklyReachOut"));
app.post("/api/weekly", auth, weekly);
app.post("/api/weekly/preview", auth, require("./routes/weeklyPreview"));
app.get(
  "/api/weekly/entry/:participantId/:weekNumber",
  auth,
  require("./routes/getWeeklyEntry")
);

/* DD 2.0 simplified check-in (PWA) — own pace, no baseline gate */
const { getCheckin, postCheckin } = require("./routes/checkin");
app.get("/api/checkin/:participantId", auth, getCheckin);
app.post("/api/checkin", auth, postCheckin);

app.get("/api/profile/:id", auth, require("./routes/profile"));
app.post("/api/profile/update", auth, require("./routes/updateProfile"));

app.use("/api/impact", impactRoute);
app.get(
  "/api/impact-summary/:id",
  auth,
  require("./routes/impactSummary")
);
app.get("/api/progress/:id", auth, require("./routes/progress"));
app.get("/api/completion/:id", auth, require("./routes/completion"));
app.use("/api/notifications", auth, notificationsRoute);
app.use("/api/chat", auth, chatRoute);

app.delete("/api/account/:id", auth, require("./routes/deleteAccount"));

app.use("/api/leaderboard", leaderboard);


/* ========================= */
/* ADMIN ROUTES */
/* ========================= */

/* DASHBOARD */

app.get("/api/adminStats", auth, adminAuth("admin"), adminStats);
app.get("/api/admin/audit", auth, adminAuth("admin"), require("./routes/adminAuditLogs"));



/* PARTICIPANT MANAGEMENT */

app.get("/api/admin/participants", auth, adminAuth("admin"), adminParticipants.getParticipants);

app.post(
  "/api/admin/participants/import",
  auth,
  adminAuth("admin"),
  require("./routes/adminBulkImport")
);

app.put("/api/admin/disable/:id", auth, adminAuth("admin"), adminParticipants.disableUser);

app.delete("/api/admin/delete/:id", auth, adminAuth("admin"), adminParticipants.deleteUser);

app.post(
  "/api/admin/reset-baseline/:id",
  auth,
  adminAuth("admin"),
  adminParticipants.resetBaseline
);


/* ROLE MANAGEMENT */

app.post("/api/admin/role", auth, adminAuth("admin"), adminRoles);


/* PROGRAM CONFIG */

app.get("/api/adminConfig", auth, adminOnly, adminConfig);
app.post("/api/adminConfig", auth, adminOnly, adminConfig);
app.get("/api/program-config", auth, adminOnly, programConfig);
app.post("/api/program-config", auth, adminOnly, programConfig);


/* IMPACT + ANALYTICS */

app.get("/api/admin/impact", auth, adminAuth("admin"), adminImpact);


/* EXPORT */

app.get("/api/admin/export", auth, adminAuth("admin"), adminExport);


/* INACTIVE USERS */

app.get("/api/admin/inactive", auth, adminAuth("admin"), require("./routes/inactiveParticipants"));


/* RESET */

app.post("/api/admin/reset", auth, adminAuth("admin"), adminReset);


/* CO2 FACTORS */

app.all("/api/admin/factors", auth, adminAuth("admin"), require("./routes/adminFactors"));
app.post("/api/admin/notify", auth, adminAuth("admin"), require("./routes/adminNotify"));


/* ========================= */
/* SERVER */
/* ========================= */

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const currentUserId = String(socket.user?.id || "");
  if (currentUserId) {
    socket.join(`user:${currentUserId}`);
  }

  socket.on("chat:send", async (payload = {}, ack) => {
    const respond = (data) => {
      if (typeof ack === "function") {
        try {
          ack(data);
        } catch (_) {
          /* client disconnected before ack */
        }
      }
    };

    try {
      const senderId = String(socket.user?.id || "").trim();
      const receiverId = String(payload.receiver_id || "").trim();
      const cleanMessage = String(payload.message || "").trim();

      if (!senderId) {
        respond({ ok: false, error: "Not signed in" });
        return;
      }
      if (!receiverId) {
        respond({ ok: false, error: "Choose who to message" });
        return;
      }
      if (!cleanMessage) {
        respond({ ok: false, error: "Message is empty" });
        return;
      }
      if (receiverId === senderId) {
        respond({ ok: false, error: "You cannot message yourself" });
        return;
      }

      await ensureChatTable();

      const senderRes = await pool.query(
        `SELECT name FROM participants WHERE id = $1 LIMIT 1`,
        [senderId]
      );
      const senderName = senderRes.rows[0]?.name || "Participant";

      const insertRes = await pool.query(
        `INSERT INTO chat_messages (sender_id, receiver_id, sender_name, message)
         VALUES ($1, $2, $3, $4)
         RETURNING id, sender_id, receiver_id, sender_name, message, created_at`,
        [senderId, receiverId, senderName, cleanMessage]
      );

      const chatMessage = insertRes.rows[0];
      respond({ ok: true, message: chatMessage });
      io.to(`user:${senderId}`).emit("chat:new", chatMessage);
      io.to(`user:${receiverId}`).emit("chat:new", chatMessage);
    } catch (err) {
      console.error("Realtime chat send failed:", err);
      respond({
        ok: false,
        error: "Could not save your message. Check your connection and try again."
      });
    }
  });
});

/* Export Express app for Vercel serverless ($0 host). */
module.exports = app;

const shouldListen =
  require.main === module && !process.env.VERCEL && !process.env.NOW_REGION;

if (shouldListen) {
  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, async () => {
    console.log(`API running on port ${PORT}`);
    try {
      await ensureSchema(pool);
      console.log("Schema ready");
    } catch (err) {
      console.error("Schema bootstrap failed:", err && err.message);
    }
  });
}