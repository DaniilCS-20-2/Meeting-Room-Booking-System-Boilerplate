const express = require("express");
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/authMiddleware");
const { authLimiter, codeLimiter, mailLimiter } = require("../middlewares/rateLimitMiddleware");
const { validateBody } = require("../middlewares/validateMiddleware");
const { processImage } = require("../middlewares/imageUploadMiddleware");
const {
  updateProfileSchema,
  requestPasswordChangeSchema,
  confirmPasswordChangeSchema,
  requestEmailChangeSchema,
  confirmEmailChangeSchema,
} = require("../validators/schemas");

const router = express.Router();

router.put("/", authMiddleware, validateBody(updateProfileSchema), profileController.updateProfile);
router.post("/avatar", authMiddleware,
  ...processImage({ fieldName: "avatar", prefix: "avatar", maxSide: 512, quality: 85 }),
  profileController.uploadAvatar);
router.post("/password/request", authMiddleware, authLimiter, mailLimiter,
  validateBody(requestPasswordChangeSchema), profileController.requestPasswordChange);
router.post("/password/confirm", authMiddleware, codeLimiter,
  validateBody(confirmPasswordChangeSchema), profileController.confirmPasswordChange);
router.post("/email/request", authMiddleware, authLimiter, mailLimiter,
  validateBody(requestEmailChangeSchema), profileController.requestEmailChange);
router.post("/email/confirm", authMiddleware, codeLimiter,
  validateBody(confirmEmailChangeSchema), profileController.confirmEmailChange);

module.exports = router;
