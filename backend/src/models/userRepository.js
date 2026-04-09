// Импортируем пул подключений к PostgreSQL.
const pool = require("../db/pool");

// Создаём репозиторий пользователей для инкапсуляции SQL-запросов.
class UserRepository {
  // Ищем пользователя по email без учёта регистра.
  static async findByEmail(email) {
    // Формируем SQL-запрос с LOWER() для case-insensitive поиска.
    const { rows } = await pool.query(
      `SELECT id, email, display_name, password_hash, role, avatar_url,
              email_verified, verification_code, verification_expires_at, created_at
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );
    // Возвращаем найденного пользователя или null, если не найден.
    return rows[0] || null;
  }

  // Ищем пользователя по UUID идентификатору.
  static async findById(id) {
    // Формируем SQL-запрос по первичному ключу.
    const { rows } = await pool.query(
      `SELECT id, email, display_name, role, avatar_url, email_verified, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    // Возвращаем пользователя или null.
    return rows[0] || null;
  }

  // Создаём нового пользователя в таблице users.
  static async createUser({ email, displayName, passwordHash, role = "user" }) {
    // Формируем параметризованный INSERT-запрос.
    const { rows } = await pool.query(
      `INSERT INTO users (email, display_name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, role, avatar_url, email_verified, created_at`,
      [email, displayName || "", passwordHash, role]
    );
    // Возвращаем созданную запись пользователя.
    return rows[0];
  }

  // Обновляем профиль пользователя (имя и/или аватар).
  static async updateProfile(id, { displayName, avatarUrl }) {
    // COALESCE сохраняет старое значение, если новое не передано (null).
    const { rows } = await pool.query(
      `UPDATE users
       SET display_name = COALESCE($2, display_name),
           avatar_url   = COALESCE($3, avatar_url),
           updated_at   = NOW()
       WHERE id = $1
       RETURNING id, email, display_name, role, avatar_url, email_verified, created_at`,
      [id, displayName, avatarUrl]
    );
    // Возвращаем обновлённого пользователя или null, если id не найден.
    return rows[0] || null;
  }

  // Обновляем хеш пароля пользователя.
  static async updatePassword(id, passwordHash) {
    // Формируем UPDATE-запрос только для поля password_hash.
    await pool.query(
      `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
      [id, passwordHash]
    );
  }

  // Сохраняем код верификации email и время его истечения.
  static async setVerificationCode(id, code, expiresAt) {
    // Обновляем два поля, связанных с верификацией.
    await pool.query(
      `UPDATE users
       SET verification_code = $2, verification_expires_at = $3, updated_at = NOW()
       WHERE id = $1`,
      [id, code, expiresAt]
    );
  }

  // Подтверждаем email пользователя после успешной верификации.
  static async confirmEmail(id) {
    // Устанавливаем флаг email_verified и очищаем код верификации.
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_code = NULL,
           verification_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  // Получаем список всех пользователей (используется админом).
  static async findAll() {
    // Формируем SELECT-запрос с сортировкой по дате создания.
    const { rows } = await pool.query(
      `SELECT id, email, display_name, role, avatar_url, email_verified, created_at
       FROM users ORDER BY created_at DESC`
    );
    // Возвращаем массив всех пользователей.
    return rows;
  }

  // Админ обновляет данные пользователя (только имя и аватар).
  static async adminUpdate(id, { displayName, avatarUrl }) {
    // COALESCE предотвращает затирание значения при null.
    const { rows } = await pool.query(
      `UPDATE users
       SET display_name = COALESCE($2, display_name),
           avatar_url   = COALESCE($3, avatar_url),
           updated_at   = NOW()
       WHERE id = $1
       RETURNING id, email, display_name, role, avatar_url, email_verified, created_at`,
      [id, displayName, avatarUrl]
    );
    // Возвращаем обновлённого пользователя или null.
    return rows[0] || null;
  }

  // Удаляем пользователя из базы (используется админом).
  static async deleteUser(id) {
    // Выполняем DELETE-запрос и проверяем количество затронутых строк.
    const { rowCount } = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    // Возвращаем true, если пользователь был удалён.
    return rowCount > 0;
  }
}

// Экспортируем репозиторий для использования в сервисах.
module.exports = UserRepository;
