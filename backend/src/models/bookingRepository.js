// Импортируем пул подключений к PostgreSQL.
const pool = require("../db/pool");

// Создаём репозиторий бронирований для инкапсуляции SQL-запросов.
class BookingRepository {
  // Вставляем одно бронирование в рамках переданного клиента транзакции.
  static async insertBooking(client, bookingPayload) {
    // Формируем параметризованный SQL для защиты от SQL-инъекций.
    const query = `
      INSERT INTO bookings (room_id, user_id, start_time, end_time, status, recurrence_group_id, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, room_id, user_id, start_time, end_time, status, recurrence_group_id, comment, created_at
    `;
    // Подготавливаем параметры в правильном порядке.
    const values = [
      bookingPayload.roomId,
      bookingPayload.userId,
      bookingPayload.startTime,
      bookingPayload.endTime,
      bookingPayload.status || "confirmed",
      bookingPayload.recurrenceGroupId || null,
      bookingPayload.comment || null,
    ];
    // Выполняем запрос через текущий транзакционный клиент.
    const { rows } = await client.query(query, values);
    // Возвращаем созданную запись.
    return rows[0];
  }

  // Проверяем наличие пересечений для комнаты и интервала времени.
  static async hasTimeConflict(client, roomId, startTime, endTime) {
    // Используем диапазоны PostgreSQL для корректной проверки пересечений.
    const query = `
      SELECT 1
      FROM bookings
      WHERE room_id = $1
        AND status IN ('pending', 'confirmed')
        AND tstzrange(start_time, end_time, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
      LIMIT 1
    `;
    // Запускаем запрос существования конфликта.
    const { rowCount } = await client.query(query, [roomId, startTime, endTime]);
    // Если найден хотя бы один ряд, конфликт существует.
    return rowCount > 0;
  }

  // Выполняем callback в транзакции с commit/rollback.
  static async withTransaction(callback) {
    // Берём клиент из пула.
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
      // Пробрасываем ошибку выше.
      throw error;
    } finally {
      // Возвращаем клиент обратно в пул.
      client.release();
    }
  }
}

// Экспортируем репозиторий для сервисного слоя.
module.exports = BookingRepository;
