// Импортируем пул подключений из официального драйвера PostgreSQL.
const { Pool } = require("pg");
// Импортируем конфигурацию окружения.
const env = require("../config/env");

// Создаём единый пул подключений для всего backend.
const pool = new Pool({
  // Передаём строку подключения к БД.
  connectionString: env.databaseUrl,
});

// Экспортируем пул для использования в репозиториях и сервисах.
module.exports = pool;
