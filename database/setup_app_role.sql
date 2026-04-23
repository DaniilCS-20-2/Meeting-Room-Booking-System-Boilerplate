-- ============================================================
-- setup_app_role.sql
-- ============================================================
-- Создаёт ограниченную роль PostgreSQL для backend'а (principle of least
-- privilege). Backend НЕ должен ходить в БД под суперпользователем.
--
-- Запускается под суперпользователем (postgres) ОДИН РАЗ:
--   psql -U postgres -d ferma_db -f database/setup_app_role.sql
--
-- Пароль задайте через переменную окружения APP_DB_PASS перед запуском
-- (для psql это можно через \set):
--   $env:APP_DB_PASS = "СТРОЧНЫЙ_ПАРОЛЬ"; psql ... -v app_pass="$env:APP_DB_PASS" -f setup_app_role.sql
-- Или пропишите пароль вручную ниже (CHANGE_ME).
--
-- После применения пропишите в backend/.env:
--   DATABASE_URL=postgres://ferma_app:<пароль>@localhost:5432/ferma_db

-- 1) Роль для приложения (идемпотентно).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ferma_app') THEN
        CREATE ROLE ferma_app LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD'
            NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION;
    END IF;
END $$;

-- 2) Права на схему public.
GRANT USAGE ON SCHEMA public TO ferma_app;

-- 3) Права на все текущие таблицы.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA public TO ferma_app;

-- 4) Права на последовательности (нужно для gen_random_uuid()/SERIAL не нужно,
--    но на всякий случай выдаём USAGE/SELECT).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ferma_app;

-- 5) Чтобы новые таблицы/последовательности автоматически получали права.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ferma_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO ferma_app;

-- 6) Явно запрещаем DDL (на всякий случай). ferma_app уже NOSUPERUSER
--    и не владелец таблиц, так что ALTER/DROP/CREATE ему недоступны.

-- 7) Миграции запускайте под postgres (или владельцем БД), а не под ferma_app.
