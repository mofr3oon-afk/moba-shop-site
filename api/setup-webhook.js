function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  try {
    const key = String(req.query.key || '');
    if (!process.env.SETUP_SECRET || key !== process.env.SETUP_SECRET) {
      return json(res, 403, { ok: false, error: 'Wrong setup key' });
    }
    if (!process.env.BOT_TOKEN) return json(res, 500, { ok: false, error: 'BOT_TOKEN missing' });
    if (!process.env.TELEGRAM_WEBHOOK_SECRET) return json(res, 500, { ok: false, error: 'TELEGRAM_WEBHOOK_SECRET missing' });

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const webhookUrl = `${proto}://${host}/api/telegram?secret=${encodeURIComponent(process.env.TELEGRAM_WEBHOOK_SECRET)}`;

    const form = new FormData();
    form.append('url', webhookUrl);
    form.append('drop_pending_updates', 'true');
    const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`, { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    return json(res, response.ok ? 200 : 500, { ok: response.ok && data.ok !== false, webhookUrl, telegram: data });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message });
  }
}
