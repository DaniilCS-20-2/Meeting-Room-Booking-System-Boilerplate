/**
 * Run database/migrations/*.sql in order against DATABASE_URL.
 * Usage: node scripts/run-migrations.js
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require(path.join(__dirname, "..", "backend", "node_modules", "pg"));

const root = path.join(__dirname, "..");
const migrationsDir = path.join(root, "database", "migrations");

const ORDER = [
  "001_init.sql",
  "003_flexible_duration.sql",
  "004_room_photos.sql",
  "005_email_whitelist.sql",
  "006_companies.sql",
  "007_preserve_history.sql",
  "008_security_hardening.sql",
  "009_viewer_role.sql",
  "010_room_color.sql",
  "011_room_disabled_reason.sql",
  "012_booking_guest_fields.sql",
  "013_company_logo.sql",
];

function createPool() {
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    return new Pool({
      connectionString: url,
      ssl: url.includes("azure.com") ? { rejectUnauthorized: false } : undefined,
    });
  }
  const host = process.env.PGHOST;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE || "booking_app_db";
  if (!host || !user || !password) {
    console.error("Set DATABASE_URL or PGHOST, PGUSER, PGPASSWORD.");
    process.exit(1);
  }
  return new Pool({
    host,
    port: Number(process.env.PGPORT || 5432),
    database,
    user,
    password,
    ssl: host.includes("azure.com") ? { rejectUnauthorized: false } : undefined,
  });
}

const pool = createPool();

async function main() {
  const client = await pool.connect();
  try {
    for (const file of ORDER) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing migration: ${file}`);
      }
      let sql = fs.readFileSync(filePath, "utf8");
      const isAzure = (process.env.PGHOST || process.env.DATABASE_URL || "").includes(
        "azure.com"
      );
      if (file === "001_init.sql" && isAzure) {
        sql = sql.replace(
          /CREATE EXTENSION IF NOT EXISTS pgcrypto;\s*\n?/i,
          "-- pgcrypto not needed on Azure PG 16 (gen_random_uuid is built-in)\n"
        );
      }
      console.log(`Running ${file}...`);
      await client.query(sql);
      console.log(`  OK: ${file}`);
    }
    console.log("All migrations completed.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
