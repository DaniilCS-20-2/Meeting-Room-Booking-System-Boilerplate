// Импортируем подготовленный экземпляр Express-приложения.
const app = require("./app");
// Импортируем конфигурацию окружения.
const env = require("./config/env");
const WhitelistRepository = require("./models/whitelistRepository");

async function bootstrap() {
  // Засеиваем whitelist адресами админов из переменной окружения ADMIN_EMAILS.
  try {
    if (env.adminEmails.length > 0) {
      await WhitelistRepository.ensureSeed(env.adminEmails, "admin");
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Whitelist seed skipped:", err.message);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend is running on port ${env.port}`);
  });
}

bootstrap();
