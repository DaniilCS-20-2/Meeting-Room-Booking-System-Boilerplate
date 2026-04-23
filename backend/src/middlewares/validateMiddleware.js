// Middleware-обёртка для валидации тел запросов через zod-схемы.
// Одним вызовом проверяет body, приводит типы и гарантирует, что в контроллер
// попадёт только ожидаемый набор полей — всё лишнее отбрасывается.
const HttpError = require("../utils/httpError");

// Фабрика middleware: принимает zod-схему объекта, возвращает Express middleware.
const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    // Собираем понятное сообщение из первой ошибки — без перегрузки деталями.
    const first = result.error.issues[0];
    const field = first?.path?.join(".") || "body";
    const message = `Valideringsfeil (${field}): ${first?.message || "ugyldig verdi"}`;
    return next(new HttpError(400, message));
  }
  // Подменяем body на очищенный (только известные поля) — защита от mass-assignment.
  req.body = result.data;
  return next();
};

module.exports = { validateBody };
