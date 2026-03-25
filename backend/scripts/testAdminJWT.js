const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

async function main() {
  const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres123",
    database: "detox"
  });

  const r = await pool.query(
    "SELECT id, role FROM participants WHERE role='admin' LIMIT 1"
  );
  await pool.end();

  const admin = r.rows[0];
  if (!admin) {
    throw new Error("No admin user found in participants table.");
  }

  // Backend middleware uses: jwt.verify(token, process.env.JWT_SECRET || "secret")
  const token = jwt.sign({ id: admin.id, role: admin.role }, "secret", {
    expiresIn: "30d"
  });

  const resp = await fetch("http://localhost:3000/api/adminStats", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const text = await resp.text();
  console.log(
    JSON.stringify({
      adminId: admin.id,
      status: resp.status,
      bodyPreview: text.slice(0, 200)
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

