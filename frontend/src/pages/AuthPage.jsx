// Импортируем React и необходимые хуки.
import React, { useEffect, useState } from "react";
// Импортируем Link, навигацию и работу с query-параметрами URL.
import { Link, useNavigate, useSearchParams } from "react-router-dom";
// Импортируем хук аутентификации.
import { useAuth } from "../context/AuthContext";
// Импортируем объект переводов (Nynorsk).
import { t } from "../i18n/labels";

// Страница авторизации — логин и регистрация с переключателем.
export const AuthPage = () => {
  // Получаем query-параметры из URL (mode=login или mode=register).
  const [searchParams] = useSearchParams();
  // Получаем функцию программной навигации.
  const navigate = useNavigate();
  // Получаем данные пользователя и функции из контекста аутентификации.
  const { user, login, register, verifyEmail } = useAuth();

  // Текущий режим формы: «login» или «register».
  const [mode, setMode] = useState("login");
  // Состояние полей формы (email, пароль, имя).
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  // Текст ошибки для отображения пользователю.
  const [error, setError] = useState("");
  // Флаг: показываем ли шаг ввода кода верификации email.
  const [verifyStep, setVerifyStep] = useState(false);
  // 6-значный код верификации, введённый пользователем.
  const [code, setCode] = useState("");

  // Если пользователь уже авторизован — перенаправляем на главную.
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Читаем mode из query-параметров URL при загрузке.
  useEffect(() => {
    // Получаем значение параметра «mode».
    const m = searchParams.get("mode");
    // Если значение валидное — устанавливаем его.
    if (m === "login" || m === "register") setMode(m);
  }, [searchParams]);

  // Обработчик изменения любого поля формы (универсальный).
  const handleChange = (e) => {
    // Обновляем конкретное поле формы по атрибуту name.
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Обработчик отправки формы логина или регистрации.
  const handleSubmit = async (e) => {
    // Предотвращаем стандартную перезагрузку страницы.
    e.preventDefault();
    // Сбрасываем предыдущую ошибку.
    setError("");
    try {
      if (mode === "login") {
        // Логин: отправляем email и пароль в AuthService через контекст.
        await login(form.email, form.password);
      } else {
        // Регистрация: отправляем email, пароль и имя.
        const data = await register(form.email, form.password, form.displayName);
        // Если сервер требует верификацию email — показываем ввод кода.
        if (data.verificationRequired) {
          setVerifyStep(true);
          return; // Не переходим на главную, ждём код.
        }
      }
      // При успешном логине/регистрации без верификации — на главную.
      navigate("/");
    } catch (err) {
      // Показываем ошибку от сервера.
      setError(err.message);
    }
  };

  // Обработчик отправки кода верификации email.
  const handleVerify = async (e) => {
    // Предотвращаем стандартную перезагрузку страницы.
    e.preventDefault();
    // Сбрасываем предыдущую ошибку.
    setError("");
    try {
      // Отправляем код верификации через контекст.
      await verifyEmail(code);
      // При успехе — переходим на главную.
      navigate("/");
    } catch (err) {
      // Показываем ошибку (неверный/истёкший код).
      setError(err.message);
    }
  };

  // ---- Шаг верификации email (показывается после успешной регистрации). ----
  if (verifyStep) {
    return (
      <section className="page page--narrow">
        {/* Навигация: только кнопка главной страницы. */}
        <nav className="top-nav">
          <Link className="top-nav__link" to="/">{t.nav_home}</Link>
        </nav>
        {/* Заголовок шага верификации. */}
        <h1 className="page__title">{t.auth_verify_title}</h1>
        {/* Подсказка: «Мы отправили код на вашу почту». */}
        <p className="helper-text">{t.auth_verify_hint}</p>
        {/* Показываем ошибку, если есть. */}
        {error && <p className="error-text">{error}</p>}
        {/* Форма ввода 6-значного кода. */}
        <form className="form-card" onSubmit={handleVerify}>
          <label className="form-label">
            Kode
            {/* Поле ввода кода с ограничением 6 символов. */}
            <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
          </label>
          {/* Кнопка отправки кода. */}
          <button className="btn btn--primary btn--full" type="submit">{t.auth_verify_btn}</button>
        </form>
      </section>
    );
  }

  // ---- Основная форма логина / регистрации. ----
  return (
    <section className="page page--narrow">
      {/* Навигация: только кнопка главной страницы (без лишних ссылок). */}
      <nav className="top-nav">
        <Link className="top-nav__link" to="/">{t.nav_home}</Link>
      </nav>

      {/* Заголовок страницы авторизации. */}
      <h1 className="page__title">{t.auth_title}</h1>

      {/* Переключатель режимов: логин / регистрация. */}
      <div className="button-row">
        {/* Кнопка «Logg inn» — активна, когда mode === "login". */}
        <button type="button" onClick={() => setMode("login")}
          className={`btn ${mode === "login" ? "btn--primary" : ""}`}>
          {t.auth_login}
        </button>
        {/* Кнопка «Registrer» — активна, когда mode === "register". */}
        <button type="button" onClick={() => setMode("register")}
          className={`btn ${mode === "register" ? "btn--primary" : ""}`}>
          {t.auth_register}
        </button>
      </div>

      {/* Показываем ошибку, если есть. */}
      {error && <p className="error-text">{error}</p>}

      {/* Форма авторизации. */}
      <form className="form-card" onSubmit={handleSubmit}>
        {/* Поле имени — отображается только при регистрации. */}
        {mode === "register" && (
          <label className="form-label">
            {t.auth_name}
            <input className="form-input" name="displayName" value={form.displayName} onChange={handleChange} />
          </label>
        )}
        {/* Поле email — обязательное для обоих режимов. */}
        <label className="form-label">
          {t.auth_email}
          <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="namn@ferma.no" required />
        </label>
        {/* Поле пароля — обязательное для обоих режимов. */}
        <label className="form-label">
          {t.auth_password}
          <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} required />
        </label>
        {/* Подсказка о допустимом домене — только при регистрации. */}
        {mode === "register" && <p className="helper-text">{t.auth_domain_hint}</p>}
        {/* Кнопка отправки формы с текстом, зависящим от режима. */}
        <button className="btn btn--primary btn--full" type="submit">
          {mode === "login" ? t.auth_submit_login : t.auth_submit_register}
        </button>
      </form>
    </section>
  );
};
