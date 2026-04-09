// Проверяем, что объект даты валиден.
const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

// Считаем длительность интервала в минутах.
const getDurationMinutes = (startTime, endTime) => {
  return (endTime.getTime() - startTime.getTime()) / (1000 * 60);
};

// Генерируем повторяющиеся еженедельные слоты по выбранным дням.
const generateWeeklyOccurrences = ({ startTime, endTime, weekdays, untilDate }) => {
  // Создаём массив результирующих вхождений.
  const occurrences = [];
  // Создаём защитный Set для быстрых проверок выбранных дней недели.
  const weekdaySet = new Set(weekdays);
  // Создаём курсор по календарю с даты первого бронирования.
  const cursor = new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate()));
  // Сохраняем продолжительность первого интервала в миллисекундах.
  const durationMs = endTime.getTime() - startTime.getTime();
  // Нормализуем конечную дату серии к UTC-полуночи.
  const untilBoundary = new Date(Date.UTC(untilDate.getUTCFullYear(), untilDate.getUTCMonth(), untilDate.getUTCDate(), 23, 59, 59));

  // Идём по дням до указанной границы окончания серии.
  while (cursor.getTime() <= untilBoundary.getTime()) {
    // Если день недели входит в шаблон recurring, создаём слот.
    if (weekdaySet.has(cursor.getUTCDay())) {
      // Формируем старт со временем из первого бронирования.
      const occurrenceStart = new Date(
        Date.UTC(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth(),
          cursor.getUTCDate(),
          startTime.getUTCHours(),
          startTime.getUTCMinutes(),
          0
        )
      );
      // Формируем конец по фиксированной длительности.
      const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
      // Добавляем пару дат в список вхождений.
      occurrences.push({ startTime: occurrenceStart, endTime: occurrenceEnd });
    }
    // Переходим к следующему календарному дню.
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Возвращаем полный набор сгенерированных слотов.
  return occurrences;
};

module.exports = {
  isValidDate,
  getDurationMinutes,
  generateWeeklyOccurrences,
};
