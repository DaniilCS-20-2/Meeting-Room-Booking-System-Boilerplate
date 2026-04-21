import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch, apiUpload, API_BASE } from "../api";
import { t } from "../i18n/labels";

export const ProfilePage = () => {
  const { user, token, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdCode, setPwdCode] = useState("");
  const [pwdStep, setPwdStep] = useState("form");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailStep, setEmailStep] = useState("form");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleAvatarClick = () => fileRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setMsg(""); setUploading(true);
    try {
      await apiUpload("/profile/avatar", { file, fieldName: "avatar", token });
      await refreshUser();
      setMsg("Profilbilete oppdatert!");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    try {
      await apiFetch("/profile", {
        method: "PUT", token,
        body: { displayName },
      });
      await refreshUser();
      setMsg("Lagra!");
    } catch (err) {
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

  const handleLogout = () => { logout(); navigate("/"); };

  if (!user) return null;

  const initials = (user.display_name || user.email || "U").charAt(0).toUpperCase();
  const avatarSrc = user.avatar_url?.startsWith("/uploads")
    ? `${API_BASE}${user.avatar_url}`
    : user.avatar_url;

  return (
    <section className="page page--narrow">
      <h1 className="page__title">{t.profile_title}</h1>

      {msg && <p className="success-text">{msg}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="profile-layout">
        <div className="profile-avatar profile-avatar--clickable" onClick={handleAvatarClick} title="Klikk for å endre bilete">
          {avatarSrc
            ? <img src={avatarSrc} alt="" className="profile-avatar__img" />
            : <div className="profile-avatar__placeholder">{initials}</div>}
          <div className="profile-avatar__overlay">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 16a4 4 0 100-8 4 4 0 000 8z" fill="#fff"/>
              <path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9z" stroke="#fff" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          {uploading && <div className="profile-avatar__loading">...</div>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        </div>

        <div className="profile-forms">
          <form className="form-card" onSubmit={handleSaveProfile}>
            <label className="form-label">{t.profile_name}
              <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
            <label className="form-label">{t.profile_email}
              <input className="form-input" value={user.email} disabled />
            </label>
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
