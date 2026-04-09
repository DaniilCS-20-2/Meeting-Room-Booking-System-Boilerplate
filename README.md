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

---

# Bookingsystem for møterom

System for å bestille møterom med nettgrensesnitt på nynorsk.

## Funksjonar

- **Bestilling av rom** — vel ledig tid, automatiske forslag til ledige tider, vekekalender.
- **Fleire bilete** — ein kan laste opp fleire bilete til kvart rom; karusell på romsida.
- **Fleksible avgrensingar** — admin set minimum/maksimum varigheit for kvar booking per rom (eller slår av grensa).
- **E-poststadfesting** — ved registrering, byte av passord og byte av e-post vert det sendt ein stadfestingskode.
- **Admin-rolle** — vert automatisk tildelt etter e-postliste i `ADMIN_EMAILS`.
- **Admin-panel** — oppretting/redigering/sletting av rom, brukaradministrasjon, avbestilling av andre sine bookingar.
- **Varsel** — når admin avbestiller ei booking, får eigaren e-post.
- **Stadfestingar** — alle destruktive handlingar krev stadfesting via modalt vindauge.
- **Historikk** — sortering etter tid eller aktivitet; tidlegare bookingar er berre synlege for admin.

## Teknologiar

| Lag | Stakk |
|-----|-------|
| Frontend | React 18, Vite, React Router, CSS (BEM) |
| Backend | Node.js, Express, JWT, bcryptjs |
| Database | PostgreSQL, GiST exclusion constraints |
| E-post | Nodemailer (Gmail SMTP) |
| Filar | Multer (opplasting av bilete) |

## Prosjektstruktur

```
database/migrations/     — SQL-migrasjonar (001–004)
backend/src/
  config/                — miljøkonfigurasjon
  db/                    — tilkoplingspool til PostgreSQL
  models/                — repository (SQL-spørjingar)
  services/              — forretningslogikk
  controllers/           — HTTP-handsamarar
  routes/                — API-rutar
  middlewares/           — auth, RBAC, feilhandsaming
  utils/                 — mailer, HttpError
frontend/src/
  pages/                 — sider (Heim, Rom, Auth, Profil, Admin)
  components/            — gjenbrukbare komponentar (ConfirmDialog)
  context/               — AuthContext
  i18n/                  — nynorsk ordbok
  styles/                — app.css
```

## Kjapt oppsett

### 1. Database

```bash
# Opprett databasen og køyr migrasjonane i rekkjefølgje:
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
# Rediger .env — oppgje DB-passord, JWT_SECRET, SMTP-innstillingar, ADMIN_EMAILS
npm install
npm run dev
# Tenaren startar på http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Opne http://localhost:5173
```

## Miljøvariablar (backend/.env)

| Variabel | Skildring |
|----------|-----------|
| `DATABASE_URL` | Tilkoplingsstreng til PostgreSQL |
| `JWT_SECRET` | Hemmeleg nøkkel for JWT-token |
| `PORT` | Tenarport (standard 4000) |
| `FRONTEND_URL` | Frontend-URL for CORS |
| `SMTP_USER` | Gmail-adresse for sending av e-post |
| `SMTP_PASS` | App Password frå Gmail |
| `ADMIN_EMAILS` | Kommaseparert liste med e-postar — desse brukarane får admin-rolla ved registrering |

## Grensesnittspråk

Heile grensesnittet er på **nynorsk**. Omsetjingar finst i `frontend/src/i18n/labels.js`.
