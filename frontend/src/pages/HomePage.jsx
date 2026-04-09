// Импортируем React и необходимые хуки.
import React, { useEffect, useState } from "react";
// Импортируем Link для навигации и useNavigate для программных переходов.
import { Link, useNavigate } from "react-router-dom";
// Импортируем хук аутентификации для проверки статуса пользователя.
import { useAuth } from "../context/AuthContext";
// Импортируем обёртку для API-запросов к backend.
import { apiFetch } from "../api";
// Импортируем объект переводов (Nynorsk).
import { t } from "../i18n/labels";

// Главная страница приложения.
export const HomePage = () => {
  // Получаем данные пользователя, токен и функцию выхода из контекста.
  const { user, token, logout } = useAuth();
  // Получаем функцию программной навигации.
  const navigate = useNavigate();
  // Локальный state для списка комнат, загруженных с сервера.
  const [rooms, setRooms] = useState([]);

  // Загружаем список комнат с сервера, если пользователь авторизован.
  useEffect(() => {
    // Если пользователь не авторизован — не загружаем комнаты.
    if (!user || !token) return;
    // Отправляем GET /api/rooms и сохраняем результат в state.
    apiFetch("/rooms", { token }).then(setRooms).catch(() => {});
  }, [user, token]);

  // ---- Вид для незарегистрированного пользователя ----
  if (!user) {
    return (
      <section className="home-page page">
        {/* Верхняя полоса с кнопками входа и регистрации. */}
        <div className="home-topbar">
          {/* Кнопка «Logg inn» ведёт на страницу логина. */}
          <Link className="home-btn home-btn--ghost" to="/auth?mode=login">{t.home_login_btn}</Link>
          {/* Кнопка «Registrer deg» ведёт на страницу регистрации. */}
          <Link className="home-btn home-btn--primary" to="/auth?mode=register">{t.home_register_btn}</Link>
        </div>
        {/* Приветственный заголовок сайта. */}
        <h1 className="home-page__title">{t.home_welcome}</h1>
        {/* Краткая информация о сервисе для неавторизованных. */}
        <p className="home-page__subtitle">{t.home_info}</p>
      </section>
    );
  }

  // ---- Вид для авторизованного пользователя ----
  // Проверяем, является ли текущий пользователь админом.
  const isAdmin = user.role === "admin";
  // Берём первую букву имени для отображения в кружке аватара.
  const initials = (user.display_name || user.email || "U").charAt(0).toUpperCase();

  // Обработчик удаления комнаты (только для админа).
  const handleDelete = async (roomId) => {
    // Запрашиваем подтверждение у пользователя перед удалением.
    if (!confirm("Slett dette rommet?")) return;
    try {
      // Отправляем DELETE /api/rooms/:id на сервер.
      await apiFetch(`/rooms/${roomId}`, { method: "DELETE", token });
      // Удаляем комнату из локального state без перезагрузки.
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err) {
      // Показываем ошибку пользователю через alert.
      alert(err.message);
    }
  };

  return (
    <section className="home-page page">
      {/* Верхняя строка: админ-кнопки слева, аватар пользователя справа. */}
      <div className="home-topbar">
        {/* Кнопки управления показываются только админу. */}
        {isAdmin && (
          <div className="home-topbar__admin">
            {/* Кнопка «Legg til rom» — создание новой комнаты. */}
            <Link className="home-btn home-btn--primary" to="/admin/rooms/new">{t.room_add}</Link>
            {/* Кнопка «Administrer brukarar» — управление пользователями. */}
            <Link className="home-btn home-btn--ghost" to="/admin/users">{t.room_manage_users}</Link>
          </div>
        )}
        {/* Блок аватара пользователя — кликабельный, ведёт в профиль. */}
        <div className="home-topbar__user">
          <button type="button" className="avatar-btn" onClick={() => navigate("/profile")}>
            {/* Если есть URL аватара — показываем фото, иначе — инициалы. */}
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="avatar-btn__img" />
              : <span className="avatar-btn__initials">{initials}</span>}
          </button>
        </div>
      </div>

      {/* Основной заголовок страницы. */}
      <h1 className="home-page__title">{t.home_title}</h1>

      {/* Сетка карточек комнат. */}
      <div className="home-grid">
        {/* Перебираем массив комнат и рендерим карточку для каждой. */}
        {rooms.map((room) => {
          // Определяем текущий статус комнаты (занята/свободна/отключена).
          const isBusy = room.computed_status === "opptatt";
          const isOff = room.computed_status === "vedlikehald";
          // Выбираем CSS-класс для цветной рамки карточки.
          let borderClass = "home-card--free"; // Зелёная рамка по умолчанию.
          if (isBusy) borderClass = "home-card--busy"; // Красная рамка.
          if (isOff) borderClass = "home-card--disabled"; // Серая рамка.

          let nearestText = "";
          if (room.nearest_event) {
            const d = new Date(room.nearest_event.time);
            const dateStr = d.toLocaleDateString("nn-NO", { day: "numeric", month: "short" });
            const timeStr = d.toLocaleTimeString("nn-NO", { hour: "2-digit", minute: "2-digit" });
            nearestText = room.nearest_event.type === "free_at"
              ? `${t.room_free} ${dateStr} kl. ${timeStr}`
              : `${t.room_busy} ${dateStr} kl. ${timeStr}`;
          }

          return (
            <div key={room.id} className={`home-card ${borderClass}`}>
              {/* Кликабельная ссылка на страницу комнаты. */}
              <Link to={`/rooms/${room.id}`} className="home-card__link">
                {/* Фото комнаты или пустой placeholder. */}
                {room.photo_url
                  ? <img src={room.photo_url} alt={room.name} className="home-card__media-img" />
                  : <div className="home-card__media" />}
                {/* Название комнаты. */}
                <h3 className="home-card__title">{room.name}</h3>
                {/* Краткое описание. */}
                <p className="home-card__text">{room.description}</p>
                {/* Вместимость и оборудование. */}
                <p className="home-card__meta">
                  {t.room_capacity}: {room.capacity}
                  {room.equipment ? ` · ${room.equipment}` : ""}
                </p>
                {/* Текст ближайшего события (если есть). */}
                {nearestText && <p className="home-card__nearest">{nearestText}</p>}
              </Link>
              {/* Кнопки редактирования/удаления — только для админа. */}
              {isAdmin && (
                <div className="home-card__admin">
                  {/* Кнопка «Rediger» ведёт на страницу редактирования комнаты. */}
                  <Link className="btn btn--small" to={`/admin/rooms/${room.id}/edit`}>{t.room_edit}</Link>
                  {/* Кнопка «Slett» удаляет комнату с подтверждением. */}
                  <button type="button" className="btn btn--small btn--danger" onClick={() => handleDelete(room.id)}>{t.room_delete}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
