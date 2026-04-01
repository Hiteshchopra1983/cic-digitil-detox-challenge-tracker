const { Pool } = require("pg");

/**
 * Always define a Pool — never export `pool: undefined` (that causes
 * "Cannot read properties of undefined (reading 'query')" in routes).
 *
 * Env (any of these patterns works on EC2 + RDS):
 *   • DATABASE_URL=postgresql://user:pass@host:5432/dbname
 *   • PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 *   • DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *
 * RDS SSL: set PGSSLMODE=require or DATABASE_SSL=true, or use a host
 * containing rds.amazonaws.com (ssl enabled with rejectUnauthorized: false).
 */
function buildPoolConfig() {
  const url = process.env.DATABASE_URL;
  const host =
    process.env.PGHOST || process.env.DB_HOST || "localhost";
  const port = Number(process.env.PGPORT || process.env.DB_PORT || 5432);
  const user =
    process.env.PGUSER || process.env.DB_USER || "postgres";
  const password =
    process.env.PGPASSWORD ||
    process.env.DB_PASSWORD ||
    "postgres123";
  const database =
    process.env.PGDATABASE || process.env.DB_NAME || "detox";

  const sslExplicit =
    String(process.env.PGSSLMODE || "").toLowerCase() === "require" ||
    String(process.env.DATABASE_SSL || "").toLowerCase() === "true";

  const rdsHost =
    host.includes("rds.amazonaws.com") ||
    (url && url.includes("rds.amazonaws.com"));

  const useSsl = sslExplicit || rdsHost;

  const sslOption = useSsl ? { rejectUnauthorized: false } : undefined;

  if (url && String(url).trim() !== "") {
    return {
      connectionString: url,
      ssl: sslOption
    };
  }

  return {
    host,
    port,
    user,
    password,
    database,
    ...(sslOption ? { ssl: sslOption } : {})
  };
}

const pool = new Pool(buildPoolConfig());

module.exports = { pool };
