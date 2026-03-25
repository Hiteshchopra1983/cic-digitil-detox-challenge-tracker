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
    "SELECT id, email, role FROM participants WHERE role IN ($1,$2) LIMIT 10",
    ["admin", "super_admin"]
  );

  console.log(r.rows);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

