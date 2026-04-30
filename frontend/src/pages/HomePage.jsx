// Импортируем React и необходимые хуки.
import React, { useEffect, useState } from "react";
// Импортируем Link для навигации и useNavigate для программных переходов.
import { Link, useNavigate } from "react-router-dom";
// Импортируем хук аутентификации для проверки статуса пользователя.
import { useAuth } from "../context/AuthContext";
// Импортируем обёртку для API-запросов к backend.
import { apiFetch, resolveUploadUrl } from "../api";
import { t } from "../i18n/labels";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { OverviewCalendar } from "../components/OverviewCalendar";

// Главная страница приложения.
export const HomePage = () => {
  // Получаем данные пользователя, токен и функцию выхода из контекста.
  const { user, token, logout } = useAuth();
  // Получаем функцию программной навигации.
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);

  // Загружаем список комнат — публично, токен опционален.
  useEffect(() => {
    apiFetch("/rooms", { token }).then(setRooms).catch(() => {});
  }, [token]);

  // Аноним = неавторизованный посетитель. Видит карточки комнат и базовый
  // статус «занято/свободно», но не имена и не админские действия.
  const isAnonymous = !user;
  // Признак админа — для отображения админских кнопок.
  const isAdmin = !!user && user.role === "admin";
  // Берём первую букву имени для отображения в кружке аватара.
  const initials = user ? (user.display_name || user.email || "U").charAt(0).toUpperCase() : "";

  const handleDelete = (roomId, roomName) => {
    setConfirmAction({
      title: "Slett rom",
      text: `Er du sikker på at du vil slette «${roomName}»? Alle bookingar blir sletta.`,
      action: async () => {
        try {
          await apiFetch(`/rooms/${roomId}`, { method: "DELETE", token });
          setRooms((prev) => prev.filter((r) => r.id !== roomId));
        } catch (err) {
          alert(err.message);
        }
        setConfirmAction(null);
      },
    });
  };

  return (
    <section className="home-page page">
      <div className="home-topbar">
        <div className="home-topbar__right">
          {isAnonymous ? (
            <>
              <Link className="home-btn home-btn--ghost" to="/auth?mode=login">{t.home_login_btn}</Link>
              <Link className="home-btn home-btn--primary" to="/auth?mode=register">{t.home_register_btn}</Link>
            </>
          ) : (
            <>
              {isAdmin && (
                <>
                  <Link className="home-btn home-btn--primary home-btn--icon-only" to="/admin/rooms/new" title={t.room_add} aria-label={t.room_add}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginRight: 4, verticalAlign: "middle"}}>
                      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="home-btn__label">{t.room_add}</span>
                  </Link>
                  <Link className="home-btn home-btn--ghost home-btn--icon-only" to="/admin/users" title={t.room_manage_users} aria-label={t.room_manage_users}>
                    <svg width="18" height="16" viewBox="0 0 24 20" fill="currentColor" style={{marginRight: 4, verticalAlign: "middle"}}>
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                    <span className="home-btn__label">{t.room_manage_users}</span>
                  </Link>
                </>
              )}
              <button type="button" className="avatar-btn" onClick={() => navigate("/profile")}>
                {user.avatar_url
                  ? <img src={resolveUploadUrl(user.avatar_url)} alt="" className="avatar-btn__img" />
                  : <span className="avatar-btn__initials">{initials}</span>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Заголовок: для анонима — приветствие, для залогиненных — секция комнат. */}
      <h1 className="home-page__title">
        {isAnonymous ? t.home_welcome : t.home_title}
      </h1>
      {isAnonymous && (
        <p className="home-page__subtitle">{t.home_info}</p>
      )}

      {/* Общий календарь по всем комнатам. Аноним/viewer видят только занятость
          и название комнаты; user/admin — ещё и человека, селскап и описание. */}
      <OverviewCalendar
        token={token}
        canSeeDetails={!!user && user.role !== "viewer"}
      />

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
                {(() => {
                  const cover = (room.photos && room.photos[0]) || room.photo_url;
                  if (!cover) return <div className="home-card__media" />;
                  return <img src={resolveUploadUrl(cover)} alt={room.name} className="home-card__media-img" />;
                })()}
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
                  <button type="button" className="btn btn--small btn--danger" onClick={() => handleDelete(room.id, room.name)}>{t.room_delete}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          text={confirmAction.text}
          onConfirm={confirmAction.action}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </section>
  );
};
