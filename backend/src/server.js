// Импортируем подготовленный экземпляр Express-приложения.
const app = require("./app");
// Импортируем конфигурацию окружения.
const env = require("./config/env");

// Запускаем HTTP-сервер на указанном порту.
app.listen(env.port, () => {
  // Логируем факт запуска сервера.
  // eslint-disable-next-line no-console
  console.log(`Backend is running on port ${env.port}`);
});
