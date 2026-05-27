-- Optional but recommended: run this in Supabase SQL editor once
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_destination text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_settings_snapshot jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS telegram_photo_file_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS screenshot_file_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS raw_data jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_history jsonb;
