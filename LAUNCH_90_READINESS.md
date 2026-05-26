# MOBA SHOP - 90% Launch Readiness Checklist

Use this before sending real Eid traffic to the site.

## Required Vercel environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BOT_TOKEN`
- `ORDER_GROUP_ID`
- `ADMIN_IDS`
- `ADMIN_PANEL_SECRET`
- `ADMIN_SESSION_SECRET`
- `TELEGRAM_WEBHOOK_SECRET`
- `INTERNAL_API_SECRET`
- `CRON_SECRET`
- `ADMIN_LOGIN_OTP=true`
- `ADMIN_DEVICE_APPROVAL=true`

## Must-pass live test

1. Open the public site from the final Vercel link.
2. Add one product to cart.
3. Apply a coupon if coupons are active.
4. Choose payment method.
5. Upload a real image screenshot.
6. Submit the order once.
7. Confirm the order appears in Telegram with screenshot.
8. Open `/admin.html`, change status to processing, then delivered.
9. Search the customer phone in order tracking and confirm timeline updates.
10. Try opening `/api/telegram` without the webhook secret and confirm it is rejected.
11. Open `/api/health` while logged in as admin and confirm no missing variables.
12. Trigger `/api/process-telegram-queue?key=INTERNAL_API_SECRET` once after a test order if Telegram delivery fails.

## Vercel Hobby note

The free Hobby plan only allows cron jobs once per day, so this build does not include scheduled `crons` in `vercel.json`.

If you upgrade to Pro later, you can add:

```json
"crons": [
  {"path": "/api/check-late", "schedule": "*/10 * * * *"},
  {"path": "/api/process-telegram-queue", "schedule": "*/5 * * * *"}
]
```

On Hobby, run those endpoints manually with `?key=INTERNAL_API_SECRET` only when needed.

## Operating limits until queue/retry is added

- Safe browsing traffic: hundreds of users if Vercel caching is active.
- Safe order traffic: 10-25 orders/minute after persistent rate limits and Telegram retry are enabled.
- Watch carefully above 35 orders/minute.
- Do not push a large campaign if Telegram photo delivery starts delaying orders or queue retries start growing.

## Still recommended after this patch

- Add real file storage for screenshots so failed Telegram photo uploads can be fully replayed later.
- Compress the large Pharaoh and logo images to WebP/AVIF.
- Move admin inline JavaScript to a separate file when there is time.
- Move rate limits to Redis/Upstash if traffic becomes very large.
