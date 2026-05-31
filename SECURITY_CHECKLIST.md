# MOBA SHOP Security Checklist

## Secrets
- Never put these in GitHub or index.html:
  - SUPABASE_SERVICE_ROLE_KEY
  - BOT_TOKEN
  - TELEGRAM_WEBHOOK_SECRET
  - SETUP_SECRET
  - INTERNAL_API_SECRET
- Store all of them only in Vercel Environment Variables.
- Rotate any token that was ever shared in screenshots or chat.

## Required Vercel Environment Variables
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- BOT_TOKEN
- ORDER_GROUP_ID
- ADMIN_IDS
- TELEGRAM_WEBHOOK_SECRET
- SETUP_SECRET
- INTERNAL_API_SECRET
- MAX_SCREENSHOT_SIZE = 5242880

## Telegram Admin
- ADMIN_IDS must include only you and trusted staff.
- All Telegram admin commands must check ADMIN_IDS.

## Upload Rules
- Only one screenshot image is allowed.
- Allowed types: JPG / JPEG / PNG / WEBP.
- Max size: 5MB by default.
- No PDFs, videos, ZIPs, EXE, or multiple files.

## Supabase
- RLS should be enabled on:
  - orders
  - reviews
  - coupons
  - settings
- Do not add public write policies.
- Use server APIs with service role only.

## API Protection
- setup-webhook requires SETUP_SECRET.
- internal debug/check-late requires INTERNAL_API_SECRET or SETUP_SECRET.
- order/fix/reviews/coupon have rate limits.
- Customers never see raw server errors.

## Customer Data
- Do not expose all orders publicly.
- Order tracking should only fetch by phone/customer input.
- Admin names should not be shown to customers.

## Monthly Maintenance
- Review Vercel logs for abuse.
- Rotate tokens every few months.
- Delete old screenshots/orders if no longer needed.
