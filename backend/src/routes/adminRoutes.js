// Импортируем Router из Express.
const express = require("express");
// Импортируем контроллер администрирования пользователей.
const adminController = require("../controllers/adminController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");
// Импортируем middleware проверки ролей (RBAC).
const rbacMiddleware = require("../middlewares/rbacMiddleware");

// Создаём экземпляр роутера для админских маршрутов.
const router = express.Router();

// GET    /api/admin/users — список всех пользователей (только админ).
router.get("/users", authMiddleware, rbacMiddleware(["admin"]), adminController.getAllUsers);
// PUT    /api/admin/users/:id — редактирование пользователя (только имя и аватар).
router.put("/users/:id", authMiddleware, rbacMiddleware(["admin"]), adminController.updateUser);
// DELETE /api/admin/users/:id — удаление пользователя.
router.delete("/users/:id", authMiddleware, rbacMiddleware(["admin"]), adminController.deleteUser);

// Whitelist е-постов: только админ.
router.get("/whitelist", authMiddleware, rbacMiddleware(["admin"]), adminController.getWhitelist);
router.post("/whitelist", authMiddleware, rbacMiddleware(["admin"]), adminController.addWhitelist);
router.put("/whitelist/:id", authMiddleware, rbacMiddleware(["admin"]), adminController.updateWhitelistRole);
router.delete("/whitelist/:id", authMiddleware, rbacMiddleware(["admin"]), adminController.deleteWhitelist);

// Экспортируем роутер администрирования.
module.exports = router;
