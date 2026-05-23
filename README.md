# MOBA SHOP Order Page - Admin Buttons + Order Status

النسخة دي فيها:

- واجهة طلبات MOBA SHOP
- سلة الطلبات | Cart
- رفع سكرين التحويل
- ارسال الطلب لجروب تليجرام
- ازرار ادمن تحت كل طلب في تليجرام
- متابعة حالة الطلب من الموقع برقم الطلب + رقم الموبايل

## 1) Environment Variables في Vercel

ضيف المتغيرات دي في Vercel > Project Settings > Environment Variables:

```env
BOT_TOKEN=توكن البوت من BotFather
ORDER_GROUP_ID=-5019191154
ADMIN_IDS=1865494579,1038352981
TELEGRAM_WEBHOOK_SECRET=اكتب_اي_كلمة_سرية_طويلة
SETUP_SECRET=اكتب_اي_كلمة_سرية_تانية
SUPABASE_URL=رابط مشروع Supabase
SUPABASE_SERVICE_ROLE_KEY=Service Role Key من Supabase
```

مهم: متحطش BOT_TOKEN او Service Role Key في index.html.

## 2) جدول Supabase

افتح Supabase > SQL Editor وشغل الكود ده:

```sql
create table if not exists public.orders (
  id text primary key,
  phone text not null,
  customer_name text,
  payment_method text,
  total numeric default 0,
  status text default 'pending',
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

create index if not exists orders_phone_idx on public.orders(phone);
create index if not exists orders_status_idx on public.orders(status);
```

## 3) تفعيل ازرار الادمن في تليجرام

بعد Deploy افتح اللينك ده في المتصفح مع تغيير `YOUR_SITE` و `SETUP_SECRET_VALUE`:

```text
https://YOUR_SITE.vercel.app/api/setup-webhook?key=SETUP_SECRET_VALUE
```

لو ظهر `ok: true` يبقى ازرار التليجرام اتفعلت.

## 4) استخدام الموقع

العميل يعمل طلب من الموقع. الطلب هيوصل لجروب التليجرام ومعاه ازرار:

- استلمت | Claim
- بدأ التنفيذ
- تم الشحن
- تعليق
- مشكلة
- رفض
- البيانات

لما الادمن يدوس زر، حالة الطلب تتحدث في Supabase، والعميل يقدر يتابع من الموقع من قسم:

`متابعة حالة الطلب | Order Status`

بـ:

- رقم الطلب
- رقم الموبايل

## ملاحظات مهمة

- لو Supabase مش متفعل، الطلب هيوصل للتليجرام عادي، لكن متابعة الحالة من الموقع مش هتشتغل.
- لو ازرار التليجرام مش بترد، اتأكد انك فتحت رابط setup-webhook بعد الديبلوي.
- لو عندك بوت Python شغال Polling في نفس الوقت، ممكن يحصل تعارض مع Webhook. الافضل توقف نسخة الـ Polling لو هتستخدم ازرار Vercel.
