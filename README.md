# MOBA SHOP Upgrade V3

النسخة دي فيها:

- بيانات الدفع تظهر بعد اختيار طريقة الدفع فقط
- زر نسخ لكل رقم واسم ويوزر
- زر فتح لينك InstaPay
- رقم طلب داخلي للادمن فقط: MOBA 1001 ويتجدد يوميا
- العميل يتابع الطلب برقم الموبايل فقط
- اوامر ادمن: /today /week /month /customer /orders /pending /delivered
- زر سجل العميل تحت كل اوردر
- منع تكرار الطلب المفتوح لنفس الرقم ونفس PUBG ID
- Header عام للجيمرز مش محصور في ببجي
- كروت ثقة وخطوات الطلب
- كارت نجاح بعد الطلب
- ازرار مشكلة جاهزة: سكرين غير واضح / ID غلط

## Environment Variables في Vercel

```env
BOT_TOKEN=توكن البوت
ORDER_GROUP_ID=-5019191154
ADMIN_IDS=1865494579,1038352981
TELEGRAM_WEBHOOK_SECRET=اي_كلمة_سرية
SETUP_SECRET=moba_setup_2026
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

## Supabase

افتح ملف `supabase_orders_final_fix.sql` وانسخ الكود وشغله في Supabase SQL Editor.

## تفعيل Webhook بعد كل Deploy

افتح الرابط ده مع لينك موقعك:

```text
https://YOUR_SITE.vercel.app/api/setup-webhook?key=moba_setup_2026
```

## اوامر الادمن

```text
/today
/week
/month
/customer 010xxxxxxxx
/orders 010xxxxxxxx
/pending
/delivered
/help
```
