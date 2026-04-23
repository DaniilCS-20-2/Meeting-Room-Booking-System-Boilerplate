// Импортируем Router из Express для создания модульных маршрутов.
const express = require("express");
// Импортируем контроллер аутентификации.
const authController = require("../controllers/authController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");
// Лимитеры и валидатор — защищаем чувствительные ручки.
const { authLimiter, codeLimiter, mailLimiter } = require("../middlewares/rateLimitMiddleware");
const { validateBody } = require("../middlewares/validateMiddleware");
const {
  registerSchema, loginSchema, verifySchema,
  forgotPasswordSchema, resetPasswordSchema,
} = require("../validators/schemas");

// Создаём экземпляр роутера для auth-маршрутов.
const router = express.Router();

// POST /api/auth/register — регистрация нового пользователя.
router.post("/register", authLimiter, mailLimiter, validateBody(registerSchema), authController.register);
// POST /api/auth/login — логин по email и паролю.
router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.post("/verify", codeLimiter, validateBody(verifySchema), authController.verifyEmail);
router.post("/password/forgot", authLimiter, mailLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post("/password/reset", codeLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
// GET  /api/auth/me — получение данных текущего пользователя (требует JWT-токен).
router.get("/me", authMiddleware, authController.me);

// Экспортируем роутер аутентификации.
module.exports = router;
