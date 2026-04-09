// Импортируем Router из Express.
const express = require("express");
// Импортируем контроллер профиля.
const profileController = require("../controllers/profileController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");

// Создаём экземпляр роутера для маршрутов профиля.
const router = express.Router();

// PUT  /api/profile — обновление профиля (имя, аватар).
router.put("/", authMiddleware, profileController.updateProfile);
// PUT  /api/profile/password — смена пароля (требует текущий пароль).
router.put("/password", authMiddleware, profileController.changePassword);

// Экспортируем роутер профиля.
module.exports = router;
