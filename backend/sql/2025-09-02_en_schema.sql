-- === SCHEMA ENGLISH + BACKFILL FROM SPANISH (idempotent) ===

-- 1) CLIENTS -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id          SERIAL PRIMARY KEY,
  first_name  TEXT,
  last_name   TEXT,
  email       TEXT,
  phone       TEXT,
  created_at  TIMESTAMP DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='clients' AND column_name='first_name') THEN
    ALTER TABLE public.clients ADD COLUMN first_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='clients' AND column_name='last_name') THEN
    ALTER TABLE public.clients ADD COLUMN last_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='clients' AND column_name='email') THEN
    ALTER TABLE public.clients ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='clients' AND column_name='phone') THEN
    ALTER TABLE public.clients ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='clients' AND column_name='created_at') THEN
    ALTER TABLE public.clients ADD COLUMN created_at TIMESTAMP DEFAULT now();
  END IF;
END$$;

-- Backfill desde posibles columnas ES o "name" con to_jsonb (no falla si no existen)
UPDATE public.clients c
SET
  first_name = COALESCE(
    first_name,
    NULLIF( split_part( COALESCE(to_jsonb(c)->>'name', to_jsonb(c)->>'nombre', ''), ' ', 1 ), '' )
  ),
  last_name = COALESCE(
    last_name,
    NULLIF( regexp_replace( COALESCE(to_jsonb(c)->>'name',''), '^\S+\s*', ''), '' ),
    NULLIF( to_jsonb(c)->>'apellido', '' )
  ),
  email = COALESCE(email, NULLIF(to_jsonb(c)->>'email',''), NULLIF(to_jsonb(c)->>'correo','')),
  phone = COALESCE(phone, NULLIF(to_jsonb(c)->>'phone',''), NULLIF(to_jsonb(c)->>'telefono','')),
  created_at = COALESCE(created_at, now())
WHERE
  first_name IS NULL OR last_name IS NULL OR email IS NULL OR phone IS NULL OR created_at IS NULL;

-- Índice único “suave” por email si no es NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email_unique
ON public.clients (lower(email))
WHERE email IS NOT NULL;

-- 2) SERVICES ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id           SERIAL PRIMARY KEY,
  client_id    INTEGER,
  service_name TEXT NOT NULL,
  status       TEXT DEFAULT 'open',
  created_at   TIMESTAMP DEFAULT now()
);

-- Asegurar columnas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='services' AND column_name='client_id') THEN
    ALTER TABLE public.services ADD COLUMN client_id INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='services' AND column_name='service_name') THEN
    ALTER TABLE public.services ADD COLUMN service_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='services' AND column_name='status') THEN
    ALTER TABLE public.services ADD COLUMN status TEXT DEFAULT 'open';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='services' AND column_name='created_at') THEN
    ALTER TABLE public.services ADD COLUMN created_at TIMESTAMP DEFAULT now();
  END IF;
END$$;

-- Si existía cliente_id en ES, backfill a client_id
UPDATE public.services s
SET client_id = COALESCE(
  client_id,
  NULLIF(to_jsonb(s)->>'client_id','')::int,
  NULLIF(to_jsonb(s)->>'cliente_id','')::int
)
WHERE client_id IS NULL
  AND ( (to_jsonb(s) ? 'client_id') OR (to_jsonb(s) ? 'cliente_id') );

-- Backfill de service_name/status desde ES si faltan
UPDATE public.services s
SET
  service_name = COALESCE(service_name, NULLIF(to_jsonb(s)->>'service_name',''), NULLIF(to_jsonb(s)->>'servicio','')),
  status       = COALESCE(status, NULLIF(to_jsonb(s)->>'status',''),   NULLIF(to_jsonb(s)->>'estado',''), 'open'),
  created_at   = COALESCE(created_at, now())
WHERE service_name IS NULL OR status IS NULL OR created_at IS NULL;

-- FK (tolerante). NOT VALID para no fallar si hay huérfanos; validar después.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'services_client_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.services
        ADD CONSTRAINT services_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE NOT VALID;
    EXCEPTION WHEN others THEN
      -- ignorar si no se puede crear ahora
      NULL;
    END;
  END IF;
END$$;

-- 3) SEEDS -------------------------------------------------------------------
-- Cliente demo (solo si no existe ese email)
INSERT INTO public.clients (first_name, last_name, email, phone)
SELECT 'Demo','Client','demo@example.com','+1-555-0000'
WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE lower(email)=lower('demo@example.com'));

-- Service demo para ese cliente
INSERT INTO public.services (client_id, service_name, status)
SELECT c.id, 'Initial inspection', 'open'
FROM public.clients c
WHERE lower(c.email)=lower('demo@example.com')
  AND NOT EXISTS (
    SELECT 1 FROM public.services s WHERE s.client_id = c.id AND s.service_name='Initial inspection'
  );

-- Intentar validar FK si existe y es posible (no detiene la migración si falla)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'services_client_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.services VALIDATE CONSTRAINT services_client_id_fkey;
    EXCEPTION WHEN others THEN
      -- si hay huérfanos, queda NOT VALID pero no interrumpe
      NULL;
    END;
  END IF;
END$$;

