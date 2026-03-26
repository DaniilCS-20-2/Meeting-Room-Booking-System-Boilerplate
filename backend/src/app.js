// Импортируем Express для создания HTTP-приложения.
const express = require("express");
// Импортируем маршруты аутентификации.
const authRoutes = require("./routes/authRoutes");
// Импортируем маршруты бронирований.
const bookingRoutes = require("./routes/bookingRoutes");
// Импортируем глобальный middleware обработки ошибок.
const errorMiddleware = require("./middlewares/errorMiddleware");

// Создаём экземпляр Express-приложения.
const app = express();

// Подключаем JSON-парсер для request body.
app.use(express.json());

// Простейший healthcheck для мониторинга сервиса.
app.get("/health", (_req, res) => {
  // Возвращаем состояние сервиса.
  res.status(200).json({ status: "ok" });
});

// Монтируем auth API под префиксом /api/auth.
app.use("/api/auth", authRoutes);
// Монтируем booking API под префиксом /api/bookings.
app.use("/api/bookings", bookingRoutes);

// Подключаем middleware ошибок после всех маршрутов.
app.use(errorMiddleware);

// Экспортируем приложение для запуска и тестирования.
module.exports = app;
