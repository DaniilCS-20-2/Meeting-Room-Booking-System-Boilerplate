-- ============================================================
-- Миграция 010: цвет комнаты (для общего календаря на главной).
-- ============================================================
-- Добавляем nullable HEX-цвет (#RRGGBB) к таблице rooms. Если NULL —
-- фронтенд использует детерминированный fallback от id комнаты.
ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS color VARCHAR(7);

-- Лёгкая валидация формата на уровне БД.
ALTER TABLE rooms
    DROP CONSTRAINT IF EXISTS rooms_color_format_chk;
ALTER TABLE rooms
    ADD CONSTRAINT rooms_color_format_chk
    CHECK (color IS NULL OR color ~* '^#[0-9a-f]{6}$');
