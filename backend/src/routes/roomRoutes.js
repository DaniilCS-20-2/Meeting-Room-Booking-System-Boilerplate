// Импортируем Router из Express.
const express = require("express");
// Импортируем контроллер комнат.
const roomController = require("../controllers/roomController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");
// Импортируем middleware проверки ролей (RBAC).
const rbacMiddleware = require("../middlewares/rbacMiddleware");

// Создаём экземпляр роутера для маршрутов комнат.
const router = express.Router();

// GET    /api/rooms — список всех комнат (требует авторизацию).
router.get("/", authMiddleware, roomController.getAll);
// GET    /api/rooms/:id — детали одной комнаты (требует авторизацию).
router.get("/:id", authMiddleware, roomController.getById);
// POST   /api/rooms — создание комнаты (только админ).
router.post("/", authMiddleware, rbacMiddleware(["admin"]), roomController.create);
// PUT    /api/rooms/:id — обновление комнаты (только админ).
router.put("/:id", authMiddleware, rbacMiddleware(["admin"]), roomController.update);
// DELETE /api/rooms/:id — удаление комнаты (только админ).
router.delete("/:id", authMiddleware, rbacMiddleware(["admin"]), roomController.remove);
// PATCH  /api/rooms/:id/disable — вкл/выкл комнату (только админ).
router.patch("/:id/disable", authMiddleware, rbacMiddleware(["admin"]), roomController.toggleDisabled);

// Экспортируем роутер комнат.
module.exports = router;
