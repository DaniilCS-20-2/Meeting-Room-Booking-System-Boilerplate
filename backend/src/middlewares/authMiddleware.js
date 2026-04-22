// Импортируем jsonwebtoken для проверки токена.
const jwt = require("jsonwebtoken");
// Импортируем конфиг приложения с JWT секретом.
const env = require("../config/env");
// Импортируем типизированную HTTP-ошибку.
const HttpError = require("../utils/httpError");
// Репозиторий пользователей — для чтения актуальной роли из БД.
const UserRepository = require("../models/userRepository");

// Middleware для проверки Bearer JWT.
const authMiddleware = async (req, _res, next) => {
  // Получаем заголовок Authorization.
  const authHeader = req.headers.authorization || "";
  // Разбиваем строку на тип и токен.
  const [scheme, token] = authHeader.split(" ");

  // Проверяем формат Bearer токена.
  if (scheme !== "Bearer" || !token) {
    // Прерываем запрос, если токен отсутствует или формат неверный.
    return next(new HttpError(401, "Missing or invalid Authorization header."));
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (_error) {
    return next(new HttpError(401, "Invalid or expired token."));
  }

  try {
    // Читаем актуального пользователя из БД, чтобы изменения роли применялись
    // сразу, без необходимости перелогиниваться.
    const fresh = await UserRepository.findById(payload.sub);
    req.user = {
      id: payload.sub,
      role: fresh?.role || payload.role,
      email: fresh?.email || payload.email,
    };
    return next();
  } catch (err) {
    return next(err);
  }
};

// Экспортируем middleware аутентификации.
module.exports = authMiddleware;
