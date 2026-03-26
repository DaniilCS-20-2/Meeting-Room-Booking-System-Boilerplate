// Импортируем React-хуки для состояния и вычислений.
import React, { useMemo, useState } from "react";
// Импортируем i18n-словарь.
import { getLabels } from "../../i18n/labels";
// Импортируем молекулу карточки комнаты.
import { RoomCard } from "../molecules/RoomCard";

// Подготавливаем демонстрационные данные комнат.
const demoRooms = [
  // Первая комната свободна.
  { id: "r1", name: "Fjord 1", description: "Skjerm, kamera, whiteboard", capacity: 8, status: "ledig" },
  // Вторая комната занята.
  { id: "r2", name: "Fjord 2", description: "Projektor, videokonferanse", capacity: 12, status: "opptatt" },
  // Третья комната на обслуживании.
  { id: "r3", name: "Fjord 3", description: "Stille rom for korte møte", capacity: 4, status: "vedlikehald" },
];

// Пример organism-компонента дашборда.
export const BookingDashboard = () => {
  // Храним текущий фильтр по статусу.
  const [statusFilter, setStatusFilter] = useState("all");

  // Получаем единый словарь меток на Nynorsk.
  const t = useMemo(() => getLabels(), []);

  // Фильтруем комнаты в зависимости от выбранного статуса.
  const visibleRooms = useMemo(() => {
    // Если фильтр "all", возвращаем весь список.
    if (statusFilter === "all") {
      return demoRooms;
    }
    // Иначе возвращаем только комнаты нужного статуса.
    return demoRooms.filter((room) => room.status === statusFilter);
  }, [statusFilter]);

  // Обработчик кнопки бронирования (демо-версия).
  const handleBookRoom = (room) => {
    // В production здесь будет переход к форме бронирования или API-вызов.
    // eslint-disable-next-line no-alert
    alert(`${t.bestill_no}: ${room.name}`);
  };

  // Рендерим дашборд бронирований.
  return (
    <section className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Шапка с заголовком дашборда. */}
      <header className="flex items-center justify-between">
        {/* Заголовок секции. */}
        <h1 className="text-2xl font-bold text-slate-900">{t.dashboard_title}</h1>
      </header>

      {/* Панель фильтрации статусов. */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {/* Подпись к фильтру. */}
        <span className="text-sm font-medium text-slate-700">{t.day_filter_label}:</span>
        {/* Кнопки фильтра по статусам. */}
        {["all", "ledig", "opptatt", "vedlikehald"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              statusFilter === status ? "bg-sky-600 text-white" : "bg-white text-slate-700 border border-slate-300"
            }`}
          >
            {status === "all" ? "Alle" : t[`status_${status}`]}
          </button>
        ))}
      </div>

      {/* Сетка карточек комнат. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Рендерим каждую комнату через molecule-компонент. */}
        {visibleRooms.map((room) => (
          <RoomCard key={room.id} room={room} t={t} onBook={handleBookRoom} />
        ))}
      </div>
    </section>
  );
};
