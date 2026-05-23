-- MOBA SHOP final orders table
-- آمن: لا يمسح الجدول ولا الطلبات

create table if not exists public.orders (
  id text primary key,
  phone text not null,
  customer_name text,
  payment_method text,
  total numeric default 0,
  status text default 'pending',
  status_text text default 'تم استلام الطلب',
  handler text,
  items jsonb default '[]'::jsonb,
  note text,
  telegram_chat_id text,
  telegram_message_id bigint,
  telegram_text text,
  status_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders
alter column id drop identity if exists;

alter table public.orders
alter column id drop default;

alter table public.orders
alter column id type text using id::text;

alter table public.orders add column if not exists order_code text;
alter table public.orders alter column order_code drop not null;

alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists total numeric default 0;
alter table public.orders add column if not exists status text default 'pending';
alter table public.orders add column if not exists status_text text default 'تم استلام الطلب';
alter table public.orders add column if not exists handler text;
alter table public.orders add column if not exists handler_id text;
alter table public.orders add column if not exists admin_id text;
alter table public.orders add column if not exists admin_name text;
alter table public.orders add column if not exists items jsonb default '[]'::jsonb;
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

create index if not exists orders_phone_idx on public.orders(phone);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

notify pgrst, 'reload schema';
