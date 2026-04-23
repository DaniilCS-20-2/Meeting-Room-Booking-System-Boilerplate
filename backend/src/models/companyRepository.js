const pool = require("../db/pool");

// Допустимый формат HEX-цвета '#RRGGBB' (строчные/заглавные).
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

class CompanyRepository {
  static isValidColor(color) {
    return typeof color === "string" && HEX_RE.test(color);
  }

  static async findAll() {
    const { rows } = await pool.query(
      `SELECT id, name, color, created_at
       FROM companies
       ORDER BY name ASC`
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, name, color, created_at FROM companies WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ name, color }) {
    const { rows } = await pool.query(
      `INSERT INTO companies (name, color)
       VALUES ($1, $2)
       RETURNING id, name, color, created_at`,
      [name, color]
    );
    return rows[0];
  }

  static async update(id, { name, color }) {
    const { rows } = await pool.query(
      `UPDATE companies
       SET name  = COALESCE($2, name),
           color = COALESCE($3, color),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, color, created_at`,
      [id, name ?? null, color ?? null]
    );
    return rows[0] || null;
  }

  static async remove(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM companies WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }
}

module.exports = CompanyRepository;
