// Импортируем jsonwebtoken для проверки токена.
const jwt = require("jsonwebtoken");
// Импортируем конфиг приложения с JWT секретом.
const env = require("../config/env");
// Импортируем типизированную HTTP-ошибку.
const HttpError = require("../utils/httpError");

// Middleware для проверки Bearer JWT.
const authMiddleware = (req, _res, next) => {
  // Получаем заголовок Authorization.
  const authHeader = req.headers.authorization || "";
  // Разбиваем строку на тип и токен.
  const [scheme, token] = authHeader.split(" ");

  // Проверяем формат Bearer токена.
  if (scheme !== "Bearer" || !token) {
    // Прерываем запрос, если токен отсутствует или формат неверный.
    return next(new HttpError(401, "Missing or invalid Authorization header."));
  }

  try {
    // Верифицируем токен с использованием секрета приложения.
    const payload = jwt.verify(token, env.jwtSecret);
    // Сохраняем полезную нагрузку в req.user для дальнейших middleware/контроллеров.
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    // Передаём управление следующему обработчику.
    return next();
  } catch (_error) {
    // Возвращаем 401 при невалидном/просроченном токене.
    return next(new HttpError(401, "Invalid or expired token."));
  }
};

// Экспортируем middleware аутентификации.
module.exports = authMiddleware;
