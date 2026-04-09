// Импортируем Router из Express.
const express = require("express");
// Импортируем контроллер бронирований.
const bookingController = require("../controllers/bookingController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");

// Создаём экземпляр роутера для маршрутов бронирований.
const router = express.Router();

// POST   /api/bookings — создание бронирования (одиночного или recurring).
router.post("/", authMiddleware, bookingController.createBooking);
// GET    /api/bookings/my — бронирования текущего пользователя.
router.get("/my", authMiddleware, bookingController.getMy);
// GET    /api/bookings/room/:roomId — бронирования комнаты за период (для календаря).
router.get("/room/:roomId", authMiddleware, bookingController.getByRoom);
// GET    /api/bookings/room/:roomId/history — полная история бронирований комнаты.
router.get("/room/:roomId/history", authMiddleware, bookingController.getHistoryByRoom);
// PATCH  /api/bookings/:id/cancel — отмена бронирования (своё или любое для админа).
router.patch("/:id/cancel", authMiddleware, bookingController.cancel);

// Экспортируем роутер бронирований.
module.exports = router;
