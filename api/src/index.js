// KABOVELO 360 — payments & enrollment API (Cloudflare Worker)
//
//   POST /api/orders               create a booking/enrollment and send the mobile money prompt
//   GET  /api/orders/:ref          payment status (polled by the checkout page)
//   POST /api/webhooks/lipila      Lipila payment callback
//   POST /api/contact              contact / proposal form → email to admin
//   GET  /api/health               mode check
//
// Prices always come from catalog.json (generated from assets/js/data.js), never from the browser.

import catalog from './catalog.json';
import { normalizePhone, detectOperator, normalizeStatus, lipilaMode, createCollection, checkCollection, verifyWebhook } from './lipila.js';
import { sendEmail, receiptEmail, adminOrderEmail, inquiryEmail } from './email.js';

const SYNERGY_DISCOUNT = { 2: 10, 3: 15, 4: 20, 5: 25 };
const MAX_QTY = 30;

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const cors = corsHeaders(request, env);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

        try {
            let res;
            const path = url.pathname.replace(/\/+$/, '');
            const orderMatch = path.match(/^\/api\/orders\/(K360-[A-Z0-9]{8})$/);

            if (path === '/api/health' && request.method === 'GET') {
                res = json({ ok: true, mode: lipilaMode(env), email: env.RESEND_API_KEY ? 'resend' : 'log-only' });
            } else if (path === '/api/orders' && request.method === 'POST') {
                res = await createOrder(request, env);
            } else if (orderMatch && request.method === 'GET') {
                res = await getOrder(orderMatch[1], env, ctx);
            } else if (path === '/api/webhooks/lipila' && request.method === 'POST') {
                res = await lipilaWebhook(request, env, ctx);
            } else if (path === '/api/contact' && request.method === 'POST') {
                res = await contact(request, env);
            } else {
                res = json({ error: 'Not found' }, 404);
            }
            Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
            return res;
        } catch (err) {
            if (!err.expose) console.error(err);
            const status = err.expose ? 400 : 500;
            return json({ error: err.expose ? err.message : 'Something went wrong. Please try again.' }, status, cors);
        }
    }
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function userError(message) {
    const e = new Error(message);
    e.expose = true;
    return e;
}

function corsHeaders(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    return {
        'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin'
    };
}

async function readJson(request) {
    try { return await request.json(); } catch { throw userError('Invalid request.'); }
}

const clean = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const cleanMultiline = (v, max = 3000) => String(v ?? '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, max);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function newRef() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return 'K360-' + Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

/** Prices the cart from the catalog. Throws a readable error for anything invalid. */
function priceItems(rawItems, env) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) throw userError('Your cart is empty.');
    if (rawItems.length > 15) throw userError('Too many items in one order.');
    const seen = new Set();
    const items = rawItems.map(r => {
        const service = catalog.services[r.serviceId];
        if (!service) throw userError('One of the selected services no longer exists.');
        const tier = service.tiers[r.tier];
        if (!tier) throw userError(`Choose a package for ${service.title}.`);
        if (!tier.payable || !(tier.price > 0)) throw userError(`${service.title} – ${tier.name} cannot be paid online. Please contact us.`);
        const key = r.serviceId;
        if (seen.has(key)) throw userError(`${service.title} is in your cart twice.`);
        seen.add(key);
        const qty = tier.unit ? Math.min(MAX_QTY, Math.max(1, parseInt(r.qty, 10) || 1)) : 1;
        return {
            serviceId: r.serviceId, tier: r.tier, title: service.title, division: service.division,
            tierName: tier.name, unit: tier.unit || null, unitPrice: tier.price, qty, lineTotal: tier.price * qty
        };
    });
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const divisions = new Set(items.map(i => i.division)).size;
    const discountPct = SYNERGY_DISCOUNT[divisions] || 0;
    const total = Math.round(subtotal * (100 - discountPct) / 100);
    const limit = Number(env.ONLINE_LIMIT || 150000);
    if (total > limit) throw userError(`Mobile money payments are limited to K${limit.toLocaleString('en-US')} per transaction. Please remove an item or request a quote.`);
    return { items, subtotal, discountPct, total };
}

function publicOrder(o) {
    return {
        ref: o.ref, type: o.type, status: o.status, total: o.total, subtotal: o.subtotal, discountPct: o.discount_pct,
        operator: o.operator, phoneMasked: ('0' + o.phone.slice(3)).replace(/^(\d{3})\d{4}(\d{3})$/, '$1••••$2'),
        email: o.email, name: o.customer_name, items: JSON.parse(o.items_json),
        message: o.status === 'failed' ? (o.provider_msg || 'The payment was not completed.') : null,
        createdAt: o.created_at, paidAt: o.paid_at
    };
}

// ------------------------------------------------------------------
// Orders
// ------------------------------------------------------------------
async function createOrder(request, env) {
    const body = await readJson(request);
    if (body.website) throw userError('Invalid request.'); // honeypot

    const type = body.type === 'enrollment' ? 'enrollment' : 'booking';
    const c = body.customer || {};
    const name = clean(c.name, 120);
    const email = clean(c.email, 160).toLowerCase();
    const phone = normalizePhone(c.phone);
    if (name.length < 2) throw userError('Please enter your full name.');
    if (!isEmail(email)) throw userError('Please enter a valid email address.');
    if (!phone) throw userError('Enter a valid Zambian mobile money number, e.g. 0977 123 456.');
    const operator = detectOperator(phone);

    const { items, subtotal, discountPct, total } = priceItems(body.items, env);

    const d = body.details || {};
    let details;
    if (type === 'enrollment') {
        if (items.length !== 1 || items[0].division !== 'Film Academy') throw userError('Enrollment must be for one Film Academy course.');
        const intake = clean(d.intake, 60);
        if (!intake) throw userError('Please choose an intake.');
        details = {
            intake, studentName: clean(d.studentName || name, 120), dob: clean(d.dob, 20), idNumber: clean(d.idNumber, 40),
            experience: clean(d.experience, 60), guardianName: clean(d.guardianName, 120), guardianPhone: clean(d.guardianPhone, 30),
            heardFrom: clean(d.heardFrom, 60), notes: cleanMultiline(d.notes, 1500)
        };
    } else {
        details = { preferredDate: clean(d.preferredDate, 20), notes: cleanMultiline(d.notes, 1500) };
    }

    const ref = newRef();
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO orders (ref, type, status, customer_name, email, phone, operator, items_json, details_json, subtotal, discount_pct, total, created_at, updated_at)
        VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(ref, type, name, email, phone, operator, JSON.stringify(items), JSON.stringify(details), subtotal, discountPct, total, now, now).run();

    try {
        const narration = type === 'enrollment' ? `KABOVELO Academy ${ref}` : `KABOVELO 360 ${ref}`;
        const r = await createCollection(env, { referenceId: ref, amount: total, phone, narration, email });
        const st = normalizeStatus(r.status);
        await env.DB.prepare('UPDATE orders SET provider_ref = ?, provider_msg = ?, status = ?, updated_at = ? WHERE ref = ?')
            .bind(r.identifier || r.externalId || null, clean(r.message, 300), st === 'failed' ? 'failed' : 'pending', new Date().toISOString(), ref).run();
        if (st === 'failed') throw userError(r.message || 'The mobile money request was declined. Please check the number and try again.');
    } catch (err) {
        if (!err.expose) {
            console.error('Lipila collection error', err.message);
            await env.DB.prepare("UPDATE orders SET status = 'failed', provider_msg = ?, updated_at = ? WHERE ref = ?")
                .bind(clean(err.message, 300), new Date().toISOString(), ref).run();
            throw userError('We could not reach the mobile money network. Please try again in a moment.');
        }
        throw err;
    }

    const order = await env.DB.prepare('SELECT * FROM orders WHERE ref = ?').bind(ref).first();
    return json({ order: publicOrder(order), mode: lipilaMode(env) }, 201);
}

async function getOrder(ref, env, ctx) {
    let order = await env.DB.prepare('SELECT * FROM orders WHERE ref = ?').bind(ref).first();
    if (!order) return json({ error: 'Order not found' }, 404);
    if (order.status === 'pending') order = await refreshStatus(order, env, ctx);
    return json({ order: publicOrder(order), mode: lipilaMode(env) });
}

/** Asks Lipila for the latest status and records it. Sends emails exactly once when paid. */
async function refreshStatus(order, env, ctx) {
    let r;
    try {
        r = await checkCollection(env, order);
    } catch (err) {
        console.error('check-status error', err.message);
        return order;
    }
    const st = normalizeStatus(r.status);
    if (st === 'pending') return order;
    const now = new Date().toISOString();
    const providerRef = r.identifier || r.externalId || order.provider_ref;
    const update = await env.DB.prepare(`UPDATE orders SET status = ?, provider_msg = ?, provider_ref = ?, updated_at = ?, paid_at = CASE WHEN ? = 'paid' THEN ? ELSE paid_at END
        WHERE ref = ? AND status = 'pending'`)
        .bind(st, clean(r.message, 300), providerRef, now, st, now, order.ref).run();
    const fresh = await env.DB.prepare('SELECT * FROM orders WHERE ref = ?').bind(order.ref).first();
    if (st === 'paid' && update.meta.changes === 1) ctx.waitUntil(sendOrderEmails(fresh, env));
    return fresh;
}

async function sendOrderEmails(order, env) {
    const receipt = receiptEmail(env, order);
    const admin = adminOrderEmail(env, order);
    const results = await Promise.allSettled([
        sendEmail(env, { to: order.email, ...receipt, replyTo: env.ADMIN_EMAIL }),
        sendEmail(env, { to: env.ADMIN_EMAIL, ...admin, replyTo: order.email })
    ]);
    const sent = results.every(r => r.status === 'fulfilled' && !r.value?.skipped && r.value?.ok !== false);
    await env.DB.prepare('UPDATE orders SET emailed = ? WHERE ref = ?').bind(sent ? 1 : 0, order.ref).run();
}

async function lipilaWebhook(request, env, ctx) {
    const raw = await request.text();
    if (!(await verifyWebhook(env, request, raw))) return json({ error: 'Invalid signature' }, 401);
    let payload;
    try { payload = JSON.parse(raw); } catch { return json({ error: 'Bad payload' }, 400); }
    const ref = payload.referenceId || payload.data?.referenceId;
    if (!/^K360-[A-Z0-9]{8}$/.test(ref || '')) return json({ ok: true });
    const order = await env.DB.prepare('SELECT * FROM orders WHERE ref = ?').bind(ref).first();
    if (order && order.status === 'pending') await refreshStatus(order, env, ctx); // never trust the body: re-check with Lipila
    return json({ ok: true });
}

// ------------------------------------------------------------------
// Contact / proposal form
// ------------------------------------------------------------------
async function contact(request, env) {
    const b = await readJson(request);
    if (b.website) return json({ ok: true }); // honeypot: pretend success
    const f = {
        name: clean(b.name, 120), email: clean(b.email, 160), phone: clean(b.phone, 30), division: clean(b.division, 60),
        budget: clean(b.budget, 60), subject: clean(b.subject, 120), message: cleanMultiline(b.message, 4000)
    };
    if (f.name.length < 2) throw userError('Please enter your name.');
    if (!isEmail(f.email)) throw userError('Please enter a valid email address.');
    if (f.message.length < 5) throw userError('Please tell us a little about your request.');
    const mail = inquiryEmail(env, f);
    const r = await sendEmail(env, { to: env.ADMIN_EMAIL, ...mail, replyTo: f.email });
    if (r.ok === false) throw userError('We could not send your message right now. Please email us directly.');
    return json({ ok: true });
}
