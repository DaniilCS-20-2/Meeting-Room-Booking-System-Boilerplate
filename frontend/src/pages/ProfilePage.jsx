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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdCode, setPwdCode] = useState("");
  const [pwdStep, setPwdStep] = useState("form");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailStep, setEmailStep] = useState("form");
  const [msg, setMsg] = useState("");
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

  const handleRequestPasswordChange = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    try {
      await apiFetch("/profile/password/request", {
        method: "POST", token,
        body: { currentPassword, newPassword },
      });
      setPwdStep("code");
      setMsg("Kode sendt til e-posten din!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    try {
      await apiFetch("/profile/password/confirm", {
        method: "POST", token,
        body: { code: pwdCode, newPassword },
      });
      setCurrentPassword(""); setNewPassword(""); setPwdCode("");
      setPwdStep("form");
      setMsg("Passord endra!");
    } catch (err) {
      setError(err.message);
    }
  };

  // Обработчик выхода из аккаунта.
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    try {
      await apiFetch("/profile/email/request", {
        method: "POST", token,
        body: { newEmail, password: emailPassword },
      });
      setEmailStep("code");
      setMsg("Kode sendt til den nye e-posten!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmEmailChange = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    try {
      await apiFetch("/profile/email/confirm", {
        method: "POST", token,
        body: { code: emailCode, newEmail },
      });
      setNewEmail(""); setEmailPassword(""); setEmailCode("");
      setEmailStep("form");
      await refreshUser();
      setMsg("E-post endra!");
    } catch (err) {
      setError(err.message);
    }
  };

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

          {pwdStep === "form" ? (
            <form className="form-card" onSubmit={handleRequestPasswordChange}>
              <h3>{t.profile_change_password}</h3>
              <label className="form-label">{t.profile_current_password}
                <input className="form-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </label>
              <label className="form-label">{t.profile_new_password}
                <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </label>
              <button className="btn btn--primary" type="submit">{t.profile_save}</button>
            </form>
          ) : (
            <form className="form-card" onSubmit={handleConfirmPasswordChange}>
              <h3>{t.profile_change_password}</h3>
              <p className="form-hint">{t.profile_code_hint}</p>
              <label className="form-label">{t.profile_code}
                <input className="form-input" value={pwdCode} onChange={(e) => setPwdCode(e.target.value)}
                  maxLength={6} placeholder="000000" required />
              </label>
              <button className="btn btn--primary" type="submit">{t.profile_confirm}</button>
              <button className="btn btn--small" type="button" onClick={() => setPwdStep("form")}>{t.room_back}</button>
            </form>
          )}

          {emailStep === "form" ? (
            <form className="form-card" onSubmit={handleRequestEmailChange}>
              <h3>{t.profile_change_email}</h3>
              <label className="form-label">{t.profile_new_email}
                <input className="form-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </label>
              <label className="form-label">{t.profile_password_for_email}
                <input className="form-input" type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} required />
              </label>
              <button className="btn btn--primary" type="submit">{t.profile_save}</button>
            </form>
          ) : (
            <form className="form-card" onSubmit={handleConfirmEmailChange}>
              <h3>{t.profile_change_email}</h3>
              <p className="form-hint">{t.profile_code_hint}</p>
              <label className="form-label">{t.profile_code}
                <input className="form-input" value={emailCode} onChange={(e) => setEmailCode(e.target.value)}
                  maxLength={6} placeholder="000000" required />
              </label>
              <button className="btn btn--primary" type="submit">{t.profile_confirm}</button>
              <button className="btn btn--small" type="button" onClick={() => setEmailStep("form")}>{t.room_back}</button>
            </form>
          )}

          <button className="btn btn--danger btn--full" type="button" onClick={handleLogout}>
            {t.profile_logout}
          </button>
        </div>
      </div>
    </section>
  );
};
