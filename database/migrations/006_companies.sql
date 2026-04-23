-- ============================================================
-- Миграция 006: компании (selskap) + привязка пользователей.
-- ============================================================
-- Каждая компания имеет имя и цвет для отображения в календарях.
-- У каждого пользователя — опциональная привязка к компании.

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    -- HEX-цвет вида '#RRGGBB' для окрашивания бронирований в календаре.
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Добавляем колонку company_id в users (NULL допустим для старых записей).
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users (company_id);

-- Добавляем одну дефолтную компанию, чтобы регистрация была возможна сразу
-- после установки. Админ затем сможет добавлять/переименовывать другие.
INSERT INTO companies (name, color)
VALUES ('FERMA', '#3b82f6')
ON CONFLICT (name) DO NOTHING;
