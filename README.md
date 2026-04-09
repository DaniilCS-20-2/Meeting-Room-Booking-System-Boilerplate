# Meeting Room Booking System

Система бронирования переговорных комнат с веб-интерфейсом на нюнорск (Nynorsk).

## Возможности

- **Бронирование комнат** — выбор свободного времени, автоподсказка ближайших слотов, недельный календарь.
- **Несколько фото** — к каждой комнате можно загрузить несколько фотографий; на странице комнаты работает карусель.
- **Гибкие ограничения** — админ задаёт минимальную/максимальную длительность бронирования для каждой комнаты (или отключает лимит).
- **Подтверждение по email** — при регистрации, смене пароля и смене email отправляется код подтверждения.
- **Роль админа** — автоматически назначается по списку email из `ADMIN_EMAILS`.
- **Админ-панель** — создание/редактирование/удаление комнат, управление пользователями, отмена чужих бронирований.
- **Уведомления** — при отмене бронирования админом владелец получает email.
- **Подтверждения** — все деструктивные действия требуют подтверждения через модальное окно.
- **История** — сортировка по времени или активности; прошедшие бронирования видны только админу.

## Технологии

| Слой | Стек |
|------|------|
| Frontend | React 18, Vite, React Router, CSS (BEM) |
| Backend | Node.js, Express, JWT, bcryptjs |
| БД | PostgreSQL, GiST exclusion constraints |
| Email | Nodemailer (Gmail SMTP) |
| Файлы | Multer (загрузка фото) |

## Структура проекта

```
database/migrations/     — SQL-миграции (001–004)
backend/src/
  config/                — конфигурация окружения
  db/                    — пул подключений к PostgreSQL
  models/                — репозитории (SQL-запросы)
  services/              — бизнес-логика
  controllers/           — HTTP-обработчики
  routes/                — маршруты API
  middlewares/           — auth, RBAC, обработка ошибок
  utils/                 — mailer, HttpError
frontend/src/
  pages/                 — страницы (Home, Room, Auth, Profile, Admin)
  components/            — переиспользуемые компоненты (ConfirmDialog)
  context/               — AuthContext
  i18n/                  — словарь Nynorsk
  styles/                — app.css
```

## Быстрый старт

### 1. База данных

```bash
# Создайте БД и выполните миграции по порядку:
psql -U postgres -c "CREATE DATABASE booking_app_db;"
psql -U postgres -d booking_app_db -f database/migrations/001_init.sql
psql -U postgres -d booking_app_db -f database/migrations/002_seed.sql
psql -U postgres -d booking_app_db -f database/migrations/003_flexible_duration.sql
psql -U postgres -d booking_app_db -f database/migrations/004_room_photos.sql
```

### 2. Backend

```bash
cd backend
cp env.example .env
# Отредактируйте .env — укажите пароль БД, JWT_SECRET, SMTP-настройки, ADMIN_EMAILS
npm install
npm run dev
# Сервер запустится на http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Откройте http://localhost:5173
```

## Переменные окружения (backend/.env)

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `JWT_SECRET` | Секрет для подписи JWT-токенов |
| `PORT` | Порт сервера (по умолчанию 4000) |
| `FRONTEND_URL` | URL фронтенда для CORS |
| `SMTP_USER` | Gmail-адрес для отправки писем |
| `SMTP_PASS` | App Password от Gmail |
| `ADMIN_EMAILS` | Список email через запятую — эти пользователи получат роль admin при регистрации |

## Язык интерфейса

Весь UI на **нюнорск** (Nynorsk). Переводы в `frontend/src/i18n/labels.js`.
