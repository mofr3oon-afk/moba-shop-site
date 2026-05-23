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

const ACTION_REPLY = {
  claimed: '🙋 تم استلام الطلب',
  processing: '🔄 تم بدء التنفيذ',
  delivered: '✅ تم الشحن بنجاح',
  on_hold: '⏸ تم تعليق الطلب',
  needs_fix: '⚠️ تم تحديد مشكلة في الطلب',
  rejected: '❌ تم رفض الطلب'
};

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function isAdmin(userId) {
  const ids = String(process.env.ADMIN_IDS || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  return ids.includes(String(userId));
}

async function telegramApi(method, payload) {
  const token = process.env.BOT_TOKEN;
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.description || `Telegram ${method} failed`);
  return data;
}

async function supabaseRequest(path, options = {}) {
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

async function getOrder(orderId) {
  const select = 'id,phone,customer_name,payment_method,total,status,handler,items,note,status_history,telegram_message_id';
  const rows = await supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}&select=${select}&limit=1`);
  return rows?.[0] || null;
}

async function updateOrder(orderId, payload) {
  return supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() })
  });
}

function telegramKeyboard(orderId, status) {
  return {
    inline_keyboard: [
      [
        { text: status === 'claimed' ? '🙋 مستلم بالفعل' : '🙋 استلمت | Claim', callback_data: `web_claim_${orderId}` },
        { text: status === 'processing' ? '🔄 جاري التنفيذ' : '🔄 بدأ التنفيذ', callback_data: `web_processing_${orderId}` }
      ],
      [
        { text: status === 'delivered' ? '✅ تم الشحن' : '✅ تم الشحن', callback_data: `web_delivered_${orderId}` },
        { text: status === 'on_hold' ? '⏸ معلق' : '⏸ تعليق', callback_data: `web_hold_${orderId}` }
      ],
      [
        { text: status === 'needs_fix' ? '⚠️ فيه مشكلة' : '⚠️ مشكلة', callback_data: `web_fix_${orderId}` },
        { text: status === 'rejected' ? '❌ مرفوض' : '❌ رفض', callback_data: `web_reject_${orderId}` }
      ],
      [
        { text: '📋 البيانات | Data', callback_data: `web_data_${orderId}` }
      ]
    ]
  };
}

function renderTelegramText(order, status, handlerName) {
  const cart = Array.isArray(order.items) ? order.items : [];
  const itemLines = cart.map((item, index) => (
    `${index + 1}) ${escapeHtml(item.product)}\n` +
    `   ID: <code>${escapeHtml(item.pubgId)}</code>\n` +
    `   السعر: ${escapeHtml(item.price)} جنيه`
  )).join('\n\n');

  return `🚨 <b>طلب من موقع MOBA SHOP</b>\n` +
    `━━━━━━━━━━━━━━\n` +
    `🧾 رقم الطلب: <code>${escapeHtml(order.id)}</code>\n` +
    `📌 الحالة: <b>${STATUS_LABELS[status] || status}</b>\n` +
    (handlerName ? `👨‍💻 المسؤول: ${escapeHtml(handlerName)}\n` : '') +
    `👤 الاسم: ${escapeHtml(order.customer_name || 'غير محدد')}\n` +
    `📱 رقم العميل: <code>${escapeHtml(order.phone || '')}</code>\n` +
    `💳 الدفع: ${escapeHtml(order.payment_method || '')}\n` +
    `💰 الإجمالي: <b>${escapeHtml(order.total || 0)} جنيه</b>\n\n` +
    `🛒 <b>سلة الطلبات | Cart</b>\n${itemLines}\n\n` +
    (order.note ? `📝 ملاحظة: ${escapeHtml(order.note)}\n\n` : '') +
    `📸 السكرين مرفق تحت الرسالة`;
}

async function answerCallback(callbackQueryId, text, showAlert = false) {
  await telegramApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: Boolean(showAlert)
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  if (process.env.TELEGRAM_WEBHOOK_SECRET && req.query.secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return json(res, 403, { ok: false });
  }

  let cb = null;
  try {
    const update = await readJson(req);
    cb = update.callback_query;
    if (!cb) return json(res, 200, { ok: true });

    const userId = cb.from?.id;
    const adminName = cb.from?.first_name || cb.from?.username || 'Admin';

    if (!isAdmin(userId)) {
      await answerCallback(cb.id, 'مش مصرح لك', true);
      return json(res, 200, { ok: true });
    }

    const data = String(cb.data || '');
    if (!data.startsWith('web_')) return json(res, 200, { ok: true });

    const [, action, ...rest] = data.split('_');
    const orderId = rest.join('_');
    const order = await getOrder(orderId);

    if (!order) {
      await answerCallback(cb.id, 'الطلب مش موجود', true);
      return json(res, 200, { ok: true });
    }

    if (action === 'data') {
      const cart = Array.isArray(order.items) ? order.items : [];
      const itemsText = cart.map((item, i) => `${i + 1}) ${item.product}\nID: ${item.pubgId}\nPrice: ${item.price}`).join('\n\n');
      await telegramApi('sendMessage', {
        chat_id: cb.message.chat.id,
        reply_to_message_id: cb.message.message_id,
        text: `📋 بيانات الطلب ${order.id}\n━━━━━━━━━━━━━━\nPhone: ${order.phone}\nPayment: ${order.payment_method}\nTotal: ${order.total}\n\n${itemsText}`
      });
      await answerCallback(cb.id, 'تم إرسال البيانات');
      return json(res, 200, { ok: true });
    }

    const actionToStatus = {
      claim: 'claimed',
      processing: 'processing',
      delivered: 'delivered',
      hold: 'on_hold',
      fix: 'needs_fix',
      reject: 'rejected'
    };

    const newStatus = actionToStatus[action];
    if (!newStatus) {
      await answerCallback(cb.id, 'امر غير معروف', true);
      return json(res, 200, { ok: true });
    }

    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({ status: newStatus, label: STATUS_LABELS[newStatus], at: new Date().toISOString(), by: adminName, admin_id: String(userId) });

    await updateOrder(orderId, {
      status: newStatus,
      status_text: STATUS_LABELS[newStatus],
      handler: adminName,
      handler_id: String(userId),
      admin_id: String(userId),
      admin_name: adminName,
      last_status_at: new Date().toISOString(),
      last_status_by: adminName,
      status_history: history
    });

    const newText = renderTelegramText(order, newStatus, adminName);
    await telegramApi('editMessageText', {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: newText,
      parse_mode: 'HTML',
      reply_markup: telegramKeyboard(orderId, newStatus)
    });

    await telegramApi('sendMessage', {
      chat_id: cb.message.chat.id,
      reply_to_message_id: cb.message.message_id,
      text: `${ACTION_REPLY[newStatus] || 'تم تحديث الطلب'}\n👨‍💻 بواسطة: ${adminName}\n🧾 الطلب: ${orderId}`
    });

    await answerCallback(cb.id, `تم تحديث الحالة: ${STATUS_LABELS[newStatus]}`);
    return json(res, 200, { ok: true });
  } catch (error) {
    try {
      if (cb?.id) await answerCallback(cb.id, error.message || 'حصل خطأ', true);
    } catch {}
    return json(res, 200, { ok: false, error: error.message || 'Server error' });
  }
}
