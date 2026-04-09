// Импортируем сервис аутентификации для делегирования бизнес-логики.
const AuthService = require("../services/authService");

// Контроллер регистрации нового пользователя.
const register = async (req, res, next) => {
  try {
    // Передаём тело запроса (email, password, displayName) в сервис.
    const result = await AuthService.register(req.body);
    // Отправляем 201 Created с данными пользователя и токеном.
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер подтверждения email по коду верификации.
const verifyEmail = async (req, res, next) => {
  try {
    // Передаём id пользователя из токена и код из тела запроса.
    const result = await AuthService.verifyEmail({
      userId: req.user.id,
      code: req.body.code,
    });
    // Возвращаем 200 с подтверждением верификации.
    res.json({ success: true, data: result });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер логина пользователя.
const login = async (req, res, next) => {
  try {
    // Передаём email и password из тела запроса в сервис.
    const result = await AuthService.login(req.body);
    // Возвращаем 200 с данными пользователя и токеном.
    res.json({ success: true, data: result });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер получения данных текущего пользователя.
const me = async (req, res, next) => {
  try {
    // Получаем данные пользователя по id из JWT-токена.
    const user = await AuthService.me(req.user.id);
    // Возвращаем 200 с публичными данными пользователя.
    res.json({ success: true, data: user });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Экспортируем все контроллеры аутентификации.
module.exports = { register, verifyEmail, login, me };
