// Импортируем Router из Express.
const express = require("express");
// Импортируем контроллер бронирований.
const bookingController = require("../controllers/bookingController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");
const optionalAuthMiddleware = require("../middlewares/optionalAuthMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const { validateBody } = require("../middlewares/validateMiddleware");
const { createBookingSchema } = require("../validators/schemas");

// Создаём экземпляр роутера для маршрутов бронирований.
const router = express.Router();

// Разрешённые роли «писать в календарь» — обычный юзер и админ.
// Viewer (read-only) от записи отрезан жёстко на уровне роутера.
const writers = rbacMiddleware(["user", "admin"]);

// POST   /api/bookings — создание бронирования (одиночного или recurring).
router.post("/", authMiddleware, writers, validateBody(createBookingSchema), bookingController.createBooking);
// GET    /api/bookings/my — бронирования текущего пользователя.
router.get("/my", authMiddleware, bookingController.getMy);
// GET    /api/bookings/room/:roomId — публично (анонимы видят занятость без имён).
router.get("/room/:roomId", optionalAuthMiddleware, bookingController.getByRoom);
// GET    /api/bookings/room/:roomId/history — полная история. Только для авторизованных.
router.get("/room/:roomId/history", authMiddleware, bookingController.getHistoryByRoom);
// PATCH  /api/bookings/:id/cancel — отмена бронирования (своё или любое для админа).
router.patch("/:id/cancel", authMiddleware, writers, bookingController.cancel);

// Экспортируем роутер бронирований.
module.exports = router;
