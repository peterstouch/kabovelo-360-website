// Lipila mobile money client (Zambia: MTN, Airtel, Zamtel)
//
// Flow: we POST a collection → the customer gets a PIN prompt on their phone →
// Lipila calls our webhook and we also poll check-status. We only trust the
// status we fetch from Lipila ourselves, never the webhook body alone.
//
// Modes (LIPILA_MODE in wrangler.toml):
//   mock    – no network calls; simulates the PIN prompt (default until you have keys)
//   sandbox – Lipila test environment, API key starts with lsk_
//   live    – real money, API key starts with lpk_

const BASE_URLS = {
    sandbox: 'https://api.lipila.dev/api/v1',
    live: 'https://blz.lipila.io/api/v1'
};

/** 0977123456 / +260977123456 / 977123456 → 260977123456, or null if not a Zambian mobile number */
export function normalizePhone(input) {
    let d = String(input || '').replace(/\D/g, '');
    if (d.startsWith('260')) d = d.slice(3);
    if (d.startsWith('0')) d = d.slice(1);
    if (!/^[79][5-7]\d{7}$/.test(d)) return null;
    return '260' + d;
}

/** 096/076 MTN, 097/077 Airtel, 095/075 Zamtel */
export function detectOperator(msisdn) {
    const p = msisdn.slice(3, 5);
    if (p === '96' || p === '76') return 'MTN';
    if (p === '97' || p === '77') return 'Airtel';
    if (p === '95' || p === '75') return 'Zamtel';
    return 'Unknown';
}

/** Lipila status text → 'pending' | 'paid' | 'failed' */
export function normalizeStatus(s) {
    const v = String(s || '').toLowerCase();
    if (/success|complete|paid|approved/.test(v)) return 'paid';
    if (/fail|reject|cancel|declin|expire|error|insufficient|timeout/.test(v)) return 'failed';
    return 'pending';
}

export function lipilaMode(env) {
    const m = String(env.LIPILA_MODE || '').toLowerCase();
    if (m === 'live' || m === 'sandbox') return env.LIPILA_API_KEY ? m : 'mock';
    return 'mock';
}

async function call(env, method, path, { body, headers = {} } = {}) {
    const res = await fetch(BASE_URLS[lipilaMode(env)] + path, {
        method,
        headers: {
            'x-api-key': env.LIPILA_API_KEY,
            accept: 'application/json',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...headers
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok) {
        const msg = data.message || data.title || data.error || `Lipila HTTP ${res.status}`;
        const err = new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
        err.status = res.status;
        throw err;
    }
    return data;
}

/** Starts a collection: the customer receives a PIN prompt. */
export async function createCollection(env, { referenceId, amount, phone, narration, email }) {
    if (lipilaMode(env) === 'mock') {
        return { referenceId, status: 'Pending', message: 'Test mode: approve on your phone', identifier: 'MOCK-' + referenceId.slice(-8) };
    }
    const body = { referenceId, amount, narration, accountNumber: phone, currency: 'ZMW' };
    if (email) body.email = email;
    return call(env, 'POST', '/collections/mobile-money', {
        body,
        headers: { callbackUrl: `${String(env.API_PUBLIC_URL).replace(/\/$/, '')}/api/webhooks/lipila` }
    });
}

/**
 * Current status of a collection.
 * Mock mode mirrors Lipila's sandbox test numbers:
 *   0977000002 → fails, 0977000003 → stays pending, anything else succeeds after ~8 seconds.
 */
export async function checkCollection(env, order) {
    if (lipilaMode(env) === 'mock') {
        const age = Date.now() - Date.parse(order.created_at);
        if (order.phone.endsWith('977000003') || age < 8000) return { status: 'Pending', message: 'Waiting for PIN approval' };
        if (order.phone.endsWith('977000002')) return { status: 'Failed', message: 'Insufficient funds (test mode)' };
        return { status: 'Successful', message: 'Payment received (test mode)', identifier: 'MOCK-' + order.ref.slice(-8) };
    }
    return call(env, 'GET', `/collections/check-status?referenceId=${encodeURIComponent(order.ref)}`);
}

/**
 * Webhook signature (Standard Webhooks style): header "v1,<base64 HMAC-SHA256>"
 * over "{webhook-id}.{webhook-timestamp}.{raw body}".
 * If no secret is configured we accept the call, because we re-check the status with Lipila anyway.
 */
export async function verifyWebhook(env, request, rawBody) {
    const secret = env.LIPILA_WEBHOOK_SECRET;
    if (!secret) return true;
    const id = request.headers.get('webhook-id');
    const ts = request.headers.get('webhook-timestamp');
    const sigHeader = request.headers.get('webhook-signature') || '';
    if (!id || !ts || !sigHeader) return false;
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

    const keyBytes = secret.startsWith('whsec_')
        ? Uint8Array.from(atob(secret.slice(6)), c => c.charCodeAt(0))
        : new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${rawBody}`)));
    const expected = btoa(String.fromCharCode(...mac));
    return sigHeader.split(' ').some(part => {
        const sig = part.split(',')[1];
        if (!sig || sig.length !== expected.length) return false;
        let diff = 0;
        for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
        return diff === 0;
    });
}
