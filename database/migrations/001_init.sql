-- Подключаем расширение для генерации UUID через gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Подключаем расширение btree_gist для исключающих ограничений с room_id.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Создаём enum для ролей пользователей.
DO $$
BEGIN
    -- Проверяем наличие типа role_type перед созданием.
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
        -- Создаём роли User и Admin для строгого RBAC.
        CREATE TYPE role_type AS ENUM ('user', 'admin');
    END IF;
END;
$$;

-- Создаём enum для статусов комнаты.
DO $$
BEGIN
    -- Проверяем наличие типа room_status_type перед созданием.
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status_type') THEN
        -- Статусы соответствуют i18n-меткам (например status_ledig).
        CREATE TYPE room_status_type AS ENUM ('ledig', 'opptatt', 'vedlikehald');
    END IF;
END;
$$;

-- Создаём enum для статусов бронирования.
DO $$
BEGIN
    -- Проверяем наличие типа booking_status_type перед созданием.
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_type') THEN
        -- confirmed/pending участвуют в блокировке конфликтующих интервалов.
        CREATE TYPE booking_status_type AS ENUM ('pending', 'confirmed', 'cancelled');
    END IF;
END;
$$;

-- Создаём таблицу пользователей.
CREATE TABLE IF NOT EXISTS users (
    -- Уникальный идентификатор пользователя.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Корпоративный email пользователя.
    email TEXT NOT NULL UNIQUE,
    -- Хэш пароля (bcrypt/argon2) для безопасного хранения.
    password_hash TEXT NOT NULL,
    -- Роль пользователя для RBAC.
    role role_type NOT NULL DEFAULT 'user',
    -- Технические поля аудита.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для быстрых поисков по email без учёта регистра.
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users ((LOWER(email)));

-- Создаём таблицу комнат.
CREATE TABLE IF NOT EXISTS rooms (
    -- Уникальный идентификатор комнаты.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Человекочитаемое имя комнаты.
    name TEXT NOT NULL,
    -- Локация комнаты (этаж/зона/корпус).
    location TEXT NOT NULL,
    -- Вместимость комнаты.
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    -- Описание оборудования/комментариев по комнате.
    description TEXT,
    -- Текущий статус доступности.
    status room_status_type NOT NULL DEFAULT 'ledig',
    -- Технические поля аудита.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Имя комнаты уникально в пределах локации.
    CONSTRAINT uq_rooms_name_location UNIQUE (name, location)
);

-- Индексы для частых фильтров каталога комнат.
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms (status);
CREATE INDEX IF NOT EXISTS idx_rooms_capacity ON rooms (capacity);

-- Создаём таблицу бронирований.
CREATE TABLE IF NOT EXISTS bookings (
    -- Уникальный идентификатор бронирования.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Ссылка на комнату.
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    -- Ссылка на автора бронирования.
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    -- Границы интервала бронирования (UTC).
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    -- Статус бронирования.
    status booking_status_type NOT NULL DEFAULT 'confirmed',
    -- Идентификатор группы повторяющихся бронирований.
    recurrence_group_id UUID,
    -- Дополнительный комментарий пользователя.
    comment TEXT,
    -- Технические поля аудита.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Бизнес-ограничение: конец позже начала минимум на 15 минут.
    CONSTRAINT chk_booking_duration CHECK (end_time > start_time AND end_time - start_time >= INTERVAL '15 minutes')
);

-- Индексы для типичных запросов календаря и фильтрации.
CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON bookings (room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user_time ON bookings (user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_recurrence_group ON bookings (recurrence_group_id);

-- Добавляем вычисляемый диапазон для конфликтных проверок.
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS time_range TSTZRANGE
    GENERATED ALWAYS AS (tstzrange(start_time, end_time, '[)')) STORED;

-- Гарантируем отсутствие двойных бронирований по комнате во времени.
-- Ограничение действует только на активные статусы (pending/confirmed).
DO $$
BEGIN
    -- Проверяем, существует ли уже нужное ограничение.
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'exclude_room_overlapping_bookings'
    ) THEN
        -- Создаём исключающее ограничение с пересечением диапазонов.
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

-- Таблица комментариев к бронированию для истории коммуникаций.
CREATE TABLE IF NOT EXISTS booking_comments (
    -- Уникальный идентификатор комментария.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Связь с бронированием.
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    -- Автор комментария.
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    -- Текст комментария.
    message TEXT NOT NULL,
    -- Время создания.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для быстрой загрузки комментариев по бронированию.
CREATE INDEX IF NOT EXISTS idx_booking_comments_booking_id ON booking_comments (booking_id, created_at);
