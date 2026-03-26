// Загружаем переменные окружения из файла .env.
require("dotenv").config();

// Экспортируем централизованный объект конфигурации для всего приложения.
module.exports = {
  // URL подключения к PostgreSQL.
  databaseUrl: process.env.DATABASE_URL || "",
  // Секрет для подписи JWT токенов.
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  // Разрешённый корпоративный домен email (например ferma.no).
  allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN || "ferma.no",
  // HTTP-порт для запуска сервера.
  port: Number(process.env.PORT || 4000),
};
