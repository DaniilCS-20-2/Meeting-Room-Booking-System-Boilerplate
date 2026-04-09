// Загружаем переменные окружения из .env файла.
require("dotenv").config();

// Централизованный объект конфигурации для всего backend.
module.exports = {
  // URL подключения к PostgreSQL.
  databaseUrl: process.env.DATABASE_URL || "",
  // Секрет для подписи JWT токенов.
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  // Разрешённый домен email для регистрации.
  allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN || "ferma.no",
  // HTTP-порт backend-сервера.
  port: Number(process.env.PORT || 4000),
  // URL фронтенда для CORS.
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
