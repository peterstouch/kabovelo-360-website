// Emails via Resend (https://resend.com). Without RESEND_API_KEY emails are logged, not sent.

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kwacha = (n) => 'K' + Math.round(n).toLocaleString('en-US');

export async function sendEmail(env, { to, subject, html, replyTo }) {
    if (!env.RESEND_API_KEY) {
        console.log(`[email not sent – no RESEND_API_KEY] to=${to} subject="${subject}"`);
        return { skipped: true };
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.FROM_EMAIL, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) })
    });
    if (!res.ok) {
        console.error('Resend error', res.status, await res.text());
        return { ok: false };
    }
    return { ok: true };
}

function layout(env, inner) {
    return `<!doctype html><html><body style="margin:0;background:#f3f4f1;font-family:Helvetica,Arial,sans-serif;color:#1a1e1b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f1;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e6e0">
<tr><td style="background:#0a0c0b;padding:24px 28px">
  <span style="font-family:Georgia,serif;font-size:20px;letter-spacing:3px;color:#ffffff;font-weight:bold">KABOVELO</span>
  <span style="font-size:11px;color:#8bae77;border:1px solid #4a633d;border-radius:4px;padding:2px 6px;margin-left:6px;letter-spacing:2px">360</span>
</td></tr>
<tr><td style="padding:28px">${inner}</td></tr>
<tr><td style="padding:18px 28px;background:#f8f9f7;border-top:1px solid #e3e6e0;font-size:12px;color:#6b7280;line-height:1.6">
  KABOVELO 360 · ${esc(env.SITE_LOCATION || 'Zambia')}<br>
  <a href="mailto:${esc(env.ADMIN_EMAIL)}" style="color:#4a633d">${esc(env.ADMIN_EMAIL)}</a> · ${esc(env.ADMIN_PHONE)} ·
  <a href="${esc(env.PUBLIC_SITE_URL)}" style="color:#4a633d">${esc(String(env.PUBLIC_SITE_URL).replace(/^https?:\/\//, ''))}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(order) {
    const items = JSON.parse(order.items_json);
    const rows = items.map(i => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef0ec;font-size:14px">
            <strong>${esc(i.title)}</strong><br>
            <span style="color:#6b7280;font-size:12px">${esc(i.division)} · ${esc(i.tierName)}${i.qty > 1 ? ` · ${i.qty} × ${kwacha(i.unitPrice)}${i.unit ? ' / ' + esc(i.unit) : ''}` : ''}</span>
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #eef0ec;font-size:14px;white-space:nowrap">${kwacha(i.lineTotal)}</td>
        </tr>`).join('');
    const discount = order.discount_pct
        ? `<tr><td style="padding:8px 0;font-size:13px;color:#4a633d">Ecosystem synergy discount (${order.discount_pct}%)</td><td align="right" style="padding:8px 0;font-size:13px;color:#4a633d">−${kwacha(order.subtotal - order.total)}</td></tr>`
        : '';
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}${discount}
        <tr><td style="padding:14px 0 0;font-size:15px"><strong>Total paid</strong></td>
            <td align="right" style="padding:14px 0 0;font-size:18px;color:#2c3a25"><strong>${kwacha(order.total)}</strong></td></tr></table>`;
}

function detailsBlock(order) {
    const d = order.details_json ? JSON.parse(order.details_json) : {};
    const labels = {
        intake: 'Intake', studentName: 'Student', dob: 'Date of birth', idNumber: 'NRC / Passport', experience: 'Experience level',
        guardianName: 'Guardian', guardianPhone: 'Guardian phone', preferredDate: 'Preferred start date', notes: 'Notes', heardFrom: 'Heard about us'
    };
    const rows = Object.entries(labels).filter(([k]) => d[k]).map(([k, l]) =>
        `<tr><td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top">${l}</td><td style="padding:4px 0;font-size:13px">${esc(d[k])}</td></tr>`).join('');
    return rows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px">${rows}</table>` : '';
}

export function receiptEmail(env, order) {
    const isEnroll = order.type === 'enrollment';
    const masked = ('0' + order.phone.slice(3)).replace(/^(\d{3})\d{4}(\d{3})$/, '$1••••$2');
    const subject = isEnroll
        ? `Enrollment confirmed – ${order.ref} | KABOVELO 360`
        : `Payment received – ${order.ref} | KABOVELO 360`;
    const inner = `
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#4a633d;margin:0 0 8px"><strong>${isEnroll ? 'Film Academy Enrollment' : 'Booking Confirmation'}</strong></p>
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 14px;color:#0a0c0b">Thank you, ${esc(order.customer_name.split(' ')[0])}.</h1>
      <p style="font-size:14px;line-height:1.6;margin:0 0 20px">We have received your mobile money payment. ${isEnroll ? 'Your place in the Film Academy is reserved.' : 'Your booking is confirmed and our team will contact you to schedule the work.'}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9f7;border-radius:10px;margin-bottom:20px"><tr><td style="padding:14px 16px;font-size:13px;line-height:1.8">
        <strong>Reference:</strong> ${esc(order.ref)}<br>
        <strong>Date:</strong> ${esc(new Date(order.paid_at || order.updated_at).toLocaleString('en-GB', { timeZone: 'Africa/Lusaka', dateStyle: 'medium', timeStyle: 'short' }))}<br>
        <strong>Paid with:</strong> ${esc(order.operator)} Mobile Money (${esc(masked)})${order.provider_ref ? `<br><strong>Transaction ID:</strong> ${esc(order.provider_ref)}` : ''}
      </td></tr></table>
      ${itemsTable(order)}
      ${detailsBlock(order)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;border:1px solid #c9d8bf;border-radius:10px;background:#f4f8f1"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.6">
        <strong style="color:#2c3a25">Next step: send your Proof of Payment (POP)</strong><br>
        Please send a screenshot of your mobile money confirmation SMS to
        <a href="mailto:${esc(env.ADMIN_EMAIL)}?subject=${encodeURIComponent('POP – ' + order.ref)}" style="color:#2c3a25"><strong>${esc(env.ADMIN_EMAIL)}</strong></a>
        with the subject <strong>“POP – ${esc(order.ref)}”</strong>, or simply reply to this email with it attached.
        You can also WhatsApp it to <strong>${esc(env.ADMIN_PHONE)}</strong>.
      </td></tr></table>
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:22px 0 0">Questions? Reply to this email or call ${esc(env.ADMIN_PHONE)}.</p>`;
    return { subject, html: layout(env, inner) };
}

export function adminOrderEmail(env, order) {
    const customer = `${esc(order.customer_name)} · <a href="mailto:${esc(order.email)}">${esc(order.email)}</a> · ${esc(order.phone)} (${esc(order.operator)})`;
    const inner = `
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 6px">New ${order.type === 'enrollment' ? 'enrollment' : 'booking'} paid – ${kwacha(order.total)}</h1>
      <p style="font-size:13px;color:#6b7280;margin:0 0 18px">Ref ${esc(order.ref)}${order.provider_ref ? ` · Lipila ${esc(order.provider_ref)}` : ''}</p>
      <p style="font-size:14px;margin:0 0 18px">${customer}</p>
      ${itemsTable(order)}
      ${detailsBlock(order)}
      <p style="font-size:13px;color:#6b7280;margin:22px 0 0">The customer has been asked to email their POP with subject “POP – ${esc(order.ref)}”.</p>`;
    return { subject: `💳 ${kwacha(order.total)} paid – ${order.customer_name} (${order.ref})`, html: layout(env, inner) };
}

export function inquiryEmail(env, f) {
    const rows = [['Name', f.name], ['Email', f.email], ['Phone', f.phone], ['Division', f.division], ['Budget', f.budget], ['Subject', f.subject]]
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0;font-size:13px;color:#6b7280">${k}</td><td style="padding:4px 0;font-size:14px">${esc(v)}</td></tr>`).join('');
    const inner = `
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px">New website inquiry</h1>
      <table role="presentation" cellpadding="0" cellspacing="0">${rows}</table>
      <div style="margin-top:18px;padding:16px;background:#f8f9f7;border-radius:10px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(f.message)}</div>
      <p style="font-size:12px;color:#6b7280;margin-top:16px">Reply directly to this email to answer ${esc(f.name)}.</p>`;
    return { subject: `Website inquiry – ${f.division || 'General'} – ${f.name}`, html: layout(env, inner) };
}
