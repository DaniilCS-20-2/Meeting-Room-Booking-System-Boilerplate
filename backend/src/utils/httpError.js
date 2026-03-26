// Создаём специализированный класс ошибки для HTTP-ответов.
class HttpError extends Error {
  // Конструктор принимает статус, сообщение и произвольные детали.
  constructor(statusCode, message, details = null) {
    // Передаём сообщение в базовый класс Error.
    super(message);
    // Сохраняем HTTP-статус для middleware обработки ошибок.
    this.statusCode = statusCode;
    // Сохраняем дополнительные детали ошибки для отладки/клиента.
    this.details = details;
  }
}

// Экспортируем класс для единообразной генерации ошибок.
module.exports = HttpError;
