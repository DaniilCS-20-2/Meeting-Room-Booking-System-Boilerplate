const fs = require("fs");
const path = require("path");
const pool = require("../src/db/pool");

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/run-migration.js <relative-sql-path>");
    process.exit(1);
  }
  const abs = path.resolve(process.cwd(), file);
  const sql = fs.readFileSync(abs, "utf8");
  console.log(`Applying: ${abs}`);
  try {
    await pool.query(sql);
    console.log("OK");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
