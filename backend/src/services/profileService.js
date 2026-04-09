const bcrypt = require("bcryptjs");
const UserRepository = require("../models/userRepository");
const HttpError = require("../utils/httpError");
const { sendVerificationCode } = require("../utils/mailer");

class ProfileService {
  static async updateProfile(userId, { displayName, avatarUrl }) {
    const user = await UserRepository.updateProfile(userId, { displayName, avatarUrl });
    if (!user) throw new HttpError(404, "User not found.");
    return user;
  }

  static async requestPasswordChange(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw new HttpError(400, "Current and new password are required.");
    }
    const userBasic = await UserRepository.findById(userId);
    const user = userBasic ? await UserRepository.findByEmail(userBasic.email) : null;
    if (!user) throw new HttpError(404, "User not found.");

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new HttpError(400, "Current password is incorrect.");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await UserRepository.setVerificationCode(user.id, code, expiresAt);

    await sendVerificationCode(user.email, code);

    return { codeSent: true };
  }

  static async confirmPasswordChange(userId, { code, newPassword }) {
    if (!code || !newPassword) {
      throw new HttpError(400, "Code and new password are required.");
    }
    const userBasic = await UserRepository.findById(userId);
    const user = userBasic ? await UserRepository.findByEmail(userBasic.email) : null;
    if (!user) throw new HttpError(404, "User not found.");

    if (!user.verification_code) throw new HttpError(400, "No verification code set.");
    if (new Date() > new Date(user.verification_expires_at)) {
      throw new HttpError(400, "Verification code expired.");
    }
    if (user.verification_code !== code) {
      throw new HttpError(400, "Invalid verification code.");
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await UserRepository.updatePassword(userId, hash);
    await UserRepository.confirmEmail(userId);

    return { changed: true };
  }

  static async requestEmailChange(userId, { newEmail, password }) {
    if (!newEmail || !password) {
      throw new HttpError(400, "New email and password are required.");
    }
    const userBasic = await UserRepository.findById(userId);
    const user = userBasic ? await UserRepository.findByEmail(userBasic.email) : null;
    if (!user) throw new HttpError(404, "User not found.");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new HttpError(400, "Password is incorrect.");

    const existing = await UserRepository.findByEmail(newEmail);
    if (existing) throw new HttpError(409, "Email already in use.");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await UserRepository.setVerificationCode(user.id, code, expiresAt);

    await sendVerificationCode(newEmail, code);

    return { codeSent: true };
  }

  static async confirmEmailChange(userId, { code, newEmail }) {
    if (!code || !newEmail) {
      throw new HttpError(400, "Code and new email are required.");
    }
    const userBasic = await UserRepository.findById(userId);
    const user = userBasic ? await UserRepository.findByEmail(userBasic.email) : null;
    if (!user) throw new HttpError(404, "User not found.");

    if (!user.verification_code) throw new HttpError(400, "No verification code set.");
    if (new Date() > new Date(user.verification_expires_at)) {
      throw new HttpError(400, "Verification code expired.");
    }
    if (user.verification_code !== code) {
      throw new HttpError(400, "Invalid verification code.");
    }

    const updated = await UserRepository.updateEmail(userId, newEmail);
    return { changed: true, email: updated.email };
  }
}

module.exports = ProfileService;
