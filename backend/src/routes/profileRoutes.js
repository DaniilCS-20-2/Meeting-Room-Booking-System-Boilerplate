// Импортируем Router из Express.
const express = require("express");
// Импортируем контроллер профиля.
const profileController = require("../controllers/profileController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");

// Создаём экземпляр роутера для маршрутов профиля.
const router = express.Router();

router.put("/", authMiddleware, profileController.updateProfile);
router.post("/password/request", authMiddleware, profileController.requestPasswordChange);
router.post("/password/confirm", authMiddleware, profileController.confirmPasswordChange);
router.post("/email/request", authMiddleware, profileController.requestEmailChange);
router.post("/email/confirm", authMiddleware, profileController.confirmEmailChange);

// Экспортируем роутер профиля.
module.exports = router;
