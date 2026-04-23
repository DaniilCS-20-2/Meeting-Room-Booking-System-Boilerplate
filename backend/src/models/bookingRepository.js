// Импортируем пул подключений к PostgreSQL.
const pool = require("../db/pool");

// Создаём репозиторий бронирований для инкапсуляции SQL-запросов.
class BookingRepository {
  // Вставляем одно бронирование в рамках переданного транзакционного клиента.
  static async insertBooking(client, payload) {
    // Формируем параметризованный INSERT-запрос для защиты от SQL-инъекций.
    const query = `
      INSERT INTO bookings (room_id, user_id, start_time, end_time, status, recurrence_group_id, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, room_id, user_id, start_time, end_time, status,
                recurrence_group_id, comment, created_at`;
    // Подготавливаем массив параметров в правильном порядке.
    const values = [
      payload.roomId,
      payload.userId,
      payload.startTime,
      payload.endTime,
      // Статус по умолчанию «confirmed» — бронирование подтверждено сразу.
      payload.status || "confirmed",
      // Идентификатор группы recurring-бронирований (null для одиночных).
      payload.recurrenceGroupId || null,
      // Комментарий пользователя при создании (необязательный).
      payload.comment || null,
    ];
    // Выполняем запрос через текущий транзакционный клиент.
    const { rows } = await client.query(query, values);
    // Возвращаем созданную запись бронирования.
    return rows[0];
  }

  // Проверяем наличие пересечений для комнаты и интервала времени.
  static async hasTimeConflict(client, roomId, startTime, endTime) {
    // Используем диапазоны PostgreSQL (tstzrange) для проверки пересечений.
    const { rowCount } = await client.query(
      `SELECT 1 FROM bookings
       WHERE room_id = $1
         AND status IN ('pending', 'confirmed')
         AND tstzrange(start_time, end_time, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
       LIMIT 1`,
      [roomId, startTime, endTime]
    );
    // Если найден хотя бы один ряд, конфликт существует.
    return rowCount > 0;
  }

  // Выполняем callback внутри транзакции с автоматическим commit/rollback.
  static async withTransaction(callback) {
    // Берём клиент из пула для изолированной транзакции.
    const client = await pool.connect();
    try {
      // Открываем транзакцию.
      await client.query("BEGIN");
      // Выполняем бизнес-логику внутри транзакции.
      const result = await callback(client);
      // Подтверждаем транзакцию после успешного выполнения.
      await client.query("COMMIT");
      // Возвращаем результат callback.
      return result;
    } catch (error) {
      // Откатываем транзакцию при любой ошибке.
      await client.query("ROLLBACK");
      // Пробрасываем ошибку выше для обработки.
      throw error;
    } finally {
      // Возвращаем клиент обратно в пул (обязательно).
      client.release();
    }
  }

  // Получаем бронирования по комнате за период (для календаря).
  static async findByRoom(roomId, { from, to } = {}) {
    // Используем LEFT JOIN + COALESCE со snapshot'ами, чтобы бронирования
    // продолжали отображаться после удаления пользователя/компании.
    let query = `
      SELECT b.id, b.room_id, b.user_id,
             COALESCE(u.display_name, b.user_name_snapshot)  AS user_name,
             u.company_id,
             COALESCE(c.name,  b.company_name_snapshot)      AS company_name,
             COALESCE(c.color, b.company_color_snapshot)     AS company_color,
             b.start_time, b.end_time, b.status, b.recurrence_group_id, b.comment, b.created_at
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE b.room_id = $1 AND b.status IN ('pending', 'confirmed')`;
    // Массив параметров запроса.
    const params = [roomId];
    // Если передана нижняя граница, фильтруем бронирования, заканчивающиеся после неё.
    if (from) {
      params.push(from);
      query += ` AND b.end_time >= $${params.length}`;
    }
    // Если передана верхняя граница, фильтруем бронирования, начинающиеся до неё.
    if (to) {
      params.push(to);
      query += ` AND b.start_time <= $${params.length}`;
    }
    // Сортируем по времени начала для календарного отображения.
    query += " ORDER BY b.start_time ASC";
    // Выполняем запрос.
    const { rows } = await pool.query(query, params);
    // Возвращаем массив бронирований.
    return rows;
  }

  // Получаем полную историю бронирований комнаты (включая отменённые).
  static async findHistoryByRoom(roomId) {
    // LEFT JOIN + COALESCE: история сохраняется даже если пользователь/компания
    // были удалены — тогда используем snapshot-поля из самой строки бронирования.
    const { rows } = await pool.query(
      `SELECT b.id, b.room_id, b.user_id,
              COALESCE(u.display_name, b.user_name_snapshot)  AS user_name,
              u.company_id,
              COALESCE(c.name,  b.company_name_snapshot)      AS company_name,
              COALESCE(c.color, b.company_color_snapshot)     AS company_color,
              b.start_time, b.end_time, b.status, b.comment, b.created_at
       FROM bookings b
       LEFT JOIN users u ON u.id = b.user_id
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE b.room_id = $1
       ORDER BY b.start_time DESC`,
      [roomId]
    );
    // Возвращаем массив всех бронирований комнаты.
    return rows;
  }

  // Жёстко удаляем одно бронирование из таблицы (админ).
  static async hardDelete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM bookings WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }

  // Удаляем из истории комнаты все прошедшие и отменённые бронирования
  // (активные будущие НЕ трогаем, чтобы не сломать текущие брони).
  static async clearRoomHistory(roomId) {
    const { rowCount } = await pool.query(
      `DELETE FROM bookings
       WHERE room_id = $1
         AND (status = 'cancelled' OR end_time < NOW())`,
      [roomId]
    );
    return rowCount;
  }

  // Получаем бронирования конкретного пользователя.
  static async findByUser(userId) {
    // Формируем запрос с JOIN на rooms для отображения имени комнаты.
    const { rows } = await pool.query(
      `SELECT b.id, b.room_id, r.name AS room_name,
              b.start_time, b.end_time, b.status, b.comment, b.created_at
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
       WHERE b.user_id = $1
       ORDER BY b.start_time DESC`,
      [userId]
    );
    // Возвращаем массив бронирований пользователя.
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT b.id, b.room_id, b.user_id, b.start_time, b.end_time, b.status, b.comment, b.created_at,
              COALESCE(u.email,        b.user_email_snapshot) AS user_email,
              COALESCE(u.display_name, b.user_name_snapshot)  AS user_name,
              r.name AS room_name
       FROM bookings b
       LEFT JOIN users u ON u.id = b.user_id
       JOIN rooms r ON r.id = b.room_id
       WHERE b.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  // Отменяем бронирование (меняем статус на 'cancelled').
  static async cancel(id) {
    // Обновляем статус только для активных бронирований (pending/confirmed).
    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND status IN ('pending', 'confirmed')
       RETURNING *`,
      [id]
    );
    // Возвращаем отменённое бронирование или null, если уже было отменено.
    return rows[0] || null;
  }

  // Получаем будущие бронирования комнаты (для поиска свободных слотов).
  static async findNextFreeSlots(roomId) {
    // Выбираем все активные будущие бронирования комнаты.
    const { rows } = await pool.query(
      `SELECT start_time, end_time FROM bookings
       WHERE room_id = $1
         AND status IN ('pending', 'confirmed')
         AND end_time > NOW()
       ORDER BY start_time ASC`,
      [roomId]
    );
    // Возвращаем массив занятых интервалов.
    return rows;
  }
}

// Экспортируем репозиторий бронирований для сервисного слоя.
module.exports = BookingRepository;
