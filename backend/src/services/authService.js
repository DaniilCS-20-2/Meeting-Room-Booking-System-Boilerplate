// Импортируем bcrypt для безопасной работы с паролями.
const bcrypt = require("bcryptjs");
// Импортируем jwt для токенов аутентификации.
const jwt = require("jsonwebtoken");
// Импортируем конфигурацию приложения.
const env = require("../config/env");
// Импортируем репозиторий пользователей.
const UserRepository = require("../models/userRepository");
// Импортируем типизированную HTTP-ошибку.
const HttpError = require("../utils/httpError");

// Создаём сервис аутентификации.
class AuthService {
  // Проверяем, что email принадлежит разрешённому домену.
  static validateEmailDomain(email) {
    // Выделяем доменную часть email.
    const domainPart = String(email).split("@")[1]?.toLowerCase();
    // Проверяем совпадение с корпоративным доменом.
    if (!domainPart || domainPart !== env.allowedEmailDomain.toLowerCase()) {
      // Возвращаем 400 при нарушении domain policy.
      throw new HttpError(400, `Email domain must be ${env.allowedEmailDomain}.`);
    }
  }

  // Регистрируем пользователя по email и паролю.
  static async register({ email, password }) {
    // Проверяем обязательность входных данных.
    if (!email || !password) {
      // Возвращаем 400 при отсутствии email/password.
      throw new HttpError(400, "Email and password are required.");
    }

    // Валидируем домен email согласно требованиям.
    AuthService.validateEmailDomain(email);
    // Проверяем, не занят ли email.
    const existingUser = await UserRepository.findByEmail(email);
    // Если пользователь существует, возвращаем конфликт.
    if (existingUser) {
      throw new HttpError(409, "User with this email already exists.");
    }

    // Хэшируем пароль с безопасным cost-factor.
    const passwordHash = await bcrypt.hash(password, 10);
    // Создаём пользователя в БД.
    const user = await UserRepository.createUser({ email, passwordHash, role: "user" });
    // Выпускаем JWT токен для клиента.
    const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, { expiresIn: "12h" });

    // Возвращаем публичные данные пользователя и токен.
    return { user, token };
  }

  // Выполняем логин пользователя.
  static async login({ email, password }) {
    // Проверяем обязательные поля.
    if (!email || !password) {
      // Возвращаем 400 при неполных данных.
      throw new HttpError(400, "Email and password are required.");
    }

    // Ищем пользователя по email.
    const user = await UserRepository.findByEmail(email);
    // Если пользователь не найден, возвращаем 401.
    if (!user) {
      throw new HttpError(401, "Invalid credentials.");
    }

    // Проверяем пароль через bcrypt.
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    // При неверном пароле возвращаем 401.
    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid credentials.");
    }

    // Формируем JWT после успешной аутентификации.
    const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, { expiresIn: "12h" });

    // Возвращаем токен и базовые данные пользователя.
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }
}

// Экспортируем AuthService.
module.exports = AuthService;
