-- ============================================================
-- Миграция 007: сохраняем историю бронирований даже после
-- удаления пользователя.
-- ============================================================
-- Меняем каскад на SET NULL и храним snapshot'ы имени/почты
-- пользователя и компании прямо в строке бронирования, чтобы
-- список истории оставался читаемым даже когда пользователь
-- удалён из системы.

-- 1. Снимаем NOT NULL и меняем внешний ключ на ON DELETE SET NULL.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE bookings
    ADD CONSTRAINT bookings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 2. Добавляем snapshot-колонки для пользователя и его компании.
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS user_name_snapshot     TEXT,
    ADD COLUMN IF NOT EXISTS user_email_snapshot    TEXT,
    ADD COLUMN IF NOT EXISTS company_name_snapshot  TEXT,
    ADD COLUMN IF NOT EXISTS company_color_snapshot TEXT;

-- 3. Заполняем snapshot'ы для уже существующих бронирований.
UPDATE bookings b
SET user_name_snapshot     = u.display_name,
    user_email_snapshot    = u.email,
    company_name_snapshot  = c.name,
    company_color_snapshot = c.color
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
WHERE u.id = b.user_id
  AND (b.user_name_snapshot IS NULL OR b.user_email_snapshot IS NULL);

-- 4. Триггерная функция: на INSERT копируем актуальные данные
-- пользователя/компании в snapshot-поля.
CREATE OR REPLACE FUNCTION fill_booking_snapshots()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        SELECT u.display_name, u.email, c.name, c.color
          INTO NEW.user_name_snapshot,
               NEW.user_email_snapshot,
               NEW.company_name_snapshot,
               NEW.company_color_snapshot
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
         WHERE u.id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_booking_snapshots ON bookings;
CREATE TRIGGER trg_fill_booking_snapshots
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION fill_booking_snapshots();
