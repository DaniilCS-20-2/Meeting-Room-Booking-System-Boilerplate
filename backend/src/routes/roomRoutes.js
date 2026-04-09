const express = require("express");
const multer = require("multer");
const path = require("path");
const roomController = require("../controllers/roomController");
const authMiddleware = require("../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `room-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
});

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
router.post("/:id/photo", authMiddleware, rbacMiddleware(["admin"]), upload.single("photo"), roomController.uploadPhoto);
router.delete("/:id/photo", authMiddleware, rbacMiddleware(["admin"]), roomController.deletePhoto);
router.patch("/:id/disable", authMiddleware, rbacMiddleware(["admin"]), roomController.toggleDisabled);

// Экспортируем роутер комнат.
module.exports = router;
