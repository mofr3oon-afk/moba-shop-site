const STATUS_LABELS = {
  pending: '⏳ قيد المراجعة | Pending',
  claimed: '🙋 تم استلام الطلب | Claimed',
  processing: '🔄 بدأ التنفيذ | Processing',
  delivered: '✅ تم الشحن | Delivered',
  on_hold: '⏸ معلق | On Hold',
  needs_fix: '⚠️ محتاج مراجعة | Needs Fix',
  rejected: '❌ مرفوض | Rejected',
  cancelled: '🗑 ملغي | Cancelled'
};

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function supabaseReady() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(path, options = {}) {
  if (!supabaseReady()) throw new Error('Status tracking needs Supabase Environment Variables');
  const url = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Supabase error: ${text || response.status}`);
  }
  return response.json().catch(() => null);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const phone = String(req.query.phone || '').trim();
    if (!/^01\d{9}$/.test(phone)) {
      return json(res, 400, { ok: false, error: 'اكتب رقم موبايل صحيح' });
    }

    const select = 'id,phone,customer_name,total,status,handler,items,note,created_at,updated_at,status_history';
    const rows = await supabaseRequest(`orders?phone=eq.${encodeURIComponent(phone)}&select=${select}&order=created_at.desc&limit=1`);

    if (!rows || rows.length === 0) {
      return json(res, 404, { ok: false, error: 'مفيش طلبات مسجلة على الرقم ده' });
    }

    const order = rows[0];
    return json(res, 200, {
      ok: true,
      order: {
        ...order,
        status_label: STATUS_LABELS[order.status] || order.status
      }
    });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || 'Server error' });
  }
}
