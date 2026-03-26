// Определяем словарь меток интерфейса только для Nynorsk.
export const labels = {
  // Заголовок дашборда.
  dashboard_title: "Moteromsoversikt",
  // Метка свободной комнаты.
  status_ledig: "Ledig",
  // Метка занятой комнаты.
  status_opptatt: "Opptatt",
  // Метка комнаты на обслуживании.
  status_vedlikehald: "Vedlikehald",
  // Текст кнопки бронирования.
  bestill_no: "Bestill no",
  // Подпись вместимости.
  capacity_label: "Kapasitet",
  // Подпись фильтра дня.
  day_filter_label: "Filtrer etter dag",
};

// Возвращаем единый словарь Nynorsk.
export const getLabels = () => labels;
