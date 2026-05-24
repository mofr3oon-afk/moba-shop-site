-- MOBA SHOP Final Supabase Schema Fix V3
-- آمن: لا يمسح جدول orders ولا الطلبات القديمة

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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders alter column id drop identity if exists;
alter table public.orders alter column id drop default;
alter table public.orders alter column id type text using id::text;

alter table public.orders add column if not exists order_code text;
alter table public.orders alter column order_code drop not null;
alter table public.orders add column if not exists order_date text;
alter table public.orders add column if not exists daily_number integer;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists customer_username text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists total numeric default 0;
alter table public.orders add column if not exists status text default 'pending';
alter table public.orders add column if not exists status_text text default 'تم استلام الطلب';
alter table public.orders add column if not exists customer_status_text text;
alter table public.orders add column if not exists admin_status_text text;
alter table public.orders add column if not exists handler text;
alter table public.orders add column if not exists handler_id text;
alter table public.orders add column if not exists admin_id text;
alter table public.orders add column if not exists admin_name text;
alter table public.orders add column if not exists note text;
alter table public.orders add column if not exists internal_note text;
alter table public.orders add column if not exists items jsonb default '[]'::jsonb;
alter table public.orders add column if not exists source text default 'website';
alter table public.orders add column if not exists order_type text default 'cart';
alter table public.orders add column if not exists raw_data jsonb default '{}'::jsonb;
alter table public.orders add column if not exists status_history jsonb default '[]'::jsonb;
alter table public.orders add column if not exists claim_history jsonb default '[]'::jsonb;
alter table public.orders add column if not exists last_status_at timestamptz;
alter table public.orders add column if not exists last_status_by text;
alter table public.orders add column if not exists claimed_by text;
alter table public.orders add column if not exists claimed_by_name text;
alter table public.orders add column if not exists claimed_at timestamptz;
alter table public.orders add column if not exists telegram_chat_id text;
alter table public.orders add column if not exists telegram_user_id text;
alter table public.orders add column if not exists telegram_username text;
alter table public.orders add column if not exists customer_chat_id text;
alter table public.orders add column if not exists telegram_message_id bigint;
alter table public.orders add column if not exists admin_message_id text;
alter table public.orders add column if not exists message_id text;
alter table public.orders add column if not exists callback_data text;
alter table public.orders add column if not exists photo_file_id text;
alter table public.orders add column if not exists telegram_file_id text;
alter table public.orders add column if not exists telegram_photo_file_id text;
alter table public.orders add column if not exists screenshot_file_name text;
alter table public.orders add column if not exists screenshot_url text;
alter table public.orders add column if not exists image_url text;
alter table public.orders add column if not exists telegram_text text;
alter table public.orders add column if not exists telegram_caption text;
alter table public.orders add column if not exists order_summary text;

create index if not exists orders_phone_idx on public.orders(phone);
create index if not exists orders_customer_phone_idx on public.orders(customer_phone);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_order_date_idx on public.orders(order_date);
create index if not exists orders_daily_number_idx on public.orders(daily_number);


-- V5 transfer verification and one-time customer fix columns
alter table public.orders add column if not exists transfer_mode text;
alter table public.orders add column if not exists transfer_last3 text;
alter table public.orders add column if not exists transfer_confirm_text text;
alter table public.orders add column if not exists fix_type text;
alter table public.orders add column if not exists fix_reason text;
alter table public.orders add column if not exists fix_attempts integer default 0;
alter table public.orders add column if not exists fix_requested_at timestamptz;
alter table public.orders add column if not exists fix_submitted_at timestamptz;
alter table public.orders add column if not exists fix_payload jsonb default '{}'::jsonb;
alter table public.orders add column if not exists rejection_reason text;

notify pgrst, 'reload schema';



-- V10 admin order management columns
alter table public.orders add column if not exists archived_at timestamptz;
alter table public.orders add column if not exists deleted_reason text;
alter table public.orders add column if not exists pinned boolean default false;
alter table public.orders add column if not exists fix_type text;
alter table public.orders add column if not exists fix_count integer default 0;
alter table public.orders add column if not exists transfer_confirm text;
alter table public.orders add column if not exists transfer_info text;
alter table public.orders add column if not exists transfer_last3 text;

create index if not exists orders_phone_created_idx on public.orders(phone, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);

notify pgrst, 'reload schema';



-- V13 reviews table
create table if not exists public.reviews (
  id bigserial primary key,
  customer_name text not null,
  rating integer not null default 5,
  review_text text not null,
  is_approved boolean default true,
  created_at timestamptz default now()
);

create index if not exists reviews_created_at_idx on public.reviews(created_at desc);
create index if not exists reviews_approved_idx on public.reviews(is_approved);

-- Important: allow monthly reset and repeated daily MOBA codes if needed
alter table public.orders drop constraint if exists orders_order_code_key;

notify pgrst, 'reload schema';



-- V13.1 Telegram button lookup fix support
alter table public.orders add column if not exists daily_number integer;
alter table public.orders add column if not exists order_code text;
alter table public.orders drop constraint if exists orders_order_code_key;
create index if not exists orders_order_code_created_idx on public.orders(order_code, created_at desc);
create index if not exists orders_daily_number_created_idx on public.orders(daily_number, created_at desc);

notify pgrst, 'reload schema';



-- V13.2 Telegram buttons must use real internal id
alter table public.orders add column if not exists daily_number integer;
alter table public.orders add column if not exists order_code text;
alter table public.orders drop constraint if exists orders_order_code_key;
create index if not exists orders_id_idx on public.orders(id);
create index if not exists orders_order_code_created_idx on public.orders(order_code, created_at desc);
create index if not exists orders_daily_number_created_idx on public.orders(daily_number, created_at desc);

notify pgrst, 'reload schema';



-- V13.3 final server json fix support
alter table public.orders add column if not exists daily_number integer;
alter table public.orders add column if not exists order_code text;
alter table public.orders drop constraint if exists orders_order_code_key;

create table if not exists public.reviews (
  id bigserial primary key,
  customer_name text not null,
  rating integer not null default 5,
  review_text text not null,
  is_approved boolean default true,
  created_at timestamptz default now()
);

create index if not exists reviews_created_at_idx on public.reviews(created_at desc);
create index if not exists reviews_approved_idx on public.reviews(is_approved);
create index if not exists orders_order_code_created_idx on public.orders(order_code, created_at desc);
create index if not exists orders_daily_number_created_idx on public.orders(daily_number, created_at desc);

notify pgrst, 'reload schema';



-- V14 customer fix flow columns
alter table public.orders add column if not exists customer_fix_note text;
alter table public.orders add column if not exists fix_type text;
alter table public.orders add column if not exists fix_count integer default 0;
alter table public.orders add column if not exists last_status_by text;
alter table public.orders add column if not exists last_status_at timestamptz;
alter table public.orders add column if not exists customer_status_text text;
alter table public.orders add column if not exists admin_status_text text;

notify pgrst, 'reload schema';



-- V17 ops upgrade
alter table public.orders add column if not exists pinned boolean default false;
create index if not exists orders_pinned_idx on public.orders(pinned);

alter table public.reviews add column if not exists is_approved boolean default false;
update public.reviews set is_approved=false where is_approved is null;

notify pgrst, 'reload schema';



-- V30 busy mode and late order alerts
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

insert into public.settings(key,value) values
('busy_mode','false'),
('busy_message','')
on conflict (key) do nothing;

alter table public.orders add column if not exists late_alerted_at timestamptz;
create index if not exists orders_late_alert_idx on public.orders(status, created_at, late_alerted_at);

notify pgrst, 'reload schema';



-- V31 coupons
create table if not exists public.coupons (
  id bigserial primary key,
  code text unique not null,
  discount_amount numeric not null default 0,
  min_order_amount numeric not null default 0,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists coupon_discount numeric default 0;

create index if not exists coupons_code_idx on public.coupons(code);
create index if not exists coupons_active_idx on public.coupons(is_active);

notify pgrst, 'reload schema';
