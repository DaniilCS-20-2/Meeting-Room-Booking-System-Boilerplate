// Pending registrations — незавершённые регистрации (до подтверждения email).
// Храним в БД (переживает рестарт), только хеш кода, считаем попытки.
const crypto = require("crypto");
const pool = require("../db/pool");

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const hashCode = (code) =>
  crypto.createHash("sha256").update(String(code)).digest("hex");

class PendingRegistrationRepository {
  static async upsert({ email, displayName, passwordHash, role, companyId, code, ttlMinutes = 15 }) {
    const emailKey = String(email).toLowerCase();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await pool.query(
      `INSERT INTO pending_registrations
         (email, display_name, password_hash, role, company_id, code_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email)
       DO UPDATE SET display_name  = EXCLUDED.display_name,
                     password_hash = EXCLUDED.password_hash,
                     role          = EXCLUDED.role,
                     company_id    = EXCLUDED.company_id,
                     code_hash     = EXCLUDED.code_hash,
                     attempts      = 0,
                     locked_until  = NULL,
                     expires_at    = EXCLUDED.expires_at,
                     created_at    = NOW()`,
      [emailKey, displayName || "", passwordHash, role || "user", companyId || null, codeHash, expiresAt]
    );
  }

  static async find(email) {
    const { rows } = await pool.query(
      `SELECT email, display_name, password_hash, role, company_id,
              code_hash, attempts, locked_until, expires_at
       FROM pending_registrations
       WHERE email = $1 LIMIT 1`,
      [String(email).toLowerCase()]
    );
    return rows[0] || null;
  }

  static async registerFailedAttempt(email) {
    const { rows } = await pool.query(
      `UPDATE pending_registrations
       SET attempts     = attempts + 1,
           locked_until = CASE
               WHEN attempts + 1 >= $2 THEN NOW() + ($3 || ' minutes')::interval
               ELSE locked_until
           END
       WHERE email = $1
       RETURNING attempts, locked_until`,
      [String(email).toLowerCase(), MAX_ATTEMPTS, String(LOCK_MINUTES)]
    );
    return rows[0] || null;
  }

  static async remove(email) {
    await pool.query(
      `DELETE FROM pending_registrations WHERE email = $1`,
      [String(email).toLowerCase()]
    );
  }

  static async verify(email, code) {
    const row = await this.find(email);
    if (!row) return { ok: false, reason: "not_found" };
    if (row.locked_until && new Date(row.locked_until) > new Date()) {
      return { ok: false, reason: "locked", row };
    }
    if (new Date() > new Date(row.expires_at)) {
      return { ok: false, reason: "expired", row };
    }
    if (row.code_hash !== hashCode(code)) {
      const updated = await this.registerFailedAttempt(email);
      return { ok: false, reason: "mismatch", attempts: updated?.attempts || 0 };
    }
    return { ok: true, row };
  }

  static MAX_ATTEMPTS = MAX_ATTEMPTS;
}

module.exports = PendingRegistrationRepository;
