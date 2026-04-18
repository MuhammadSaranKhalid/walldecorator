-- =====================================================
-- Migration: Currency Tables
-- Description: Add currencies + exchange_rate_snapshots tables.
--              Add display_currency + exchange_rate_snapshot_id to orders.
--              Seed initial PKR/USD/EUR data.
-- =====================================================

-- ─── currencies ───────────────────────────────────────────────────────────────
-- Static metadata per supported currency. Seeded once; rarely changes.

CREATE TABLE IF NOT EXISTS public.currencies (
  code          TEXT PRIMARY KEY,
  symbol        TEXT NOT NULL,
  name          TEXT NOT NULL,
  flag          TEXT,
  locale        TEXT NOT NULL,
  decimals      INTEGER NOT NULL DEFAULT 2,
  is_base       BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.currencies            IS 'Supported currencies — static metadata, seeded once';
COMMENT ON COLUMN public.currencies.is_base    IS 'True for PKR only — the base currency all prices are stored in';
COMMENT ON COLUMN public.currencies.rate       IS 'Removed: live rates now live in exchange_rate_snapshots';

-- ─── exchange_rate_snapshots ──────────────────────────────────────────────────
-- Append-only log — every rate update (cron or manual) inserts a new row.
-- Current rate = DISTINCT ON (currency_code) ORDER BY fetched_at DESC.

CREATE TABLE IF NOT EXISTS public.exchange_rate_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code  TEXT NOT NULL REFERENCES public.currencies(code) ON DELETE CASCADE,
  base_currency  TEXT NOT NULL DEFAULT 'PKR',
  rate           NUMERIC(18, 8) NOT NULL,
  source         TEXT NOT NULL CHECK (source IN ('cron_auto', 'manual_override', 'seed')),
  api_provider   TEXT,
  fetched_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.exchange_rate_snapshots        IS 'Append-only rate history. Current rate = latest row per currency_code.';
COMMENT ON COLUMN public.exchange_rate_snapshots.rate   IS '1 PKR = X units of this currency';
COMMENT ON COLUMN public.exchange_rate_snapshots.source IS 'cron_auto | manual_override | seed';

CREATE INDEX IF NOT EXISTS idx_exchange_rate_snapshots_currency_fetched
  ON public.exchange_rate_snapshots (currency_code, fetched_at DESC);

-- ─── orders: add display tracking columns ─────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS display_currency          TEXT NOT NULL DEFAULT 'PKR',
  ADD COLUMN IF NOT EXISTS exchange_rate_snapshot_id UUID REFERENCES public.exchange_rate_snapshots(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.orders.display_currency          IS 'Currency user selected at checkout (display only — all amounts stored in PKR)';
COMMENT ON COLUMN public.orders.exchange_rate_snapshot_id IS 'Rate snapshot active at purchase — lets us reconstruct exactly what price the user saw';

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_snapshots ENABLE ROW LEVEL SECURITY;

-- Rates are public data — anyone can read
CREATE POLICY "currencies_public_read"
  ON public.currencies FOR SELECT USING (true);

CREATE POLICY "exchange_rate_snapshots_public_read"
  ON public.exchange_rate_snapshots FOR SELECT USING (true);

-- ─── Seed: currencies ─────────────────────────────────────────────────────────
INSERT INTO public.currencies (code, symbol, name, flag, locale, decimals, is_base, is_active, display_order)
VALUES
  ('PKR', 'Rs.', 'Pakistani Rupee', '🇵🇰', 'en-PK', 0, true,  true, 0),
  ('USD', '$',   'US Dollar',       '🇺🇸', 'en-US', 2, false, true, 1),
  ('EUR', '€',   'Euro',            '🇪🇺', 'de-DE', 2, false, true, 2)
ON CONFLICT (code) DO NOTHING;

-- ─── Seed: initial exchange rate snapshots ────────────────────────────────────
-- Sourced from the previously hardcoded values in lib/currency.ts.
-- These will be replaced automatically once the daily cron runs.

INSERT INTO public.exchange_rate_snapshots (currency_code, base_currency, rate, source, fetched_at)
VALUES
  ('USD', 'PKR', 0.00359700, 'seed', now()),
  ('EUR', 'PKR', 0.00333300, 'seed', now());
