-- MOBA SHOP V217 safety/admin update
-- Safe additions: no data deletion.

alter table public.orders add column if not exists terms_accepted boolean default false;
alter table public.orders add column if not exists internal_note text;
alter table public.orders add column if not exists vip boolean default false;
alter table public.orders add column if not exists telegram_delivery_status text;
alter table public.orders add column if not exists rejection_reason text;

-- Prevent duplicate daily visible order numbers.
-- If you already have duplicated rows for the same date/number, clean them first,
-- then run this index.
create unique index if not exists orders_daily_unique_idx
on public.orders(order_date, daily_number)
where order_date is not null and daily_number is not null;

-- Helpful indexes for admin filters/reports.
create index if not exists orders_payment_method_idx on public.orders(payment_method);
create index if not exists orders_updated_at_idx on public.orders(updated_at desc);

notify pgrst, 'reload schema';
