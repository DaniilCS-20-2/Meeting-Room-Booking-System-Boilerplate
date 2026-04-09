// Импортируем Router из Express для создания модульных маршрутов.
const express = require("express");
// Импортируем контроллер аутентификации.
const authController = require("../controllers/authController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");

// Создаём экземпляр роутера для auth-маршрутов.
const router = express.Router();

// POST /api/auth/register — регистрация нового пользователя.
router.post("/register", authController.register);
// POST /api/auth/login — логин по email и паролю.
router.post("/login", authController.login);
router.post("/verify", authController.verifyEmail);
// GET  /api/auth/me — получение данных текущего пользователя (требует JWT-токен).
router.get("/me", authMiddleware, authController.me);

// Экспортируем роутер аутентификации.
module.exports = router;
