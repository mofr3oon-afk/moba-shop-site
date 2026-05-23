# MOBA SHOP Order Page

واجهة طلبات بسيطة لمتجر MOBA SHOP:

- منتجات PUBG
- سلة الطلبات | Cart
- ID لكل منتج
- رفع سكرين التحويل
- ارسال الطلب لجروب تليجرام
- بدون ظهور توكن البوت في كود العميل

## التشغيل على Vercel

1. ارفع الملفات على GitHub أو اسحب فولدر المشروع على Vercel.
2. من Settings > Environment Variables ضيف:

```env
BOT_TOKEN=توكن البوت من BotFather
ORDER_GROUP_ID=-5019191154
```

3. اعمل Deploy.
4. افتح رابط الموقع وجرب طلب صغير.

## مهم

لا تضع BOT_TOKEN داخل index.html نهائيًا. التوكن مكانه فقط في Environment Variables داخل Vercel.
