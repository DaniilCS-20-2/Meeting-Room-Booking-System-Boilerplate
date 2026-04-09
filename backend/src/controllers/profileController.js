// Импортируем сервис профиля для делегирования бизнес-логики.
const ProfileService = require("../services/profileService");

// Контроллер обновления профиля пользователя (имя, аватар).
const updateProfile = async (req, res, next) => {
  try {
    // Обновляем профиль по id текущего пользователя из токена.
    const user = await ProfileService.updateProfile(req.user.id, {
      displayName: req.body.displayName,
      avatarUrl: req.body.avatarUrl,
    });
    // Возвращаем 200 с обновлёнными данными.
    res.json({ success: true, data: user });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер смены пароля пользователя.
const changePassword = async (req, res, next) => {
  try {
    // Вызываем сервис смены пароля с текущим и новым паролями.
    const result = await ProfileService.changePassword(req.user.id, {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    // Возвращаем 200 с подтверждением смены.
    res.json({ success: true, data: result });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Экспортируем контроллеры профиля.
module.exports = { updateProfile, changePassword };
