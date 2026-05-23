-- MOBA SHOP final orders table fix
-- آمن: لا يمسح الجدول ولا الطلبات

alter table public.orders
alter column id drop identity if exists;

alter table public.orders
alter column id drop default;

alter table public.orders
alter column id type text using id::text;

alter table public.orders
alter column order_code drop not null;

alter table public.orders add column if not exists handler text;
alter table public.orders add column if not exists handler_id text;
alter table public.orders add column if not exists admin_id text;
alter table public.orders add column if not exists admin_name text;
alter table public.orders add column if not exists note text;
alter table public.orders add column if not exists screenshot_url text;
alter table public.orders add column if not exists image_url text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists customer_username text;
alter table public.orders add column if not exists telegram_file_id text;
alter table public.orders add column if not exists telegram_photo_file_id text;
alter table public.orders add column if not exists telegram_chat_id text;
alter table public.orders add column if not exists telegram_user_id text;
alter table public.orders add column if not exists telegram_username text;
alter table public.orders add column if not exists customer_chat_id text;
alter table public.orders add column if not exists source text default 'website';
alter table public.orders add column if not exists order_type text default 'cart';
alter table public.orders add column if not exists raw_data jsonb default '{}'::jsonb;
alter table public.orders add column if not exists callback_data text;
alter table public.orders add column if not exists message_id text;
alter table public.orders add column if not exists admin_message_id text;
alter table public.orders add column if not exists photo_file_id text;
alter table public.orders add column if not exists screenshot_file_name text;
alter table public.orders add column if not exists status_history jsonb default '[]'::jsonb;
alter table public.orders add column if not exists claim_history jsonb default '[]'::jsonb;
alter table public.orders add column if not exists last_status_at timestamptz;
alter table public.orders add column if not exists last_status_by text;
alter table public.orders add column if not exists claimed_by text;
alter table public.orders add column if not exists claimed_by_name text;
alter table public.orders add column if not exists claimed_at timestamptz;
alter table public.orders add column if not exists telegram_text text;
alter table public.orders add column if not exists telegram_caption text;
alter table public.orders add column if not exists order_summary text;
alter table public.orders add column if not exists admin_status_text text;
alter table public.orders add column if not exists customer_status_text text;

notify pgrst, 'reload schema';
