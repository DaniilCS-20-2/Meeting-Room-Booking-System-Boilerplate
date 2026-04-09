const crypto = require("crypto");
const BookingRepository = require("../models/bookingRepository");
const RoomRepository = require("../models/roomRepository");
const HttpError = require("../utils/httpError");
const {
  isValidDate,
  getDurationMinutes,
  generateWeeklyOccurrences,
} = require("../utils/time");

// Создаём сервис бизнес-логики бронирований.
class BookingService {
  static validateBaseSlot(startDateTime, endDateTime) {
    const startTime = new Date(startDateTime);
    const endTime = new Date(endDateTime);

    if (!isValidDate(startTime) || !isValidDate(endTime)) {
      throw new HttpError(400, "Invalid startDateTime or endDateTime.");
    }

    if (startTime < new Date()) {
      throw new HttpError(400, "Cannot create bookings in the past.");
    }

    const durationMinutes = getDurationMinutes(startTime, endTime);
    if (durationMinutes < 1) {
      throw new HttpError(400, "End time must be after start time.");
    }

    return { startTime, endTime, durationMinutes };
  }

  static validateDurationLimits(durationMinutes, room) {
    const min = room.min_booking_minutes;
    const max = room.max_booking_minutes;
    if (min != null && durationMinutes < min) {
      throw new HttpError(400, `Booking must be at least ${min} minutes for this room.`);
    }
    if (max != null && durationMinutes > max) {
      throw new HttpError(400, `Booking cannot exceed ${max} minutes for this room.`);
    }
  }

  // Валидируем параметры recurring и генерируем вхождения.
  static buildOccurrences({ startTime, endTime, recurring }) {
    // Если recurring не указан, возвращаем единственный слот.
    if (!recurring) {
      // Возвращаем массив для унификации дальнейшей обработки.
      return [{ startTime, endTime, recurrenceGroupId: null }];
    }

    // Проверяем, что дни недели переданы массивом.
    if (!Array.isArray(recurring.weekdays) || recurring.weekdays.length === 0) {
      // Требуем минимум один день недели.
      throw new HttpError(400, "Recurring weekdays must be a non-empty array.");
    }

    // Проверяем корректность диапазона дней недели (0=Sunday ... 6=Saturday).
    const hasInvalidWeekday = recurring.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6);
    // Бросаем ошибку при невалидных значениях.
    if (hasInvalidWeekday) {
      throw new HttpError(400, "Recurring weekdays must contain integers from 0 to 6.");
    }

    // Преобразуем дату окончания серии.
    const untilDate = new Date(recurring.untilDate);
    // Проверяем валидность untilDate.
    if (!isValidDate(untilDate)) {
      // Ошибка формата даты окончания.
      throw new HttpError(400, "Recurring untilDate is invalid.");
    }

    // Дата окончания серии не может быть раньше первого слота.
    if (untilDate.getTime() < startTime.getTime()) {
      // Запрещаем обратный диапазон.
      throw new HttpError(400, "Recurring untilDate must be equal or after the first booking date.");
    }

    // Генерируем идентификатор группы recurring-бронирований.
    const recurrenceGroupId = crypto.randomUUID();
    // Создаём список вхождений на основе дней недели и границы untilDate.
    const generated = generateWeeklyOccurrences({
      startTime,
      endTime,
      weekdays: recurring.weekdays,
      untilDate,
    });

    // Если по шаблону не сгенерировано ни одного слота, это ошибка входных данных.
    if (generated.length === 0) {
      throw new HttpError(400, "Recurring rule produced zero occurrences.");
    }

    // Добавляем идентификатор группы к каждому вхождению серии.
    return generated.map((occurrence) => ({
      ...occurrence,
      recurrenceGroupId,
    }));
  }

  static async createBooking({ userId, roomId, startDateTime, endDateTime, recurring, comment }) {
    if (!userId || !roomId) {
      throw new HttpError(400, "userId and roomId are required.");
    }

    const room = await RoomRepository.findById(roomId);
    if (!room) throw new HttpError(404, "Room not found.");

    const { startTime, endTime, durationMinutes } = BookingService.validateBaseSlot(startDateTime, endDateTime);
    BookingService.validateDurationLimits(durationMinutes, room);

    const occurrences = BookingService.buildOccurrences({ startTime, endTime, recurring });

    // Выполняем все вставки в одной транзакции.
    return BookingRepository.withTransaction(async (client) => {
      // Инициализируем массив созданных бронирований.
      const createdBookings = [];

      // Последовательно создаём каждое вхождение.
      for (const occurrence of occurrences) {
        // Проверяем конфликт перед вставкой для ясной 409-ошибки.
        const hasConflict = await BookingRepository.hasTimeConflict(
          client,
          roomId,
          occurrence.startTime,
          occurrence.endTime
        );

        // Если конфликт найден, прекращаем операцию.
        if (hasConflict) {
          // Возвращаем 409 Conflict.
          throw new HttpError(409, "Selected room is already booked for this time slot.");
        }

        // Вставляем бронирование в БД.
        const inserted = await BookingRepository.insertBooking(client, {
          roomId,
          userId,
          startTime: occurrence.startTime,
          endTime: occurrence.endTime,
          recurrenceGroupId: occurrence.recurrenceGroupId,
          comment,
          status: "confirmed",
        });

        // Сохраняем созданную запись в итоговый массив.
        createdBookings.push(inserted);
      }

      // Возвращаем результат создания одной/нескольких записей.
      return {
        totalCreated: createdBookings.length,
        recurrenceGroupId: createdBookings[0]?.recurrence_group_id || null,
        bookings: createdBookings,
      };
    }).catch((error) => {
      // Если ошибка пришла из PostgreSQL по исключающему ограничению, конвертируем в 409.
      if (error && error.constraint === "exclude_room_overlapping_bookings") {
        throw new HttpError(409, "Selected room is already booked for this time slot.");
      }
      // Иначе пробрасываем исходную ошибку.
      throw error;
    });
  }
}

// Экспортируем сервис для использования в контроллерах.
module.exports = BookingService;
