// Набор pre-настроенных rate-лимитеров для разных классов эндпоинтов.
// Цель — защитить наиболее чувствительные ручки (логин, регистрация, подтверждение
// кода, сброс пароля) от перебора и массового спама.
const rateLimit = require("express-rate-limit");

// Общий лимит: защита от «шумных» клиентов на всё API.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 минута
  max: 300,                     // 300 запросов/мин на IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "For mange førespurnader, prøv igjen straks." },
});

// Жёсткий лимит для входа/регистрации/reset — чтобы нельзя было перебирать пароли и почту.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 минут
  max: 20,                      // 20 попыток на IP за 15 минут
  standardHeaders: true,
  legacyHeaders: false,
  // Успешные запросы не «жгут» квоту — тормозим только неверные попытки.
  skipSuccessfulRequests: true,
  message: { success: false, message: "For mange innloggingsforsøk. Prøv igjen om 15 min." },
});

// Специальный лимит для подтверждения кодов (email verify, password confirm).
// Здесь счётчик увеличивается на КАЖДЫЙ запрос (включая успешные),
// чтобы 6-значный код нельзя было перебрать прямым перебором.
const codeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "For mange kodeforsøk. Prøv igjen snart." },
});

// Лимит на отправку писем с кодом: не даём спамить чужую почту.
const mailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,     // 1 час
  max: 8,                       // 8 писем/час на IP (плюс backend уже дедуплицирует по email)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "For mange kode-førespurnader. Prøv igjen seinare." },
});

module.exports = { apiLimiter, authLimiter, codeLimiter, mailLimiter };
