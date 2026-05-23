export const config = {
  api: {
    bodyParser: false
  }
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

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(?:(?:"([^"]+)")|([^;]+))/i.exec(contentType || '');
  if (!boundaryMatch) return { fields: {}, files: {} };

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const fields = {};
  const files = {};

  let start = buffer.indexOf(boundaryBuffer);
  while (start !== -1) {
    start += boundaryBuffer.length;
    if (buffer[start] === 45 && buffer[start + 1] === 45) break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;

    const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), start);
    if (headerEnd === -1) break;

    const headerText = buffer.slice(start, headerEnd).toString('utf8');
    const partStart = headerEnd + 4;
    let nextBoundary = buffer.indexOf(boundaryBuffer, partStart);
    if (nextBoundary === -1) break;

    let partEnd = nextBoundary;
    if (buffer[partEnd - 2] === 13 && buffer[partEnd - 1] === 10) partEnd -= 2;
    const content = buffer.slice(partStart, partEnd);

    const nameMatch = /name="([^"]+)"/i.exec(headerText);
    const filenameMatch = /filename="([^"]*)"/i.exec(headerText);
    const typeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headerText);
    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch && filenameMatch[1]) {
        files[name] = {
          filename: filenameMatch[1],
          contentType: typeMatch ? typeMatch[1].trim() : 'application/octet-stream',
          buffer: content
        };
      } else {
        fields[name] = content.toString('utf8');
      }
    }

    start = nextBoundary;
  }

  return { fields, files };
}

async function telegramApi(method, formData) {
  const token = process.env.BOT_TOKEN;
  if (!token || token.includes('PUT_YOUR')) {
    throw new Error('BOT_TOKEN is missing in Vercel Environment Variables');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.description || `Telegram ${method} failed`);
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const groupId = process.env.ORDER_GROUP_ID;
    if (!groupId) {
      throw new Error('ORDER_GROUP_ID is missing in Vercel Environment Variables');
    }

    const raw = await readRawBody(req);
    const { fields, files } = parseMultipart(raw, req.headers['content-type']);

    const cart = JSON.parse(fields.cart || '[]');
    const customerPhone = String(fields.customerPhone || '').trim();
    const paymentMethod = String(fields.paymentMethod || '').trim();
    const customerName = String(fields.customerName || '').trim() || 'غير محدد';
    const note = String(fields.note || '').trim();
    const total = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const orderId = `WEB-${Date.now().toString().slice(-7)}`;

    if (!customerPhone || !/^01\d{9}$/.test(customerPhone)) {
      return json(res, 400, { ok: false, error: 'رقم الموبايل غير صحيح' });
    }
    if (!paymentMethod) {
      return json(res, 400, { ok: false, error: 'اختار طريقة الدفع' });
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return json(res, 400, { ok: false, error: 'سلة الطلبات فاضية' });
    }
    for (const item of cart) {
      if (!item.product || !item.pubgId || !/^\d{5,15}$/.test(String(item.pubgId))) {
        return json(res, 400, { ok: false, error: 'راجع المنتج و PUBG ID في السلة' });
      }
    }
    if (!files.screenshot || files.screenshot.buffer.length < 50) {
      return json(res, 400, { ok: false, error: 'ارفع سكرين التحويل' });
    }

    const itemLines = cart.map((item, index) => (
      `${index + 1}) ${escapeHtml(item.product)}\n` +
      `   ID: <code>${escapeHtml(item.pubgId)}</code>\n` +
      `   السعر: ${escapeHtml(item.price)} جنيه`
    )).join('\n\n');

    const message = `🚨 <b>طلب جديد من موقع MOBA SHOP</b>\n` +
      `━━━━━━━━━━━━━━\n` +
      `🧾 رقم الطلب: <code>${orderId}</code>\n` +
      `👤 الاسم: ${escapeHtml(customerName)}\n` +
      `📱 رقم العميل: <code>${escapeHtml(customerPhone)}</code>\n` +
      `💳 الدفع: ${escapeHtml(paymentMethod)}\n` +
      `💰 الإجمالي: <b>${total} جنيه</b>\n\n` +
      `🛒 <b>سلة الطلبات | Cart</b>\n${itemLines}\n\n` +
      (note ? `📝 ملاحظة: ${escapeHtml(note)}\n\n` : '') +
      `📸 السكرين مرفق تحت الرسالة`;

    const msgForm = new FormData();
    msgForm.append('chat_id', groupId);
    msgForm.append('text', message);
    msgForm.append('parse_mode', 'HTML');
    await telegramApi('sendMessage', msgForm);

    const photoForm = new FormData();
    photoForm.append('chat_id', groupId);
    photoForm.append('caption', `📸 Screenshot for ${orderId}`);
    photoForm.append('photo', new Blob([files.screenshot.buffer], { type: files.screenshot.contentType }), files.screenshot.filename || 'screenshot.jpg');
    await telegramApi('sendPhoto', photoForm);

    return json(res, 200, { ok: true, orderId });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || 'Server error' });
  }
}
