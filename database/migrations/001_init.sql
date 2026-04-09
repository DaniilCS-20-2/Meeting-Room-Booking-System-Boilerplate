-- ============================================================
-- Meeting Room Booking System — полная миграционная SQL-схема.
-- Версия 2: расширена под полноценный SaaS-продукт.
-- ============================================================

-- Подключаем расширение для генерации UUID через gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Подключаем расширение btree_gist для исключающих ограничений с room_id.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- ENUM-типы
-- ============================================================

-- Создаём enum для ролей пользователей (RBAC).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
        CREATE TYPE role_type AS ENUM ('user', 'admin');
    END IF;
END;
$$;

-- Создаём enum для статусов комнаты.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status_type') THEN
        -- ledig = свободна, opptatt = занята, vedlikehald = отключена/обслуживание.
        CREATE TYPE room_status_type AS ENUM ('ledig', 'opptatt', 'vedlikehald');
    END IF;
END;
$$;

-- Создаём enum для статусов бронирования.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_type') THEN
        -- confirmed/pending участвуют в блокировке конфликтующих интервалов.
        -- cancelled — отменённые записи, не блокируют слоты.
        CREATE TYPE booking_status_type AS ENUM ('pending', 'confirmed', 'cancelled');
    END IF;
END;
$$;

-- ============================================================
-- Таблица пользователей
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    -- Уникальный идентификатор пользователя.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Корпоративный email пользователя (уникальный).
    email TEXT NOT NULL UNIQUE,
    -- Отображаемое имя пользователя.
    display_name TEXT NOT NULL DEFAULT '',
    -- Хэш пароля (bcrypt) для безопасного хранения.
    password_hash TEXT NOT NULL,
    -- Роль пользователя для RBAC (user / admin).
    role role_type NOT NULL DEFAULT 'user',
    -- URL или путь к аватарке пользователя.
    avatar_url TEXT,
    -- Флаг подтверждения email.
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    -- Код подтверждения email (6-значный).
    verification_code TEXT,
    -- Время истечения кода подтверждения.
    verification_expires_at TIMESTAMPTZ,
    -- Технические поля аудита.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для быстрых поисков по email без учёта регистра.
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users ((LOWER(email)));

-- ============================================================
-- Таблица комнат
-- ============================================================

CREATE TABLE IF NOT EXISTS rooms (
    -- Уникальный идентификатор комнаты.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Человекочитаемое имя комнаты (например «Fjord 1»).
    name TEXT NOT NULL,
    -- Локация комнаты (этаж/зона/корпус).
    location TEXT NOT NULL DEFAULT '',
    -- Вместимость комнаты (количество человек).
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    -- Краткое описание комнаты и оборудования.
    description TEXT,
    -- Перечень оборудования (камера, проектор и т.д.).
    equipment TEXT,
    -- URL или путь к фотографии комнаты.
    photo_url TEXT,
    -- Минимальная длительность бронирования в минутах (по умолчанию 15).
    min_booking_minutes INTEGER NOT NULL DEFAULT 15 CHECK (min_booking_minutes >= 15),
    -- Максимальная длительность бронирования в минутах (по умолчанию 480 = 8 часов).
    max_booking_minutes INTEGER NOT NULL DEFAULT 480 CHECK (max_booking_minutes >= 15),
    -- Текущий статус доступности комнаты.
    status room_status_type NOT NULL DEFAULT 'ledig',
    -- Флаг временного отключения комнаты админом.
    is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    -- Технические поля аудита.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Бизнес-ограничение: макс >= мин.
    CONSTRAINT chk_booking_minutes_range CHECK (max_booking_minutes >= min_booking_minutes)
);

-- Индексы для частых фильтров каталога комнат.
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms (status);
CREATE INDEX IF NOT EXISTS idx_rooms_capacity ON rooms (capacity);
-- Индекс для быстрого поиска активных комнат.
CREATE INDEX IF NOT EXISTS idx_rooms_is_disabled ON rooms (is_disabled);

-- ============================================================
-- Таблица бронирований
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
    -- Уникальный идентификатор бронирования.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Ссылка на комнату.
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    -- Ссылка на автора бронирования.
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Границы интервала бронирования (UTC).
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    -- Статус бронирования.
    status booking_status_type NOT NULL DEFAULT 'confirmed',
    -- Идентификатор группы повторяющихся бронирований (UUID).
    recurrence_group_id UUID,
    -- Дополнительный комментарий пользователя при создании.
    comment TEXT,
    -- Технические поля аудита.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Бизнес-ограничение: конец позже начала минимум на 15 минут.
    CONSTRAINT chk_booking_duration CHECK (
        end_time > start_time
        AND end_time - start_time >= INTERVAL '15 minutes'
    )
);

-- Индексы для типичных запросов календаря и фильтрации.
CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON bookings (room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user_time ON bookings (user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_recurrence_group ON bookings (recurrence_group_id);
-- Индекс для быстрого поиска активных бронирований.
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

-- Добавляем вычисляемый диапазон для конфликтных проверок.
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS time_range TSTZRANGE
    GENERATED ALWAYS AS (tstzrange(start_time, end_time, '[)')) STORED;

-- Гарантируем отсутствие двойных бронирований по комнате во времени.
-- Ограничение действует только на активные статусы (pending/confirmed).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'exclude_room_overlapping_bookings'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT exclude_room_overlapping_bookings
            EXCLUDE USING gist (
                room_id WITH =,
                time_range WITH &&
            )
            WHERE (status IN ('pending', 'confirmed'));
    END IF;
END;
$$;

-- ============================================================
-- Таблица комментариев к бронированию / комнате
-- ============================================================

CREATE TABLE IF NOT EXISTS booking_comments (
    -- Уникальный идентификатор комментария.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Связь с комнатой (комментарии привязаны к комнате, не к бронированию).
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    -- Автор комментария.
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Текст комментария.
    message TEXT NOT NULL,
    -- Время создания.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для быстрой загрузки комментариев по комнате (новые сверху).
CREATE INDEX IF NOT EXISTS idx_comments_room_id ON booking_comments (room_id, created_at DESC);