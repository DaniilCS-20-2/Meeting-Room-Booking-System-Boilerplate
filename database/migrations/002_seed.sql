-- Seed: 3 demo rooms + 1 admin user (password: admin123).
INSERT INTO users (email, display_name, password_hash, role, email_verified)
VALUES (
    'admin@ferma.no',
    'Admin',
    '$2a$10$fqPVsNjee.uCk0aCkdw1POXgXJ0stkQ9WOlysBqENx2jVpg/2ub3O',
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO rooms (name, location, capacity, description, equipment, photo_url)
VALUES
    ('Fjord 1', '2. etasje', 6,  'Lite rom for raske teammote.',          'Skjerm, webkamera, whiteboard', NULL),
    ('Fjord 2', '2. etasje', 12, 'Stort rom med videokonferanseutstyr.',  'Projektor, hogtalar, mikrofon', NULL),
    ('Fjord 3', '3. etasje', 4,  'Stille rom for korte planleggingsmote.','Skjerm, HDMI-kabel',           NULL)
ON CONFLICT DO NOTHING;
