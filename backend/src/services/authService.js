const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const UserRepository = require("../models/userRepository");
const HttpError = require("../utils/httpError");
const { sendVerificationCode } = require("../utils/mailer");

const pendingRegistrations = new Map();

class AuthService {
  static async register({ email, password, displayName }) {
    if (!email || !password) {
      throw new HttpError(400, "Email and password are required.");
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new HttpError(409, "User with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    pendingRegistrations.set(email.toLowerCase(), {
      email, displayName: displayName || "", passwordHash, code, expiresAt,
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

    const isAdmin = env.adminEmails.includes(pending.email.toLowerCase());
    const user = await UserRepository.createUser({
      email: pending.email,
      displayName: pending.displayName,
      passwordHash: pending.passwordHash,
      role: isAdmin ? "admin" : "user",
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
