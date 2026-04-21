// Импортируем репозиторий пользователей для доступа к данным.
const UserRepository = require("../models/userRepository");
const WhitelistRepository = require("../models/whitelistRepository");
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

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));

const getWhitelist = async (_req, res, next) => {
  try {
    const items = await WhitelistRepository.findAll();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

const addWhitelist = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim();
    const role = req.body.role === "admin" ? "admin" : "user";
    if (!isValidEmail(email)) {
      throw new HttpError(400, "Ugyldig e-postadresse.");
    }
    const item = await WhitelistRepository.create({ email, role });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const updateWhitelistRole = async (req, res, next) => {
  try {
    const role = req.body.role === "admin" ? "admin" : "user";
    const item = await WhitelistRepository.updateRole(req.params.id, role);
    if (!item) throw new HttpError(404, "Whitelist entry not found.");
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const deleteWhitelist = async (req, res, next) => {
  try {
    const deleted = await WhitelistRepository.remove(req.params.id);
    if (!deleted) throw new HttpError(404, "Whitelist entry not found.");
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};

// Экспортируем контроллеры администрирования.
module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  getWhitelist,
  addWhitelist,
  updateWhitelistRole,
  deleteWhitelist,
};
