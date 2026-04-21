const pool = require("../db/pool");

class WhitelistRepository {
  static async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT id, email, role, created_at
       FROM email_whitelist
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  static async findAll() {
    const { rows } = await pool.query(
      `SELECT id, email, role, created_at
       FROM email_whitelist
       ORDER BY created_at DESC`
    );
    return rows;
  }

  static async create({ email, role = "user" }) {
    const { rows } = await pool.query(
      `INSERT INTO email_whitelist (email, role)
       VALUES (LOWER($1), $2)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
       RETURNING id, email, role, created_at`,
      [email, role]
    );
    return rows[0];
  }

  static async updateRole(id, role) {
    const { rows } = await pool.query(
      `UPDATE email_whitelist SET role = $2 WHERE id = $1
       RETURNING id, email, role, created_at`,
      [id, role]
    );
    return rows[0] || null;
  }

  static async remove(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM email_whitelist WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }

  static async ensureSeed(emails, role = "admin") {
    if (!Array.isArray(emails) || emails.length === 0) return;
    const values = emails.map((_, i) => `(LOWER($${i + 1}), $${emails.length + 1})`).join(", ");
    await pool.query(
      `INSERT INTO email_whitelist (email, role)
       VALUES ${values}
       ON CONFLICT (email) DO NOTHING`,
      [...emails, role]
    );
  }
}

module.exports = WhitelistRepository;
