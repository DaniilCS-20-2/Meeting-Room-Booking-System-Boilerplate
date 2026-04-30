const express = require("express");
const roomController = require("../controllers/roomController");
const authMiddleware = require("../middlewares/authMiddleware");
const optionalAuthMiddleware = require("../middlewares/optionalAuthMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const { validateBody } = require("../middlewares/validateMiddleware");
const { roomCreateSchema } = require("../validators/schemas");
const { processImage } = require("../middlewares/imageUploadMiddleware");

// Создаём экземпляр роутера для маршрутов комнат.
const router = express.Router();

// GET    /api/rooms — список комнат. Публично (анонимы видят сам список,
// но без админских флагов и без бронирования).
router.get("/", optionalAuthMiddleware, roomController.getAll);
// GET    /api/rooms/:id — детали одной комнаты. Тоже публично.
router.get("/:id", optionalAuthMiddleware, roomController.getById);
// POST   /api/rooms — создание комнаты (только админ).
router.post("/", authMiddleware, rbacMiddleware(["admin"]), validateBody(roomCreateSchema), roomController.create);
// PUT    /api/rooms/:id — обновление комнаты (только админ).
router.put("/:id", authMiddleware, rbacMiddleware(["admin"]), validateBody(roomCreateSchema), roomController.update);
// DELETE /api/rooms/:id — удаление комнаты (только админ).
router.delete("/:id", authMiddleware, rbacMiddleware(["admin"]), roomController.remove);
router.post("/:id/photo", authMiddleware, rbacMiddleware(["admin"]),
  ...processImage({ fieldName: "photo", prefix: "room", maxSide: 1600, quality: 82 }),
  roomController.uploadPhoto);
router.delete("/:id/photo", authMiddleware, rbacMiddleware(["admin"]), roomController.deletePhoto);
router.patch("/:id/disable", authMiddleware, rbacMiddleware(["admin"]), roomController.toggleDisabled);

// Экспортируем роутер комнат.
module.exports = router;
