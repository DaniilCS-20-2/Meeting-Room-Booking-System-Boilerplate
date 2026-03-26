# Meeting Room Booking System Boilerplate

## Что уже подготовлено

- `database/migrations/001_init.sql` — миграционная SQL-схема PostgreSQL с ролями, комнатами, бронированиями, индексами и защитой от двойного бронирования.
- `backend/src` — backend на Node.js + Express с сервисным слоем, RBAC и глобальной обработкой ошибок.
- `frontend/src` — пример React Dashboard (Functional Components + Hooks) с Tailwind-классами и интерфейсом только на Nynorsk.

## Структура папок

- `database/migrations` — SQL-миграции для PostgreSQL.
- `backend/src/config` — конфигурация окружения.
- `backend/src/db` — подключение к базе.
- `backend/src/models` — репозитории (доступ к данным).
- `backend/src/services` — бизнес-логика (SOLID: изоляция правил предметной области).
- `backend/src/controllers` — HTTP-слой (валидация входа/выхода).
- `backend/src/routes` — маршруты API.
- `backend/src/middlewares` — middleware (auth, RBAC, обработка ошибок).
- `backend/src/utils` — служебные утилиты и типизированные ошибки.
- `frontend/src/components/atoms` — базовые UI-элементы.
- `frontend/src/components/molecules` — составные UI-блоки.
- `frontend/src/components/organisms` — крупные UI-секции.
- `frontend/src/i18n` — словари меток интерфейса.

## Как работает recurring booking (еженедельные повторения)

1. Клиент передаёт:
   - `startDateTime` и `endDateTime` первого слота,
   - `recurring.weekdays` (например, `[1, 4]` для Mon/Thu),
   - `recurring.untilDate` (дата окончания серии).
2. Сервис проверяет:
   - время кратно 15 минутам,
   - длительность не меньше 15 минут,
   - `untilDate` не раньше первой даты.
3. Сервис генерирует набор конкретных слотов (каждый понедельник/четверг в том же времени).
4. Все слоты вставляются в БД в одной транзакции.
5. Если хотя бы один слот конфликтует, PostgreSQL исключающее ограничение (`EXCLUDE USING gist`) отклоняет транзакцию — серия не создаётся частично.

## Быстрый старт (пример)

- Подготовьте PostgreSQL и выполните `database/migrations/001_init.sql`.
- Заполните `.env` для backend (`JWT_SECRET`, `DATABASE_URL`, `ALLOWED_EMAIL_DOMAIN`).
- Установите зависимости и запустите backend/frontend в ваших стандартных scripts.

## Важно

- Язык UI: только Nynorsk.
- Для production добавьте полноценную валидацию входных DTO (например, `zod`) и тесты (`unit` + `integration`).
