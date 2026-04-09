// Загружаем переменные окружения из .env файла.
require("dotenv").config();

// Централизованный объект конфигурации для всего backend.
module.exports = {
  // URL подключения к PostgreSQL.
  databaseUrl: process.env.DATABASE_URL || "",
  // Секрет для подписи JWT токенов.
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  adminEmails: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};
