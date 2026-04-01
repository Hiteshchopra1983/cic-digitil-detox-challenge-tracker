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
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());


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
app.post("/api/weekly", auth, weekly);
app.post("/api/weekly/preview", auth, require("./routes/weeklyPreview"));
app.get(
  "/api/weekly/entry/:participantId/:weekNumber",
  auth,
  require("./routes/getWeeklyEntry")
);

app.get("/api/profile/:id", require("./routes/profile"));
app.post("/api/profile/update", require("./routes/updateProfile"));

app.use("/api/impact", impactRoute);
app.get("/api/progress/:id", require("./routes/progress"));
app.get("/api/completion/:id", require("./routes/completion"));
app.use("/api/notifications", auth, notificationsRoute);
app.use("/api/chat", auth, chatRoute);

app.delete("/api/account/:id", require("./routes/deleteAccount"));

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

  socket.on("chat:send", async (payload = {}) => {
    try {
      const senderId = String(socket.user?.id || "");
      const receiverId = String(payload.receiver_id || "");
      const cleanMessage = String(payload.message || "").trim();
      if (!senderId || !receiverId || !cleanMessage) return;

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
      io.to(`user:${senderId}`).emit("chat:new", chatMessage);
      io.to(`user:${receiverId}`).emit("chat:new", chatMessage);
    } catch (err) {
      console.error("Realtime chat send failed:", err);
    }
  });
});

server.listen(3000, () => {
  console.log("API running on port 3000");
});