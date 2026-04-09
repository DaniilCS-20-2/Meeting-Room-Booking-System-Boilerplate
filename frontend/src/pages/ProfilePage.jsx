// Импортируем React и хук useState.
import React, { useState } from "react";
// Импортируем useNavigate для программных переходов.
import { useNavigate } from "react-router-dom";
// Импортируем хук аутентификации.
import { useAuth } from "../context/AuthContext";
// Импортируем обёртку для API-запросов.
import { apiFetch } from "../api";
// Импортируем объект переводов (Nynorsk).
import { t } from "../i18n/labels";

// Страница профиля пользователя — настройки аккаунта.
export const ProfilePage = () => {
  // Получаем данные пользователя, токен, функции выхода и обновления из контекста.
  const { user, token, logout, refreshUser } = useAuth();
  // Получаем функцию программной навигации.
  const navigate = useNavigate();

  // State: отображаемое имя пользователя (инициализируем из контекста).
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  // State: URL аватара (инициализируем из контекста).
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  // State: текущий пароль для подтверждения смены.
  const [currentPassword, setCurrentPassword] = useState("");
  // State: новый пароль.
  const [newPassword, setNewPassword] = useState("");
  // State: сообщение об успешном действии.
  const [msg, setMsg] = useState("");
  // State: текст ошибки.
  const [error, setError] = useState("");

  // Обработчик сохранения профиля (имя + аватар).
  const handleSaveProfile = async (e) => {
    // Предотвращаем стандартную перезагрузку страницы.
    e.preventDefault();
    // Сбрасываем предыдущие сообщения.
    setError(""); setMsg("");
    try {
      // PUT /api/profile — обновляем имя и аватар.
      await apiFetch("/profile", {
        method: "PUT",
        token,
        body: { displayName, avatarUrl: avatarUrl || null },
      });
      // Перезагружаем данные пользователя в контексте.
      await refreshUser();
      // Показываем сообщение об успехе.
      setMsg("Lagra!");
    } catch (err) {
      // Показываем ошибку от сервера.
      setError(err.message);
    }
  };

  // Обработчик смены пароля.
  const handleChangePassword = async (e) => {
    // Предотвращаем стандартную перезагрузку страницы.
    e.preventDefault();
    // Сбрасываем предыдущие сообщения.
    setError(""); setMsg("");
    try {
      // PUT /api/profile/password — меняем пароль (требуем текущий для подтверждения).
      await apiFetch("/profile/password", {
        method: "PUT",
        token,
        body: { currentPassword, newPassword },
      });
      // Очищаем поля паролей.
      setCurrentPassword(""); setNewPassword("");
      // Показываем сообщение об успешной смене.
      setMsg("Passord endra!");
    } catch (err) {
      // Показываем ошибку (неверный текущий пароль и т.д.).
      setError(err.message);
    }
  };

  // Обработчик выхода из аккаунта.
  const handleLogout = () => {
    // Вызываем функцию выхода из контекста (очищает токен).
    logout();
    // Перенаправляем на главную страницу.
    navigate("/");
  };

  // Если пользователь не загружен — ничего не рендерим.
  if (!user) return null;

  // Берём первую букву имени для отображения в placeholder аватара.
  const initials = (user.display_name || user.email || "U").charAt(0).toUpperCase();

  return (
    <section className="page page--narrow">
      {/* Заголовок страницы профиля. */}
      <h1 className="page__title">{t.profile_title}</h1>

      {/* Сообщение об успехе (зелёное). */}
      {msg && <p className="success-text">{msg}</p>}
      {/* Сообщение об ошибке (красное). */}
      {error && <p className="error-text">{error}</p>}

      {/* Layout: аватар слева, формы справа. */}
      <div className="profile-layout">
        {/* Аватар пользователя. */}
        <div className="profile-avatar">
          {/* Если есть URL — показываем фото, иначе — инициалы. */}
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="profile-avatar__img" />
            : <div className="profile-avatar__placeholder">{initials}</div>}
        </div>

        {/* Формы настроек. */}
        <div className="profile-forms">
          {/* Форма обновления профиля (имя, email, аватар). */}
          <form className="form-card" onSubmit={handleSaveProfile}>
            {/* Поле «Имя». */}
            <label className="form-label">{t.profile_name}
              <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
            {/* Поле «Email» — только для чтения (disabled). */}
            <label className="form-label">{t.profile_email}
              <input className="form-input" value={user.email} disabled />
            </label>
            {/* Поле «URL аватара». */}
            <label className="form-label">{t.profile_avatar} (URL)
              <input className="form-input" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </label>
            {/* Кнопка сохранения профиля. */}
            <button className="btn btn--primary" type="submit">{t.profile_save}</button>
          </form>

          {/* Форма смены пароля. */}
          <form className="form-card" onSubmit={handleChangePassword}>
            {/* Подзаголовок секции. */}
            <h3>{t.profile_change_password}</h3>
            {/* Поле «Текущий пароль». */}
            <label className="form-label">{t.profile_current_password}
              <input className="form-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </label>
            {/* Поле «Новый пароль». */}
            <label className="form-label">{t.profile_new_password}
              <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </label>
            {/* Кнопка сохранения нового пароля. */}
            <button className="btn btn--primary" type="submit">{t.profile_save}</button>
          </form>

          {/* Кнопка выхода из аккаунта (красная, во всю ширину). */}
          <button className="btn btn--danger btn--full" type="button" onClick={handleLogout}>
            {t.profile_logout}
          </button>
        </div>
      </div>
    </section>
  );
};
