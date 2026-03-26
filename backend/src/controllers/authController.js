// Импортируем сервис аутентификации.
const AuthService = require("../services/authService");

// Контроллер регистрации пользователя.
const register = async (req, res, next) => {
  try {
    // Передаём тело запроса в сервис регистрации.
    const result = await AuthService.register(req.body);
    // Отправляем статус 201 Created и данные пользователя.
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Передаём ошибку в глобальный обработчик.
    next(error);
  }
};

// Контроллер логина пользователя.
const login = async (req, res, next) => {
  try {
    // Передаём тело запроса в сервис логина.
    const result = await AuthService.login(req.body);
    // Возвращаем успешный ответ 200.
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Передаём ошибку в глобальный обработчик.
    next(error);
  }
};

// Экспортируем набор контроллеров auth.
module.exports = {
  register,
  login,
};
