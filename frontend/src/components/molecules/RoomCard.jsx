// Импортируем React для JSX-компонента.
import React from "react";
// Импортируем атомарный бейдж статуса.
import { StatusBadge } from "../atoms/StatusBadge";

// Компонент карточки комнаты (molecule).
export const RoomCard = ({ room, t, onBook }) => {
  // Рендерим карточку с ключевыми данными комнаты.
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Верхняя строка: имя комнаты и статус. */}
      <div className="mb-3 flex items-center justify-between">
        {/* Выводим имя комнаты крупным шрифтом. */}
        <h3 className="text-base font-semibold text-slate-900">{room.name}</h3>
        {/* Показываем атомарный бейдж статуса. */}
        <StatusBadge status={room.status} t={t} />
      </div>

      {/* Отображаем описание комнаты и локации. */}
      <p className="mb-2 text-sm text-slate-600">{room.description}</p>
      {/* Показываем строку вместимости. */}
      <p className="mb-4 text-sm text-slate-700">
        {t.capacity_label}: <span className="font-medium">{room.capacity}</span>
      </p>

      {/* Кнопка действия бронирования комнаты. */}
      <button
        type="button"
        onClick={() => onBook(room)}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
      >
        {t.bestill_no}
      </button>
    </article>
  );
};
