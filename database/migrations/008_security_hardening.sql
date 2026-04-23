-- ============================================================
-- Миграция 008: укрепление безопасности
-- ============================================================
-- 1. Добавляем users.token_version — механизм инвалидации JWT после смены
--    пароля/почты: токены, выданные до инкремента, становятся недействительны.
-- 2. Выносим verification codes в отдельную таблицу с attempts/locked_until,
--    чтобы нельзя было перебирать код в лоб и нельзя было клонировать строки
--    пользователя.
-- 3. Pending registrations тоже храним в БД, чтобы переживали рестарт и
--    сохраняли attempts между попытками.

-- 1) token_version для всех пользователей.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;

-- 2) Таблица одноразовых кодов верификации (email change, password change,
--    password reset). Один активный код на пару (user_id, purpose).
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL CHECK (purpose IN (
        'password_reset', 'password_change', 'email_change'
    )),
    -- Храним именно хеш кода, чтобы утечка БД не давала коды напрямую.
    code_hash TEXT NOT NULL,
    payload JSONB,                  -- дополнительные данные (например, новый email)
    attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,       -- блокировка при превышении attempts
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_expires
    ON verification_codes(expires_at);

-- 3) Pending registrations: храним незавершённую регистрацию в БД
--    (переживает рестарт, attempts/lock делят поля с verification_codes).
CREATE TABLE IF NOT EXISTS pending_registrations (
    email TEXT PRIMARY KEY,         -- нижний регистр, уникальный ключ
    display_name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    code_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires
    ON pending_registrations(expires_at);
