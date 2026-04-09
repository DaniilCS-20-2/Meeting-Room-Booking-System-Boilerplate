const ProfileService = require("../services/profileService");

const updateProfile = async (req, res, next) => {
  try {
    const user = await ProfileService.updateProfile(req.user.id, {
      displayName: req.body.displayName,
      avatarUrl: req.body.avatarUrl,
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const requestPasswordChange = async (req, res, next) => {
  try {
    const result = await ProfileService.requestPasswordChange(req.user.id, {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const confirmPasswordChange = async (req, res, next) => {
  try {
    const result = await ProfileService.confirmPasswordChange(req.user.id, {
      code: req.body.code,
      newPassword: req.body.newPassword,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const requestEmailChange = async (req, res, next) => {
  try {
    const result = await ProfileService.requestEmailChange(req.user.id, {
      newEmail: req.body.newEmail,
      password: req.body.password,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const confirmEmailChange = async (req, res, next) => {
  try {
    const result = await ProfileService.confirmEmailChange(req.user.id, {
      code: req.body.code,
      newEmail: req.body.newEmail,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateProfile, requestPasswordChange, confirmPasswordChange,
  requestEmailChange, confirmEmailChange,
};
