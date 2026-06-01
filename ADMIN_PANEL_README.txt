MOBA SHOP Admin Pro v126

Environment Variables required:
- ADMIN_PANEL_SECRET = owner password
- BOT_TOKEN = Telegram bot token
- ADMIN_IDS = your Telegram numeric ID(s), comma separated
- ADMIN_LOGIN_OTP=true to require Telegram code

Optional but recommended:
- ADMIN_DEVICE_APPROVAL=true forces OTP for unknown admin devices unless device/IP is trusted
- ADMIN_STAFF_SECRET = staff password (orders only)
- ADMIN_VIEWER_SECRET = viewer password (view only)
- ADMIN_SESSION_SECRET = separate long random session signing key
- ADMIN_SESSION_TTL_SECONDS = default 28800 (8 hours)

Admin URL:
/admin.html

Notes:
- API functions remain under Vercel Hobby limit.
- Owner can manage settings/products/security.
- Staff can manage orders.
- Viewer can only view.
