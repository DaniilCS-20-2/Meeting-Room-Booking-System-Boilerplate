-- Создаём отдельную базу данных для системы бронирования переговорных.
CREATE DATABASE meeting_room_booking
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    TEMPLATE = template0;
