const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const UserRepository = require("../models/userRepository");
const WhitelistRepository = require("../models/whitelistRepository");
const CompanyRepository = require("../models/companyRepository");
const HttpError = require("../utils/httpError");
const { sendVerificationCode } = require("../utils/mailer");

const pendingRegistrations = new Map();

class AuthService {
  static async register({ email, password, displayName, companyId }) {
    if (!email || !password) {
      throw new HttpError(400, "Email and password are required.");
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new HttpError(409, "User with this email already exists.");
    }

    const whitelisted = await WhitelistRepository.findByEmail(email);
    if (!whitelisted) {
      throw new HttpError(403, "E-posten er ikkje godkjend for registrering.");
    }

    // Проверяем компанию: если компании существуют — выбор обязателен.
    let resolvedCompanyId = null;
    const companies = await CompanyRepository.findAll();
    if (companies.length > 0) {
      if (!companyId) {
        throw new HttpError(400, "Vel eit selskap.");
      }
      const company = companies.find((c) => c.id === companyId);
      if (!company) {
        throw new HttpError(400, "Ugyldig selskap.");
      }
      resolvedCompanyId = company.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    pendingRegistrations.set(email.toLowerCase(), {
      email,
      displayName: displayName || "",
      passwordHash,
      code,
      expiresAt,
      role: whitelisted.role,
      companyId: resolvedCompanyId,
    });

    await sendVerificationCode(email, code);

    const pendingToken = jwt.sign(
      { email: email.toLowerCase(), type: "pending_registration" },
      env.jwtSecret,
      { expiresIn: "15m" }
    );

    return { pendingToken, verificationRequired: true };
  }

  static async verifyEmail({ pendingToken, code }) {
    let payload;
    try {
      payload = jwt.verify(pendingToken, env.jwtSecret);
    } catch {
      throw new HttpError(400, "Invalid or expired token.");
    }
    if (payload.type !== "pending_registration") {
      throw new HttpError(400, "Invalid token type.");
    }

    const emailKey = payload.email;
    const pending = pendingRegistrations.get(emailKey);
    if (!pending) throw new HttpError(400, "No pending registration found. Please register again.");

    if (new Date() > pending.expiresAt) {
      pendingRegistrations.delete(emailKey);
      throw new HttpError(400, "Verification code expired. Please register again.");
    }
    if (pending.code !== code) {
      throw new HttpError(400, "Invalid verification code.");
    }

    const existingAgain = await UserRepository.findByEmail(pending.email);
    if (existingAgain) {
      pendingRegistrations.delete(emailKey);
      throw new HttpError(409, "User with this email already exists.");
    }

    const whitelisted = await WhitelistRepository.findByEmail(pending.email);
    const role = pending.role || (whitelisted ? whitelisted.role : "user");
    const user = await UserRepository.createUser({
      email: pending.email,
      displayName: pending.displayName,
      passwordHash: pending.passwordHash,
      role,
      companyId: pending.companyId || null,
    });
    await UserRepository.confirmEmail(user.id);
    pendingRegistrations.delete(emailKey);

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      env.jwtSecret,
      { expiresIn: "12h" }
    );

    return { user, token, verified: true };
  }

  // Выполняем логин пользователя по email и паролю.
  static async login({ email, password }) {
    // Проверяем обязательные поля.
    if (!email || !password) {
      throw new HttpError(400, "Email and password are required.");
    }
    // Ищем пользователя по email.
    const user = await UserRepository.findByEmail(email);
    // Если не найден — возвращаем обезличенную ошибку 401.
    if (!user) throw new HttpError(401, "Invalid credentials.");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new HttpError(401, "Invalid credentials.");

    if (!user.email_verified) {
      throw new HttpError(403, "Email not verified. Please register again.");
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      env.jwtSecret,
      { expiresIn: "12h" }
    );

    // Возвращаем публичные данные пользователя и токен.
    return {
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
      },
      token,
    };
  }

  static async forgotPassword({ email }) {
    if (!email) {
      throw new HttpError(400, "Email is required.");
    }
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return { codeSent: true };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await UserRepository.setVerificationCode(user.id, code, expiresAt);
    await sendVerificationCode(user.email, code);

    return { codeSent: true };
  }

  static async resetPassword({ email, code, newPassword }) {
    if (!email || !code || !newPassword) {
      throw new HttpError(400, "Email, code and new password are required.");
    }
    if (String(newPassword).length < 6) {
      throw new HttpError(400, "Password must be at least 6 characters.");
    }
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new HttpError(400, "Invalid verification code.");

    if (!user.verification_code) throw new HttpError(400, "Invalid verification code.");
    if (new Date() > new Date(user.verification_expires_at)) {
      throw new HttpError(400, "Verification code expired.");
    }
    if (user.verification_code !== code) {
      throw new HttpError(400, "Invalid verification code.");
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await UserRepository.updatePassword(user.id, hash);
    await UserRepository.confirmEmail(user.id);

    return { reset: true };
  }

  static async me(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new HttpError(404, "User not found.");
    if (!user.email_verified) {
      throw new HttpError(403, "Email not verified.");
    }
    return user;
  }
}

// Экспортируем сервис аутентификации для контроллеров.
module.exports = AuthService;
