// Импортируем сервис бизнес-логики бронирований.
const BookingService = require("../services/bookingService");

// Контроллер создания бронирования (одиночного или recurring).
const createBooking = async (req, res, next) => {
  try {
    // Извлекаем идентификатор текущего пользователя из контекста authMiddleware.
    const userId = req.user.id;
    // Передаём данные в сервис создания бронирования.
    const result = await BookingService.createBooking({
      userId,
      roomId: req.body.roomId,
      startDateTime: req.body.startDateTime,
      endDateTime: req.body.endDateTime,
      recurring: req.body.recurring,
      comment: req.body.comment,
    });
    // Возвращаем 201 и созданные записи.
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Передаём ошибку в глобальный middleware.
    next(error);
  }
};

// Экспортируем контроллеры бронирований.
module.exports = {
  createBooking,
};
