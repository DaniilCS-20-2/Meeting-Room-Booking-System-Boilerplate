const express = require("express");
const multer = require("multer");
const path = require("path");
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
});

router.put("/", authMiddleware, profileController.updateProfile);
router.post("/avatar", authMiddleware, upload.single("avatar"), profileController.uploadAvatar);
router.post("/password/request", authMiddleware, profileController.requestPasswordChange);
router.post("/password/confirm", authMiddleware, profileController.confirmPasswordChange);
router.post("/email/request", authMiddleware, profileController.requestEmailChange);
router.post("/email/confirm", authMiddleware, profileController.confirmEmailChange);

module.exports = router;
