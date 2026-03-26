// Глобальный middleware обработки ошибок Express.
const errorMiddleware = (error, _req, res, _next) => {
  // Получаем статус из ошибки или используем 500 по умолчанию.
  const statusCode = error.statusCode || 500;
  // Формируем JSON-ответ с понятным сообщением.
  res.status(statusCode).json({
    // Флаг успешности запроса.
    success: false,
    // Текст ошибки для клиента.
    message: error.message || "Internal Server Error",
    // Детали включаем только если они переданы явно.
    details: error.details || null,
  });
};

// Экспортируем middleware ошибки.
module.exports = errorMiddleware;
