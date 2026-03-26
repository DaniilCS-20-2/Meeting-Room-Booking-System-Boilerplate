// Импортируем типизированную ошибку для корректных HTTP-ответов.
const HttpError = require("../utils/httpError");

// Фабрика middleware для проверки ролей пользователя.
const rbacMiddleware = (allowedRoles) => {
  // Возвращаем конкретный middleware для каждого маршрута.
  return (req, _res, next) => {
    // Проверяем, что пользователь уже прошёл authMiddleware.
    if (!req.user) {
      // Возвращаем ошибку при отсутствии контекста пользователя.
      return next(new HttpError(401, "Unauthorized."));
    }

    // Проверяем, что роль пользователя входит в список разрешённых.
    if (!allowedRoles.includes(req.user.role)) {
      // Возвращаем 403 Forbidden при нарушении RBAC.
      return next(new HttpError(403, "Forbidden: insufficient role."));
    }

    // Передаём управление при успешной проверке роли.
    return next();
  };
};

// Экспортируем фабрику RBAC middleware.
module.exports = rbacMiddleware;
