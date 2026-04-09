// Импортируем Router из Express.
const express = require("express");
// Импортируем контроллер комментариев.
const commentController = require("../controllers/commentController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");
// Импортируем middleware проверки ролей (RBAC).
const rbacMiddleware = require("../middlewares/rbacMiddleware");

// Создаём экземпляр роутера для маршрутов комментариев.
const router = express.Router();

// GET    /api/comments/room/:roomId — получение комментариев к комнате.
router.get("/room/:roomId", authMiddleware, commentController.getByRoom);
// POST   /api/comments/room/:roomId — создание комментария к комнате.
router.post("/room/:roomId", authMiddleware, commentController.create);
// DELETE /api/comments/:id — удаление комментария (только админ).
router.delete("/:id", authMiddleware, rbacMiddleware(["admin"]), commentController.remove);

// Экспортируем роутер комментариев.
module.exports = router;
