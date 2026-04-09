// Импортируем репозиторий пользователей для доступа к данным.
const UserRepository = require("../models/userRepository");
// Импортируем типизированную HTTP-ошибку.
const HttpError = require("../utils/httpError");

// Контроллер получения списка всех пользователей (только для админа).
const getAllUsers = async (_req, res, next) => {
  try {
    // Получаем всех пользователей из репозитория.
    const users = await UserRepository.findAll();
    // Возвращаем 200 с массивом пользователей.
    res.json({ success: true, data: users });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер редактирования пользователя админом (только имя и аватар).
const updateUser = async (req, res, next) => {
  try {
    // Обновляем пользователя по id из параметров URL.
    const user = await UserRepository.adminUpdate(req.params.id, {
      displayName: req.body.displayName,
      avatarUrl: req.body.avatarUrl,
    });
    // Если пользователь не найден — 404.
    if (!user) throw new HttpError(404, "User not found.");
    // Возвращаем 200 с обновлёнными данными.
    res.json({ success: true, data: user });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер удаления пользователя (только для админа).
const deleteUser = async (req, res, next) => {
  try {
    // Удаляем пользователя по id.
    const deleted = await UserRepository.deleteUser(req.params.id);
    // Если пользователь не найден — 404.
    if (!deleted) throw new HttpError(404, "User not found.");
    // Возвращаем 200 с подтверждением удаления.
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Экспортируем контроллеры администрирования.
module.exports = { getAllUsers, updateUser, deleteUser };
