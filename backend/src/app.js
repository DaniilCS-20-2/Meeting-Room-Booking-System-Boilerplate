// Импортируем Express для создания HTTP-приложения.
const express = require("express");
// Импортируем CORS для разрешения кросс-доменных запросов с фронтенда.
const cors = require("cors");
// Импортируем конфигурацию окружения.
const env = require("./config/env");

// Импортируем маршруты аутентификации.
const authRoutes = require("./routes/authRoutes");
// Импортируем маршруты комнат.
const roomRoutes = require("./routes/roomRoutes");
// Импортируем маршруты бронирований.
const bookingRoutes = require("./routes/bookingRoutes");
// Импортируем маршруты профиля.
const profileRoutes = require("./routes/profileRoutes");
// Импортируем маршруты комментариев.
const commentRoutes = require("./routes/commentRoutes");
// Импортируем маршруты администрирования.
const adminRoutes = require("./routes/adminRoutes");

// Импортируем глобальный middleware обработки ошибок.
const errorMiddleware = require("./middlewares/errorMiddleware");

// Создаём экземпляр Express-приложения.
const app = express();

// Разрешаем CORS-запросы с URL фронтенда (из конфигурации).
app.use(cors({ origin: env.frontendUrl, credentials: true }));
// Подключаем JSON-парсер для разбора тела запросов.
app.use(express.json());

// Простейший healthcheck для мониторинга состояния сервиса.
app.get("/health", (_req, res) => {
  // Возвращаем статус «ok» для систем мониторинга.
  res.json({ status: "ok" });
});

// Монтируем API маршруты под соответствующими префиксами.
app.use("/api/auth", authRoutes);       // Аутентификация и регистрация.
app.use("/api/rooms", roomRoutes);       // CRUD комнат.
app.use("/api/bookings", bookingRoutes); // Бронирования.
app.use("/api/profile", profileRoutes);  // Профиль пользователя.
app.use("/api/comments", commentRoutes); // Комментарии к комнатам.
app.use("/api/admin", adminRoutes);      // Администрирование пользователей.

// Подключаем глобальный обработчик ошибок (должен быть последним middleware).
app.use(errorMiddleware);

// Экспортируем приложение для запуска и тестирования.
module.exports = app;
