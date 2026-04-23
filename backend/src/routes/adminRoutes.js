// Импортируем Router из Express.
const express = require("express");
// Импортируем контроллер администрирования пользователей.
const adminController = require("../controllers/adminController");
const companyController = require("../controllers/companyController");
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
// PUT    /api/admin/users/:id/company — смена компании пользователя.
router.put("/users/:id/company", authMiddleware, rbacMiddleware(["admin"]), adminController.updateUserCompany);
// DELETE /api/admin/users/:id — удаление пользователя.
router.delete("/users/:id", authMiddleware, rbacMiddleware(["admin"]), adminController.deleteUser);

// Управление компаниями (selskap) — только админ.
router.get("/companies", authMiddleware, rbacMiddleware(["admin"]), companyController.getAll);
router.post("/companies", authMiddleware, rbacMiddleware(["admin"]), companyController.create);
router.put("/companies/:id", authMiddleware, rbacMiddleware(["admin"]), companyController.update);
router.delete("/companies/:id", authMiddleware, rbacMiddleware(["admin"]), companyController.remove);

// Управление историей бронирований — только админ.
router.delete("/bookings/:id", authMiddleware, rbacMiddleware(["admin"]), adminController.deleteBooking);
router.delete("/rooms/:roomId/history", authMiddleware, rbacMiddleware(["admin"]), adminController.clearRoomHistory);

// Whitelist е-постов: только админ.
router.get("/whitelist", authMiddleware, rbacMiddleware(["admin"]), adminController.getWhitelist);
router.post("/whitelist", authMiddleware, rbacMiddleware(["admin"]), adminController.addWhitelist);
router.put("/whitelist/:id", authMiddleware, rbacMiddleware(["admin"]), adminController.updateWhitelistRole);
router.delete("/whitelist/:id", authMiddleware, rbacMiddleware(["admin"]), adminController.deleteWhitelist);

// Экспортируем роутер администрирования.
module.exports = router;
