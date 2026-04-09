-- Allow NULL for min/max booking duration (NULL = no limit).
-- Remove hard CHECK >= 15 constraints.

ALTER TABLE rooms
    ALTER COLUMN min_booking_minutes DROP NOT NULL,
    ALTER COLUMN min_booking_minutes SET DEFAULT NULL,
    DROP CONSTRAINT IF EXISTS rooms_min_booking_minutes_check,
    ALTER COLUMN max_booking_minutes DROP NOT NULL,
    ALTER COLUMN max_booking_minutes SET DEFAULT NULL,
    DROP CONSTRAINT IF EXISTS rooms_max_booking_minutes_check,
    DROP CONSTRAINT IF EXISTS chk_booking_minutes_range;

ALTER TABLE rooms
    ADD CONSTRAINT chk_min_booking_positive CHECK (min_booking_minutes IS NULL OR min_booking_minutes > 0),
    ADD CONSTRAINT chk_max_booking_positive CHECK (max_booking_minutes IS NULL OR max_booking_minutes > 0),
    ADD CONSTRAINT chk_booking_minutes_range CHECK (
        min_booking_minutes IS NULL
        OR max_booking_minutes IS NULL
        OR max_booking_minutes >= min_booking_minutes
    );

-- Relax booking duration constraint: only require end > start (at least 1 minute).
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_booking_duration;
ALTER TABLE bookings
    ADD CONSTRAINT chk_booking_duration CHECK (
        end_time > start_time
        AND end_time - start_time >= INTERVAL '1 minute'
    );
