-- ============================================================
-- Миграция 005: белый список почт для регистрации.
-- ============================================================
-- Только почты, присутствующие в email_whitelist, могут зарегистрироваться.
-- Роль присваивается согласно полю role (user / admin).

CREATE TABLE IF NOT EXISTS email_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role role_type NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_whitelist_lower ON email_whitelist ((LOWER(email)));
