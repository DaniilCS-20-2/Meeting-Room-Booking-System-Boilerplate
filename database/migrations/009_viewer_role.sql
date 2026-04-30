-- ============================================================
-- Миграция 009: read-only роль "viewer".
-- ============================================================
-- Viewer видит только календарь занятости комнат, но не имена пользователей,
-- селскапы и описания. Не может создавать бронирования и комментарии.

-- 1. Расширяем enum role_type новой ролью.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'viewer'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role_type')
    ) THEN
        ALTER TYPE role_type ADD VALUE 'viewer';
    END IF;
END $$;

-- 2. Поднимаем CHECK на pending_registrations: там роль хранится как TEXT,
-- а не enum, поэтому конструкцию нужно обновить руками.
ALTER TABLE pending_registrations
    DROP CONSTRAINT IF EXISTS pending_registrations_role_check;
ALTER TABLE pending_registrations
    ADD CONSTRAINT pending_registrations_role_check
    CHECK (role IN ('user', 'admin', 'viewer'));
