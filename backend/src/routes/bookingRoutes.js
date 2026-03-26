// Импортируем Router из Express.
const express = require("express");
// Импортируем контроллер бронирований.
const bookingController = require("../controllers/bookingController");
// Импортируем middleware аутентификации.
const authMiddleware = require("../middlewares/authMiddleware");
// Импортируем middleware RBAC для разграничения ролей.
const rbacMiddleware = require("../middlewares/rbacMiddleware");

// Создаём роутер для API бронирований.
const bookingRouter = express.Router();

// Разрешаем создание бронирования для user и admin ролей.
bookingRouter.post("/", authMiddleware, rbacMiddleware(["user", "admin"]), bookingController.createBooking);

// Экспортируем роутер бронирований.
module.exports = bookingRouter;
