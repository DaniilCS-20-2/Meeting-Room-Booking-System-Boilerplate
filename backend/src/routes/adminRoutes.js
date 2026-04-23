// Импортируем Router из Express.
const express = require("express");
const multer = require("multer");
const path = require("path");
// Импортируем контроллер администрирования пользователей.
const adminController = require("../controllers/adminController");
const companyController = require("../controllers/companyController");
// Импортируем middleware проверки JWT-токена.
const authMiddleware = require("../middlewares/authMiddleware");
// Импортируем middleware проверки ролей (RBAC).
const rbacMiddleware = require("../middlewares/rbacMiddleware");

// Настраиваем multer для загрузки аватаров админом — сохраняем файлы
// в ту же папку /uploads, что и профильный роут, по схожему шаблону имени.
const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `avatar-${req.params.id}-${Date.now()}${ext}`);
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
});

// Создаём экземпляр роутера для админских маршрутов.
const router = express.Router();

// GET    /api/admin/users — список всех пользователей (только админ).
router.get("/users", authMiddleware, rbacMiddleware(["admin"]), adminController.getAllUsers);
// PUT    /api/admin/users/:id — редактирование пользователя (только имя и аватар).
router.put("/users/:id", authMiddleware, rbacMiddleware(["admin"]), adminController.updateUser);
// PUT    /api/admin/users/:id/company — смена компании пользователя.
router.put("/users/:id/company", authMiddleware, rbacMiddleware(["admin"]), adminController.updateUserCompany);
// POST   /api/admin/users/:id/avatar — загрузка нового аватара пользователя.
router.post("/users/:id/avatar", authMiddleware, rbacMiddleware(["admin"]),
  avatarUpload.single("avatar"), adminController.uploadUserAvatar);
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
