// Импортируем Router из Express.
const express = require("express");
// Импортируем auth-контроллер.
const authController = require("../controllers/authController");

// Создаём экземпляр роутера auth-маршрутов.
const authRouter = express.Router();

// Путь регистрации пользователя.
authRouter.post("/register", authController.register);
// Путь логина пользователя.
authRouter.post("/login", authController.login);

// Экспортируем роутер auth.
module.exports = authRouter;
