// Импортируем bcrypt для проверки и хеширования паролей.
const bcrypt = require("bcryptjs");
// Импортируем репозиторий пользователей.
const UserRepository = require("../models/userRepository");
// Импортируем типизированную HTTP-ошибку.
const HttpError = require("../utils/httpError");

// Создаём сервис профиля — бизнес-логика управления профилем пользователя.
class ProfileService {
  // Обновляем отображаемое имя и/или URL аватара.
  static async updateProfile(userId, { displayName, avatarUrl }) {
    // Обновляем профиль через репозиторий.
    const user = await UserRepository.updateProfile(userId, { displayName, avatarUrl });
    // Если пользователь не найден — возвращаем 404.
    if (!user) throw new HttpError(404, "User not found.");
    // Возвращаем обновлённые данные пользователя.
    return user;
  }

  // Меняем пароль пользователя (требуется текущий пароль для подтверждения).
  static async changePassword(userId, { currentPassword, newPassword }) {
    // Проверяем обязательность обоих полей.
    if (!currentPassword || !newPassword) {
      throw new HttpError(400, "Current and new password are required.");
    }
    // Получаем базовые данные пользователя для получения email.
    const userBasic = await UserRepository.findById(userId);
    // Загружаем полные данные пользователя (включая password_hash).
    const user = userBasic ? await UserRepository.findByEmail(userBasic.email) : null;
    // Если пользователь не найден — возвращаем 404.
    if (!user) throw new HttpError(404, "User not found.");

    // Сравниваем введённый текущий пароль с хешем из БД.
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    // Если текущий пароль неверный — возвращаем 400.
    if (!valid) throw new HttpError(400, "Current password is incorrect.");

    // Хешируем новый пароль с cost-factor 10.
    const hash = await bcrypt.hash(newPassword, 10);
    // Сохраняем новый хеш в БД.
    await UserRepository.updatePassword(userId, hash);
    // Возвращаем подтверждение смены пароля.
    return { changed: true };
  }
}

// Экспортируем сервис профиля для контроллеров.
module.exports = ProfileService;
