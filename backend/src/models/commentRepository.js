// Импортируем пул подключений к PostgreSQL.
const pool = require("../db/pool");

// Создаём репозиторий комментариев для инкапсуляции SQL-запросов.
class CommentRepository {
  // Получаем комментарии по комнате (новые сверху).
  static async findByRoom(roomId) {
    // Формируем SELECT с JOIN на users для имени и аватара автора.
    const { rows } = await pool.query(
      `SELECT c.id, c.room_id, c.user_id, u.display_name AS user_name,
              u.avatar_url AS user_avatar, c.message, c.created_at
       FROM booking_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.room_id = $1
       ORDER BY c.created_at DESC`,
      [roomId]
    );
    // Возвращаем массив комментариев, отсортированных от новых к старым.
    return rows;
  }

  // Создаём новый комментарий к комнате.
  static async create({ roomId, userId, message }) {
    // Формируем параметризованный INSERT-запрос.
    const { rows } = await pool.query(
      `INSERT INTO booking_comments (room_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, room_id, user_id, message, created_at`,
      [roomId, userId, message]
    );
    // Возвращаем созданный комментарий.
    return rows[0];
  }

  // Удаляем комментарий по id (вызывается админом).
  static async deleteComment(id) {
    // Выполняем DELETE и проверяем количество затронутых строк.
    const { rowCount } = await pool.query(
      `DELETE FROM booking_comments WHERE id = $1`,
      [id]
    );
    // Возвращаем true, если комментарий был удалён.
    return rowCount > 0;
  }

  // Находим комментарий по UUID идентификатору.
  static async findById(id) {
    // Формируем SELECT-запрос по первичному ключу.
    const { rows } = await pool.query(
      `SELECT id, room_id, user_id, message, created_at
       FROM booking_comments WHERE id = $1`,
      [id]
    );
    // Возвращаем комментарий или null.
    return rows[0] || null;
  }
}

// Экспортируем репозиторий комментариев для сервисного слоя.
module.exports = CommentRepository;
