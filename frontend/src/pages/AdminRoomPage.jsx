// Импортируем React и необходимые хуки.
import React, { useEffect, useState } from "react";
// Импортируем useNavigate для переходов и useParams для параметров URL.
import { useNavigate, useParams } from "react-router-dom";
// Импортируем хук аутентификации.
import { useAuth } from "../context/AuthContext";
// Импортируем обёртку для API-запросов.
import { apiFetch } from "../api";
// Импортируем объект переводов (Nynorsk).
import { t } from "../i18n/labels";

// Админская страница создания/редактирования комнаты.
export const AdminRoomPage = () => {
  // Получаем roomId из URL (если есть — режим редактирования).
  const { roomId } = useParams();
  // Получаем токен из контекста аутентификации.
  const { token } = useAuth();
  // Получаем функцию программной навигации.
  const navigate = useNavigate();
  // Определяем режим: редактирование (true) или создание (false).
  const isEdit = !!roomId;

  const [form, setForm] = useState({
    name: "",
    location: "",
    capacity: 6,
    description: "",
    equipment: "",
    photoUrl: "",
    minBookingMinutes: 15,
    maxBookingMinutes: 480,
  });
  const [noMinLimit, setNoMinLimit] = useState(false);
  const [noMaxLimit, setNoMaxLimit] = useState(false);
  // State: флаг отключения комнаты.
  const [isDisabled, setIsDisabled] = useState(false);
  // State: текст ошибки.
  const [error, setError] = useState("");

  // При редактировании подгружаем данные существующей комнаты с сервера.
  useEffect(() => {
    // Если не режим редактирования или нет токена — не загружаем.
    if (!isEdit || !token) return;
    apiFetch(`/rooms/${roomId}`, { token }).then((room) => {
      setForm({
        name: room.name || "",
        location: room.location || "",
        capacity: room.capacity || 6,
        description: room.description || "",
        equipment: room.equipment || "",
        photoUrl: room.photo_url || "",
        minBookingMinutes: room.min_booking_minutes ?? 15,
        maxBookingMinutes: room.max_booking_minutes ?? 480,
      });
      setNoMinLimit(room.min_booking_minutes == null);
      setNoMaxLimit(room.max_booking_minutes == null);
      setIsDisabled(room.is_disabled);
    }).catch(() => {});
  }, [roomId, token, isEdit]);

  // Универсальный обработчик изменения полей формы.
  const handleChange = (e) => {
    // Для числовых полей преобразуем значение в Number.
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    // Обновляем конкретное поле формы по атрибуту name.
    setForm((p) => ({ ...p, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      minBookingMinutes: noMinLimit ? null : form.minBookingMinutes,
      maxBookingMinutes: noMaxLimit ? null : form.maxBookingMinutes,
    };
    try {
      if (isEdit) {
        await apiFetch(`/rooms/${roomId}`, { method: "PUT", token, body: payload });
      } else {
        await apiFetch("/rooms", { method: "POST", token, body: payload });
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  // Обработчик переключения отключения комнаты.
  const handleToggleDisable = async () => {
    try {
      // PATCH /api/rooms/:roomId/disable — переключаем флаг.
      await apiFetch(`/rooms/${roomId}/disable`, {
        method: "PATCH", token,
        body: { isDisabled: !isDisabled },
      });
      // Обновляем локальный state.
      setIsDisabled(!isDisabled);
    } catch (err) {
      // Показываем ошибку через alert.
      alert(err.message);
    }
  };

  return (
    <section className="page page--narrow">
      {/* Заголовок: «Новая комната» или «Редактирование». */}
      <h1 className="page__title">{isEdit ? t.admin_room_title_edit : t.admin_room_title_new}</h1>
      {/* Показываем ошибку, если есть. */}
      {error && <p className="error-text">{error}</p>}

      {/* Layout: фото слева, форма справа. */}
      <div className="admin-room-layout">
        {/* Секция фотографии комнаты. */}
        <div className="admin-room-photo">
          {/* Превью фото или placeholder. */}
          {form.photoUrl
            ? <img src={form.photoUrl} alt="" className="admin-room-photo__img" />
            : <div className="admin-room-photo__placeholder">Bilete</div>}
          {/* Поле ввода URL фотографии. */}
          <label className="form-label">{t.admin_room_photo}
            <input className="form-input" name="photoUrl" value={form.photoUrl} onChange={handleChange} placeholder="https://..." />
          </label>
        </div>

        {/* Форма с полями комнаты. */}
        <form className="form-card admin-room-form" onSubmit={handleSubmit}>
          {/* Поле «Название». */}
          <label className="form-label">{t.admin_room_name}
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
          </label>
          {/* Поле «Локация». */}
          <label className="form-label">{t.admin_room_location}
            <input className="form-input" name="location" value={form.location} onChange={handleChange} />
          </label>
          {/* Поле «Вместимость». */}
          <label className="form-label">{t.admin_room_capacity}
            <input className="form-input" type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1} required />
          </label>
          {/* Поле «Описание» (textarea). */}
          <label className="form-label">{t.admin_room_description}
            <textarea className="form-input form-textarea" name="description" value={form.description} onChange={handleChange} />
          </label>
          {/* Поле «Оборудование». */}
          <label className="form-label">{t.admin_room_equipment}
            <input className="form-input" name="equipment" value={form.equipment} onChange={handleChange} />
          </label>
          <div className="admin-room-times">
            <label className="form-label">{t.admin_room_min}
              <div className="admin-room-times__row">
                <input className="form-input" type="number" name="minBookingMinutes"
                  value={noMinLimit ? "" : form.minBookingMinutes}
                  onChange={handleChange} min={1} step={1} disabled={noMinLimit} />
                <label className="checkbox-label">
                  <input type="checkbox" checked={noMinLimit}
                    onChange={(e) => setNoMinLimit(e.target.checked)} />
                  {t.admin_room_no_limit}
                </label>
              </div>
            </label>
            <label className="form-label">{t.admin_room_max}
              <div className="admin-room-times__row">
                <input className="form-input" type="number" name="maxBookingMinutes"
                  value={noMaxLimit ? "" : form.maxBookingMinutes}
                  onChange={handleChange} min={1} step={1} disabled={noMaxLimit} />
                <label className="checkbox-label">
                  <input type="checkbox" checked={noMaxLimit}
                    onChange={(e) => setNoMaxLimit(e.target.checked)} />
                  {t.admin_room_no_limit}
                </label>
              </div>
            </label>
          </div>
          {/* Кнопка «Сохранить» — создание или обновление. */}
          <button className="btn btn--primary btn--full" type="submit">{t.admin_room_save}</button>
          {/* Кнопка вкл/выкл комнату — только в режиме редактирования. */}
          {isEdit && (
            <button className="btn btn--full" type="button" onClick={handleToggleDisable}>
              {isDisabled ? t.admin_room_enable : t.admin_room_disable}
            </button>
          )}
        </form>
      </div>
    </section>
  );
};
