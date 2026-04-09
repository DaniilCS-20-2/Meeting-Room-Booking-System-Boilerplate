// Импортируем bcrypt для безопасного хеширования паролей.
const bcrypt = require("bcryptjs");
// Импортируем jwt для генерации и верификации токенов аутентификации.
const jwt = require("jsonwebtoken");
// Импортируем конфигурацию приложения.
const env = require("../config/env");
// Импортируем репозиторий пользователей для работы с БД.
const UserRepository = require("../models/userRepository");
const HttpError = require("../utils/httpError");
const { sendVerificationCode } = require("../utils/mailer");

// Создаём сервис аутентификации — вся бизнес-логика авторизации.
class AuthService {
  // Проверяем, что email принадлежит разрешённому корпоративному домену.
  static validateEmailDomain(email) {
    // Выделяем доменную часть email после символа @.
    const domain = String(email).split("@")[1]?.toLowerCase();
    // Сравниваем домен с разрешённым из конфигурации.
    if (!domain || domain !== env.allowedEmailDomain.toLowerCase()) {
      // Возвращаем 400, если домен не совпадает.
      throw new HttpError(400, `Email domain must be ${env.allowedEmailDomain}.`);
    }
  }

  // Регистрируем нового пользователя.
  static async register({ email, password, displayName }) {
    // Проверяем обязательность полей email и password.
    if (!email || !password) {
      throw new HttpError(400, "Email and password are required.");
    }
    // Валидируем доменную часть email.
    AuthService.validateEmailDomain(email);

    // Проверяем, не занят ли этот email другим пользователем.
    const existing = await UserRepository.findByEmail(email);
    // Если пользователь уже существует — возвращаем 409 Conflict.
    if (existing) {
      throw new HttpError(409, "User with this email already exists.");
    }

    // Хешируем пароль с cost-factor 10 через bcrypt.
    const passwordHash = await bcrypt.hash(password, 10);
    // Создаём запись пользователя в БД.
    const user = await UserRepository.createUser({
      email,
      displayName: displayName || "",
      passwordHash,
      role: "user",
    });

    // Генерируем случайный 6-значный код верификации email.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    // Устанавливаем срок действия кода — 15 минут.
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    // Сохраняем код и срок в БД.
    await UserRepository.setVerificationCode(user.id, code, expiresAt);

    await sendVerificationCode(email, code);

    // Выпускаем JWT access-токен для клиента.
    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      env.jwtSecret,
      { expiresIn: "12h" }
    );

    // Возвращаем пользователя, токен и флаг необходимости верификации.
    return { user, token, verificationRequired: true };
  }

  // Подтверждаем email по 6-значному коду верификации.
  static async verifyEmail({ userId, code }) {
    // Получаем полные данные пользователя с кодом верификации.
    const userBasic = await UserRepository.findById(userId);
    // Проверяем, что пользователь существует.
    const user = userBasic ? await UserRepository.findByEmail(userBasic.email) : null;
    // Если пользователь не найден — возвращаем 404.
    if (!user) throw new HttpError(404, "User not found.");
    // Если email уже подтверждён — сообщаем об этом.
    if (user.email_verified) throw new HttpError(400, "Email already verified.");
    // Если код не установлен — ошибка.
    if (!user.verification_code) throw new HttpError(400, "No verification code set.");
    // Проверяем, не истёк ли срок действия кода.
    if (new Date() > new Date(user.verification_expires_at)) {
      throw new HttpError(400, "Verification code expired.");
    }
    // Сравниваем введённый код с сохранённым.
    if (user.verification_code !== code) {
      throw new HttpError(400, "Invalid verification code.");
    }

    // Подтверждаем email и очищаем код.
    await UserRepository.confirmEmail(user.id);
    // Возвращаем флаг успешной верификации.
    return { verified: true };
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

    // Сравниваем введённый пароль с хешем через bcrypt.
    const valid = await bcrypt.compare(password, user.password_hash);
    // При неверном пароле — тоже 401 (не раскрываем, что именно неправильно).
    if (!valid) throw new HttpError(401, "Invalid credentials.");

    // Формируем JWT после успешной проверки.
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

  // Получаем данные текущего пользователя по id из токена.
  static async me(userId) {
    // Ищем пользователя по id.
    const user = await UserRepository.findById(userId);
    // Если не найден — возвращаем 404.
    if (!user) throw new HttpError(404, "User not found.");
    // Возвращаем публичные данные пользователя.
    return user;
  }
}

// Экспортируем сервис аутентификации для контроллеров.
module.exports = AuthService;
