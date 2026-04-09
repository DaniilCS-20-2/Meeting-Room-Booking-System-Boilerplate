const BookingService = require("../services/bookingService");
const BookingRepository = require("../models/bookingRepository");
const HttpError = require("../utils/httpError");
const { sendCancellationNotice } = require("../utils/mailer");

// Контроллер создания бронирования (одиночного или recurring).
const createBooking = async (req, res, next) => {
  try {
    // Извлекаем id пользователя из контекста authMiddleware.
    // Передаём данные из тела запроса в сервис создания.
    const result = await BookingService.createBooking({
      userId: req.user.id,
      roomId: req.body.roomId,
      startDateTime: req.body.startDateTime,
      endDateTime: req.body.endDateTime,
      recurring: req.body.recurring,
      comment: req.body.comment,
    });
    // Возвращаем 201 Created с данными созданных бронирований.
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер получения бронирований по комнате (для календаря).
const getByRoom = async (req, res, next) => {
  try {
    // Извлекаем параметры фильтрации из query string.
    const { from, to } = req.query;
    // Получаем бронирования комнаты за указанный период.
    const bookings = await BookingRepository.findByRoom(req.params.roomId, { from, to });
    // Возвращаем 200 с массивом бронирований.
    res.json({ success: true, data: bookings });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер получения полной истории бронирований комнаты (все статусы).
const getHistoryByRoom = async (req, res, next) => {
  try {
    // Получаем все бронирования включая отменённые.
    const bookings = await BookingRepository.findHistoryByRoom(req.params.roomId);
    // Возвращаем 200 с массивом истории.
    res.json({ success: true, data: bookings });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер получения бронирований текущего пользователя.
const getMy = async (req, res, next) => {
  try {
    // Получаем бронирования по id текущего пользователя из токена.
    const bookings = await BookingRepository.findByUser(req.user.id);
    // Возвращаем 200 с массивом бронирований.
    res.json({ success: true, data: bookings });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Контроллер отмены бронирования.
const cancel = async (req, res, next) => {
  try {
    // Ищем бронирование по id.
    const booking = await BookingRepository.findById(req.params.id);
    // Если бронирование не найдено — 404.
    if (!booking) throw new HttpError(404, "Booking not found.");
    if (new Date(booking.end_time) < new Date()) {
      throw new HttpError(400, "Cannot cancel past bookings.");
    }
    if (req.user.role !== "admin" && booking.user_id !== req.user.id) {
      throw new HttpError(403, "You can only cancel your own bookings.");
    }
    const isAdminCancellingOther = req.user.role === "admin" && booking.user_id !== req.user.id;
    const cancelled = await BookingRepository.cancel(req.params.id);
    if (!cancelled) throw new HttpError(400, "Booking already cancelled.");

    if (isAdminCancellingOther && booking.user_email) {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      const fmt = (d) => d.toLocaleString("nn-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      sendCancellationNotice(booking.user_email, {
        roomName: booking.room_name,
        time: `${fmt(start)} — ${fmt(end)}`,
      }).catch(() => {});
    }

    res.json({ success: true, data: cancelled });
  } catch (err) {
    // Передаём ошибку в глобальный обработчик.
    next(err);
  }
};

// Экспортируем все контроллеры бронирований.
module.exports = { createBooking, getByRoom, getHistoryByRoom, getMy, cancel };
