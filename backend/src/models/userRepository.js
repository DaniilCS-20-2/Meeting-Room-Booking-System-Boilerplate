// Импортируем пул соединений для выполнения SQL-запросов.
const pool = require("../db/pool");

// Создаём репозиторий пользователей.
class UserRepository {
  // Ищем пользователя по email (без учёта регистра).
  static async findByEmail(email) {
    // Формируем SQL-запрос на выборку.
    const query = `
      SELECT id, email, password_hash, role, created_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `;
    // Выполняем запрос.
    const { rows } = await pool.query(query, [email]);
    // Возвращаем пользователя или null.
    return rows[0] || null;
  }

  // Создаём нового пользователя.
  static async createUser({ email, passwordHash, role = "user" }) {
    // Формируем SQL-вставку.
    const query = `
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, role, created_at
    `;
    // Выполняем запрос с параметрами.
    const { rows } = await pool.query(query, [email, passwordHash, role]);
    // Возвращаем созданную запись.
    return rows[0];
  }
}

// Экспортируем репозиторий пользователей.
module.exports = UserRepository;
