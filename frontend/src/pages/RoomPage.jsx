// Импортируем React и необходимые хуки.
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
// Импортируем хук аутентификации.
import { useAuth } from "../context/AuthContext";
// Импортируем обёртку для API-запросов.
import { apiFetch, resolveUploadUrl } from "../api";
import { t } from "../i18n/labels";
import { ConfirmDialog } from "../components/ConfirmDialog";

// Вспомогательная функция: генерируем массив из 7 дней начиная с указанной даты.
// Используется для построения недельного календаря.
const buildWeekGrid = (startDate) => {
  // Массив для хранения 7 дней.
  const days = [];
  // Создаём копию начальной даты.
  const d = new Date(startDate);
  // Сбрасываем время на полночь.
  d.setHours(0, 0, 0, 0);
  // Генерируем 7 последовательных дней.
  for (let i = 0; i < 7; i++) {
    const day = new Date(d);
    // Прибавляем i дней к начальной дате.
    day.setDate(d.getDate() + i);
    // Добавляем день в массив.
    days.push(day);
  }
  // Возвращаем массив дней.
  return days;
};

// Массив часов от 0 до 23 для строк календаря.
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const toSrc = resolveUploadUrl;

const RoomCarousel = ({ photos, fallback, name }) => {
  const imgs = photos.length ? photos : (fallback ? [fallback] : []);
  const [idx, setIdx] = useState(0);
  const len = imgs.length;

  const prev = useCallback(() => setIdx((i) => (i - 1 + len) % len), [len]);
  const next = useCallback(() => setIdx((i) => (i + 1) % len), [len]);

  if (!len) return <div className="room-top__photo"><div className="room-top__placeholder" /></div>;

  return (
    <div className="room-carousel">
      <div className="room-carousel__viewport">
        <img src={toSrc(imgs[idx])} alt={name} className="room-carousel__img" />
        {len > 1 && (
          <>
            <button type="button" className="room-carousel__arrow room-carousel__arrow--left" onClick={prev}>‹</button>
            <button type="button" className="room-carousel__arrow room-carousel__arrow--right" onClick={next}>›</button>
          </>
        )}
      </div>
      {len > 1 && (
        <div className="room-carousel__dots">
          {imgs.map((_, i) => (
            <button key={i} type="button"
              className={`room-carousel__dot${i === idx ? " room-carousel__dot--active" : ""}`}
              onClick={() => setIdx(i)} />
          ))}
        </div>
      )}
    </div>
  );
};

export const RoomPage = () => {
  // Получаем roomId из параметров URL (react-router).
  const { roomId } = useParams();
  // Получаем данные пользователя и токен из контекста.
  const { user, token } = useAuth();

  // State: данные комнаты.
  const [room, setRoom] = useState(null);
  // State: бронирования за текущую неделю (для календаря).
  const [bookings, setBookings] = useState([]);
  // State: полная история бронирований (для списка).
  const [history, setHistory] = useState([]);
  // State: комментарии к комнате.
  const [comments, setComments] = useState([]);
  // State: текст нового комментария.
  const [commentText, setCommentText] = useState("");
  // State: поля формы бронирования (начало и конец).
  const [bookForm, setBookForm] = useState({ start: "", end: "" });
  // State: текст ошибки.
  const [error, setError] = useState("");
  // State: начало текущей недели (понедельник).
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Вычисляем понедельник текущей недели.
    d.setDate(d.getDate() - d.getDay() + 1);
    return d;
  });

  const isAdmin = user?.role === "admin";
  const [historySort, setHistorySort] = useState("time");
  const [confirmAction, setConfirmAction] = useState(null);

  // Загружаем данные комнаты с сервера при монтировании или смене roomId.
  useEffect(() => {
    // Если нет токена — не загружаем (пользователь не авторизован).
    if (!token) return;
    // GET /api/rooms/:roomId — получаем детали комнаты.
    apiFetch(`/rooms/${roomId}`, { token }).then(setRoom).catch(() => {});
  }, [roomId, token]);

  // Функция загрузки бронирований и истории для текущей комнаты.
  const loadBookings = () => {
    // Если нет токена — не загружаем.
    if (!token) return;
    // Формируем границы недели для запроса.
    const from = weekStart.toISOString();
    const to = new Date(weekStart.getTime() + 7 * 86400000).toISOString();
    // GET /api/bookings/room/:id?from=...&to=... — бронирования за неделю.
    apiFetch(`/bookings/room/${roomId}?from=${from}&to=${to}`, { token }).then(setBookings).catch(() => {});
    // GET /api/bookings/room/:id/history — полная история.
    apiFetch(`/bookings/room/${roomId}/history`, { token }).then(setHistory).catch(() => {});
  };
  // Перезагружаем при смене комнаты, токена или недели.
  useEffect(loadBookings, [roomId, token, weekStart]);

  // Функция загрузки комментариев к комнате.
  const loadComments = () => {
    // Если нет токена — не загружаем.
    if (!token) return;
    // GET /api/comments/room/:roomId — комментарии к комнате.
    apiFetch(`/comments/room/${roomId}`, { token }).then(setComments).catch(() => {});
  };
  // Загружаем комментарии при монтировании.
  useEffect(loadComments, [roomId, token]);

  const freeSlots = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);

    const activeBookings = history
      .filter((b) => b.status !== "cancelled" && new Date(b.end_time) > now)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    const endRange = new Date(now);
    endRange.setDate(endRange.getDate() + 30);
    endRange.setHours(23, 59, 0, 0);

    const rawGaps = [];
    let cursor = new Date(now);

    for (const booking of activeBookings) {
      const bStart = new Date(booking.start_time);
      const bEnd = new Date(booking.end_time);
      if (bStart > cursor) {
        rawGaps.push({ start: new Date(cursor), end: new Date(bStart) });
      }
      if (bEnd > cursor) cursor = new Date(bEnd);
    }
    if (cursor < endRange) {
      rawGaps.push({ start: new Date(cursor), end: new Date(endRange) });
    }

    const daySlots = [];
    for (const gap of rawGaps) {
      let slotStart = new Date(gap.start);
      while (slotStart < gap.end && daySlots.length < 4) {
        const dayEnd = new Date(slotStart);
        dayEnd.setHours(23, 59, 0, 0);
        const slotEnd = gap.end < dayEnd ? new Date(gap.end) : dayEnd;
        if (slotEnd.getTime() - slotStart.getTime() >= 60000) {
          daySlots.push({ start: new Date(slotStart), end: new Date(slotEnd) });
        }
        const nextDay = new Date(slotStart);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        slotStart = nextDay;
      }
      if (daySlots.length >= 4) break;
    }

    return daySlots;
  }, [history]);

  // Обработчик отправки формы бронирования.
  const handleBook = async (e) => {
    // Предотвращаем стандартную перезагрузку страницы.
    e.preventDefault();
    // Сбрасываем предыдущую ошибку.
    setError("");
    try {
      // POST /api/bookings — создаём новое бронирование.
      await apiFetch("/bookings", {
        method: "POST",
        token,
        body: {
          roomId,
          startDateTime: bookForm.start,
          endDateTime: bookForm.end,
        },
      });
      // Перезагружаем бронирования после успешного создания.
      loadBookings();
      // Очищаем форму.
      setBookForm({ start: "", end: "" });
    } catch (err) {
      // Показываем ошибку (конфликт, недопустимое время и т.д.).
      setError(err.message);
    }
  };

  const handleCancel = (bookingId) => {
    setConfirmAction({
      title: "Avbestill booking",
      text: "Er du sikker på at du vil avbestille denne bookinga?",
      action: async () => {
        try {
          await apiFetch(`/bookings/${bookingId}/cancel`, { method: "PATCH", token });
          loadBookings();
        } catch (err) {
          alert(err.message);
        }
        setConfirmAction(null);
      },
    });
  };

  // Обработчик отправки нового комментария.
  const handleComment = async (e) => {
    // Предотвращаем стандартную перезагрузку страницы.
    e.preventDefault();
    // Не отправляем пустой комментарий.
    if (!commentText.trim()) return;
    try {
      // POST /api/comments/room/:roomId — создаём комментарий.
      await apiFetch(`/comments/room/${roomId}`, {
        method: "POST",
        token,
        body: { message: commentText },
      });
      // Очищаем поле ввода.
      setCommentText("");
      // Перезагружаем список комментариев.
      loadComments();
    } catch (err) {
      // Показываем ошибку через alert.
      alert(err.message);
    }
  };

  const handleDeleteComment = (id) => {
    setConfirmAction({
      title: "Slett kommentar",
      text: "Er du sikker på at du vil slette denne kommentaren?",
      action: async () => {
        try {
          await apiFetch(`/comments/${id}`, { method: "DELETE", token });
          loadComments();
        } catch (err) {
          alert(err.message);
        }
        setConfirmAction(null);
      },
    });
  };

  const toLocalInput = (date) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
  };

  const pickSlot = (slot) => {
    const now = new Date();
    now.setSeconds(0, 0);
    const safeStart = new Date(now.getTime() + 60000);
    const start = slot.start <= safeStart ? safeStart : slot.start;
    setBookForm({ start: toLocalInput(start), end: toLocalInput(slot.end) });
  };

  // Генерируем массив дней для недельного календаря.
  const weekDays = useMemo(() => buildWeekGrid(weekStart), [weekStart]);

  const getSlotInfo = (day, hour) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 3600000);
    const fmt = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    const overlapping = bookings.filter((b) => {
      const bs = new Date(b.start_time).getTime();
      const be = new Date(b.end_time).getTime();
      return slotStart.getTime() < be && slotEnd.getTime() > bs;
    });

    if (overlapping.length === 0) return null;

    const labels = [];
    for (const b of overlapping) {
      const bs = new Date(b.start_time);
      const be = new Date(b.end_time);
      if (bs >= slotStart && bs < slotEnd) labels.push(fmt(bs));
      if (be > slotStart && be <= slotEnd) labels.push(fmt(be));
    }
    const allPast = overlapping.every((b) => new Date(b.end_time) <= new Date());
    return { booked: true, past: allPast, label: [...new Set(labels)].join(" — ") };
  };

  const fmtDate = (d) => d.toLocaleDateString("nn-NO", { day: "numeric", month: "short" });
  const fmtClock = (d) => d.toLocaleTimeString("nn-NO", { hour: "2-digit", minute: "2-digit" });
  const formatRange = (startIso, endIso) => {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const sameDay = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate();
    if (sameDay) return `${fmtDate(s)}, ${fmtClock(s)} – ${fmtClock(e)}`;
    return `${fmtDate(s)} ${fmtClock(s)} – ${fmtDate(e)} ${fmtClock(e)}`;
  };

  // Переход на предыдущую неделю.
  const prevWeek = () => setWeekStart(new Date(weekStart.getTime() - 7 * 86400000));
  // Переход на следующую неделю.
  const nextWeek = () => setWeekStart(new Date(weekStart.getTime() + 7 * 86400000));

  // Пока данные комнаты не загружены — показываем индикатор загрузки.
  if (!room) return <div className="page">Lastar...</div>;

  const now = new Date();
  const sortFn = (a, b) => {
    if (historySort === "activity") return new Date(b.created_at) - new Date(a.created_at);
    return new Date(b.start_time) - new Date(a.start_time);
  };
  const futureBookings = history
    .filter((b) => new Date(b.end_time) > now && b.status !== "cancelled")
    .sort(sortFn);
  const pastBookings = history
    .filter((b) => new Date(b.end_time) <= now || b.status === "cancelled")
    .sort((a, b) => {
      if (a.status === "cancelled" && b.status !== "cancelled") return 1;
      if (a.status !== "cancelled" && b.status === "cancelled") return -1;
      return sortFn(a, b);
    });

  return (
    <section className="page">
      {/* Верхняя секция: фото комнаты слева + бронирование справа. */}
      <div className="room-top">
        <RoomCarousel photos={room.photos || []} fallback={room.photo_url} name={room.name} />

        {/* Блок бронирования и информации. */}
        <div className="room-top__booking">
          {/* Название комнаты. */}
          <h1 className="room-page__title">{room.name}</h1>

          {/* 4 ближайших свободных слота — кликабельные кнопки. */}
          <p className="room-top__label">{t.room_next_free}</p>
          <div className="room-slots">
            {freeSlots.map((slot, i) => (
              <button key={i} type="button" className="btn btn--slot" onClick={() => pickSlot(slot)}>
                <span className="btn--slot__date">
                  {slot.start.toLocaleDateString("nn-NO", { day: "numeric", month: "short" })}
                </span>
                <span className="btn--slot__time">
                  {slot.start.toLocaleTimeString("nn-NO", { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {slot.end.toLocaleTimeString("nn-NO", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </button>
            ))}
          </div>

          {/* Форма выбора произвольного времени бронирования. */}
          <form className="room-book-form" onSubmit={handleBook}>
            {/* Поле «От» — начало бронирования. */}
            <label className="form-label">{t.room_from}
              <input className="form-input" type="datetime-local" value={bookForm.start}
                onChange={(e) => setBookForm((p) => ({ ...p, start: e.target.value }))} required />
            </label>
            <label className="form-label">{t.room_to}
              <input className="form-input" type="datetime-local" value={bookForm.end}
                onChange={(e) => setBookForm((p) => ({ ...p, end: e.target.value }))} required />
            </label>
            {isAdmin && (room.min_booking_minutes != null || room.max_booking_minutes != null) && (
              <p className="duration-hint">
                {room.min_booking_minutes != null && (
                  <span>{t.room_duration_hint_min}: {room.min_booking_minutes} {t.room_duration_hint_min_unit}</span>
                )}
                {room.min_booking_minutes != null && room.max_booking_minutes != null && <span> · </span>}
                {room.max_booking_minutes != null && (
                  <span>{t.room_duration_hint_max}: {room.max_booking_minutes} {t.room_duration_hint_min_unit}</span>
                )}
              </p>
            )}
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn--primary" type="submit">{t.room_book_btn}</button>
          </form>

          {/* Информация о комнате: вместимость, оборудование, описание. */}
          <div className="room-info">
            <p><strong>{t.room_capacity}:</strong> {room.capacity}</p>
            {room.equipment && <p><strong>{t.room_equipment}:</strong> {room.equipment}</p>}
            {room.description && <p>{room.description}</p>}
          </div>

          {/* Кнопка редактирования — только для админа. */}
          {isAdmin && (
            <div className="room-admin-actions">
              <Link className="btn btn--small" to={`/admin/rooms/${room.id}/edit`}>{t.room_edit}</Link>
            </div>
          )}
        </div>
      </div>

      {/* ---- Недельный календарь ---- */}
      <h2 className="section-title">{t.room_calendar}</h2>
      {/* Навигация по неделям: стрелки влево/вправо. */}
      <div className="calendar-nav">
        <button type="button" className="btn btn--small" onClick={prevWeek}>&larr;</button>
        {/* Диапазон дат текущей недели. */}
        <span>{weekStart.toLocaleDateString("nn-NO")} &ndash; {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString("nn-NO")}</span>
        <button type="button" className="btn btn--small" onClick={nextWeek}>&rarr;</button>
      </div>
      {/* Сетка календаря: дни × часы. */}
      <div className="calendar-grid">
        {/* Заголовок: названия дней недели. */}
        <div className="calendar-grid__header">
          <div className="calendar-grid__corner"></div>
          {weekDays.map((d) => (
            <div key={d.toISOString()} className="calendar-grid__day-label">
              {/* Форматируем: короткий день + число. */}
              {d.toLocaleDateString("nn-NO", { weekday: "short", day: "numeric" })}
            </div>
          ))}
        </div>
        {/* Тело: строка на каждый час с ячейками на каждый день. */}
        <div className="calendar-grid__body">
          {HOURS.map((h) => (
            <div key={h} className="calendar-grid__row">
              {/* Метка часа в левом столбце. */}
              <div className="calendar-grid__hour">{String(h).padStart(2, "0")}:00</div>
              {weekDays.map((d) => {
                const info = getSlotInfo(d, h);
                return (
                  <div key={d.toISOString() + h}
                    className={`calendar-grid__cell ${info?.booked ? (info.past ? "calendar-grid__cell--past" : "calendar-grid__cell--booked") : ""}`}>
                    {info?.label && <span className={`calendar-grid__label ${info.past ? "calendar-grid__label--past" : ""}`}>{info.label}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Нижняя секция: история бронирований + комментарии ---- */}
      <div className="room-bottom">
        {/* Левая половина: история бронирований. */}
        <div className="room-bottom__history">
          <div className="history-header">
            <h2 className="section-title">{t.room_history}</h2>
            <div className="history-sort">
              <button type="button"
                className={`btn btn--tiny ${historySort === "time" ? "btn--active" : ""}`}
                onClick={() => setHistorySort("time")}>{t.room_sort_time}</button>
              <button type="button"
                className={`btn btn--tiny ${historySort === "activity" ? "btn--active" : ""}`}
                onClick={() => setHistorySort("activity")}>{t.room_sort_activity}</button>
            </div>
          </div>
          {futureBookings.length > 0 && (
            <>
              <h3 className="subsection-title">Komande</h3>
              {futureBookings.map((b) => (
                <div key={b.id} className="history-item">
                  <span>{formatRange(b.start_time, b.end_time)}</span>
                  <span className="history-item__user">{b.user_name}</span>
                  {(b.user_id === user.id || isAdmin) && (
                    <button type="button" className="btn btn--small btn--danger" onClick={() => handleCancel(b.id)}>
                      {t.room_cancel_booking}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
          {isAdmin && pastBookings.length > 0 && (
            <>
              <h3 className="subsection-title">Tidlegare</h3>
              {pastBookings.map((b) => (
                <div key={b.id} className={`history-item history-item--past ${b.status === "cancelled" ? "history-item--cancelled" : ""}`}>
                  <span>{formatRange(b.start_time, b.end_time)}</span>
                  <span className="history-item__user">{b.user_name}</span>
                  <span className="history-item__status">{b.status}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Правая половина: комментарии к комнате. */}
        <div className="room-bottom__comments">
          <h2 className="section-title">{t.room_comments}</h2>
          {/* Форма добавления нового комментария. */}
          <form className="comment-form" onSubmit={handleComment}>
            {/* Поле ввода текста комментария. */}
            <input className="form-input" placeholder={t.room_comment_placeholder} value={commentText}
              onChange={(e) => setCommentText(e.target.value)} />
            {/* Кнопка «Отправить». */}
            <button className="btn btn--primary btn--small" type="submit">{t.room_comment_send}</button>
          </form>
          {/* Список комментариев (новые сверху). */}
          <div className="comments-list">
            {comments.map((c) => (
              <div key={c.id} className="comment-item">
                {/* Заголовок: имя автора, дата, кнопка удаления (для админа). */}
                <div className="comment-item__header">
                  <strong>{c.user_name}</strong>
                  <span className="comment-item__date">{new Date(c.created_at).toLocaleString("nn-NO")}</span>
                  {/* Кнопка удаления комментария — только для админа. */}
                  {isAdmin && (
                    <button type="button" className="btn btn--tiny btn--danger" onClick={() => handleDeleteComment(c.id)}>×</button>
                  )}
                </div>
                {/* Текст комментария. */}
                <p className="comment-item__text">{c.message}</p>
              </div>
            ))}
          </div>
        </div>
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
