import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { t } from "../i18n/labels";

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register, verifyEmail } = useAuth();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [verifyStep, setVerifyStep] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "login" || m === "register") setMode(m);
  }, [searchParams]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        navigate("/");
      } else {
        const data = await register(form.email, form.password, form.displayName);
        if (data.verificationRequired) {
          setPendingToken(data.pendingToken);
          setVerifyStep(true);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await verifyEmail(pendingToken, code);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  if (verifyStep) {
    return (
      <>
        <nav className="top-nav">
          <Link className="home-btn home-btn--ghost" to="/">{t.nav_home}</Link>
        </nav>
        <section className="page page--narrow">
          <h1 className="page__title">{t.auth_verify_title}</h1>
          <p className="helper-text">{t.auth_verify_hint}</p>
          {error && <p className="error-text">{error}</p>}
          <form className="form-card" onSubmit={handleVerify}>
            <label className="form-label">
              Kode
              <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
            </label>
            <button className="btn btn--primary btn--full" type="submit">{t.auth_verify_btn}</button>
          </form>
        </section>
      </>
    );
  }

  return (
    <>
      <nav className="top-nav">
        <Link className="home-btn home-btn--ghost" to="/">{t.nav_home}</Link>
      </nav>
      <section className="page page--narrow">
        <h1 className="page__title">{t.auth_title}</h1>

      <div className="button-row">
        <button type="button" onClick={() => setMode("login")}
          className={`btn ${mode === "login" ? "btn--primary" : ""}`}>
          {t.auth_login}
        </button>
        <button type="button" onClick={() => setMode("register")}
          className={`btn ${mode === "register" ? "btn--primary" : ""}`}>
          {t.auth_register}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <form className="form-card" onSubmit={handleSubmit}>
        {mode === "register" && (
          <label className="form-label">
            {t.auth_name}
            <input className="form-input" name="displayName" value={form.displayName} onChange={handleChange} />
          </label>
        )}
        <label className="form-label">
          {t.auth_email}
          <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="namn@example.com" required />
        </label>
        <label className="form-label">
          {t.auth_password}
          <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} required />
        </label>
        <button className="btn btn--primary btn--full" type="submit">
          {mode === "login" ? t.auth_submit_login : t.auth_submit_register}
        </button>
      </form>
      </section>
    </>
  );
};
