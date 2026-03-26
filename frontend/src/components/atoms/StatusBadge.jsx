// Импортируем React для функционального компонента.
import React from "react";

// Компонент атомарного бейджа статуса комнаты.
export const StatusBadge = ({ status, t }) => {
  // Выбираем цветовую схему в зависимости от статуса.
  const colorMap = {
    // Зелёный для свободной комнаты.
    ledig: "bg-emerald-100 text-emerald-800",
    // Красный для занятой комнаты.
    opptatt: "bg-rose-100 text-rose-800",
    // Янтарный для статуса обслуживания.
    vedlikehald: "bg-amber-100 text-amber-900",
  };

  // Формируем CSS-классы бейджа с fallback.
  const className = colorMap[status] || "bg-slate-100 text-slate-700";
  // Формируем ключ перевода для статуса.
  const labelKey = `status_${status}`;

  // Рендерим компактный статусный бейдж.
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{t[labelKey] || status}</span>;
};
