// Импортируем React и необходимые хуки.
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
// Импортируем обёртку для API-запросов.
import { apiFetch } from "../api";

// Создаём контекст аутентификации, доступный во всём приложении.
const AuthContext = createContext(null);

// Хук для удобного доступа к контексту аутентификации в компонентах.
export const useAuth = () => useContext(AuthContext);

// Провайдер аутентификации — оборачивает всё приложение, предоставляя данные пользователя.
export const AuthProvider = ({ children }) => {
  // Инициализируем токен из localStorage (сохраняется между сессиями).
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  // Храним данные текущего пользователя (null, пока не загружены).
  const [user, setUser] = useState(null);
  // Флаг загрузки — true, пока проверяем токен при старте.
  const [loading, setLoading] = useState(!!token);

  // Загружаем данные пользователя по токену из API.
  const loadUser = useCallback(async () => {
    // Если токена нет — сбрасываем пользователя и завершаем загрузку.
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      // Запрашиваем данные текущего пользователя через GET /api/auth/me.
      const data = await apiFetch("/auth/me", { token });
      // Сохраняем полученные данные в state.
      setUser(data);
    } catch {
      // Токен невалидный или просроченный — удаляем его.
      localStorage.removeItem("token");
      // Сбрасываем state токена и пользователя.
      setToken(null);
      setUser(null);
    } finally {
      // Завершаем загрузку в любом случае.
      setLoading(false);
    }
  }, [token]);

  // Вызываем loadUser при изменении токена (при старте и после логина/логаута).
  useEffect(() => { loadUser(); }, [loadUser]);

  // Функция логина: отправляет email и пароль, сохраняет токен.
  const login = async (email, password) => {
    // Отправляем POST /api/auth/login с данными формы.
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    // Сохраняем полученный токен в localStorage.
    localStorage.setItem("token", data.token);
    // Обновляем state токена.
    setToken(data.token);
    // Сохраняем данные пользователя из ответа.
    setUser(data.user);
    // Возвращаем данные для использования в компоненте.
    return data;
  };

  // Функция регистрации: отправляет email, пароль и имя.
  const register = async (email, password, displayName) => {
    // Отправляем POST /api/auth/register с данными формы.
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: { email, password, displayName },
    });
    // Сохраняем токен в localStorage.
    localStorage.setItem("token", data.token);
    // Обновляем state токена.
    setToken(data.token);
    // Сохраняем данные пользователя.
    setUser(data.user);
    // Возвращаем данные (включая флаг verificationRequired).
    return data;
  };

  // Функция подтверждения email по 6-значному коду.
  const verifyEmail = async (code) => {
    // Отправляем POST /api/auth/verify с кодом верификации.
    return apiFetch("/auth/verify", { method: "POST", body: { code }, token });
  };

  // Функция выхода: удаляет токен и сбрасывает данные пользователя.
  const logout = () => {
    // Удаляем токен из localStorage.
    localStorage.removeItem("token");
    // Сбрасываем state токена.
    setToken(null);
    // Сбрасываем данные пользователя.
    setUser(null);
  };

  // Перезагрузка данных пользователя (вызывается после обновления профиля).
  const refreshUser = () => loadUser();

  // Собираем все значения контекста в один объект.
  const value = { user, token, loading, login, register, verifyEmail, logout, refreshUser };

  // Предоставляем контекст всем дочерним компонентам.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
