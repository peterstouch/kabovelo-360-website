// KABOVELO 360 — ONLINE BOOKING, ENROLLMENT & MOBILE MONEY PAYMENT
// Used by checkout.html and enroll.html. Talks to the payment API (api/ folder).

const NETWORKS = {
    MTN: { name: 'MTN MoMo', color: '#FFCB05', text: '#1a1a1a', prompt: 'Enter your MoMo PIN on the prompt to approve.' },
    Airtel: { name: 'Airtel Money', color: '#E40000', text: '#ffffff', prompt: 'Enter your Airtel Money PIN on the prompt to approve.' },
    Zamtel: { name: 'Zamtel Kwacha', color: '#00A651', text: '#ffffff', prompt: 'Enter your Zamtel Kwacha PIN on the prompt to approve.' }
};
const POLL_INTERVAL = 4000;
const POLL_TIMEOUT = 3 * 60 * 1000;
const SYNERGY = { 2: 10, 3: 15, 4: 20, 5: 25 };

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function normalizeZmPhone(input) {
    let d = String(input || '').replace(/\D/g, '');
    if (d.startsWith('260')) d = d.slice(3);
    if (d.startsWith('0')) d = d.slice(1);
    return /^[79][5-7]\d{7}$/.test(d) ? '260' + d : null;
}
function networkOf(msisdn) {
    if (!msisdn) return null;
    const p = msisdn.slice(3, 5);
    if (p === '96' || p === '76') return 'MTN';
    if (p === '97' || p === '77') return 'Airtel';
    if (p === '95' || p === '75') return 'Zamtel';
    return null;
}
function findService(id) { return getAllServices().find(s => s.id === id); }
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

async function apiRequest(path, options = {}) {
    let res;
    try {
        res = await fetch(SITE.apiBase + path, { headers: { 'Content-Type': 'application/json' }, ...options });
    } catch (e) {
        throw new Error('We could not connect to the payment service. Check your internet connection and try again.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
}

// Live network badge under a phone input
function bindNetworkBadge(input, badge) {
    const update = () => {
        const net = networkOf(normalizeZmPhone(input.value));
        if (net) {
            const n = NETWORKS[net];
            badge.innerHTML = `<span class="inline-block w-2 h-2 rounded-full mr-1.5" style="background:${n.color}"></span>${n.name}`;
            badge.className = 'net-badge is-on';
        } else {
            badge.innerHTML = input.value.trim().length > 3 ? '<i class="fa-solid fa-circle-exclamation mr-1"></i>Enter an MTN, Airtel or Zamtel number' : 'MTN · Airtel · Zamtel';
            badge.className = 'net-badge' + (input.value.trim().length > 3 ? ' is-warn' : '');
        }
    };
    input.addEventListener('input', update);
    update();
}

function setFieldError(form, message) {
    const box = form.querySelector('[data-form-error]');
    if (!box) return showToast(message);
    box.innerHTML = message ? `<i class="fa-solid fa-circle-exclamation mr-2"></i>${esc(message)}` : '';
    box.classList.toggle('hidden', !message);
    if (message) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ------------------------------------------------------------------
// PAYMENT MODAL (waiting → paid / failed)
// ------------------------------------------------------------------
function injectPaymentModal() {
    if (document.getElementById('paymentModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div id="paymentModal" role="dialog" aria-modal="true" aria-live="polite" aria-label="Mobile money payment"
         class="fixed inset-0 z-[90] hidden items-center justify-center p-3 sm:p-6 bg-obsidian/90 backdrop-blur-xl opacity-0 transition-opacity duration-300">
        <div class="modal-panel glass-panel w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-3xl border border-armyGreenBright/40 shadow-2xl relative" id="paymentBody"></div>
    </div>`);
}

let pay = { order: null, payload: null, timer: null, started: 0, tick: null };

function openPaymentModal() {
    const m = document.getElementById('paymentModal');
    m.classList.remove('hidden'); m.classList.add('flex');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => m.classList.remove('opacity-0'));
}
function closePaymentModal() {
    stopPolling();
    const m = document.getElementById('paymentModal');
    m.classList.add('opacity-0');
    setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); document.body.classList.remove('modal-open'); }, 250);
}
function stopPolling() { clearTimeout(pay.timer); clearInterval(pay.tick); }

function renderPayment(state, extra = {}) {
    const body = document.getElementById('paymentBody');
    const o = pay.order;
    const net = o ? NETWORKS[o.operator] : null;
    const testBanner = extra.mode === 'mock' || pay.mode === 'mock'
        ? `<div class="mx-6 sm:mx-8 mt-6 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-200 text-[11px]"><i class="fa-solid fa-flask mr-1"></i> Test mode — no real money is charged. The payment confirms automatically.</div>` : '';

    if (state === 'sending') {
        body.innerHTML = `
        <div class="p-8 sm:p-10 text-center">
            <div class="pay-spinner mx-auto mb-6"></div>
            <h3 class="font-serif text-xl font-semibold text-white">Sending payment request…</h3>
            <p class="text-sm text-greyMuted mt-2">Connecting securely to the mobile money network.</p>
        </div>`;
    }

    if (state === 'waiting') {
        body.innerHTML = `
        ${testBanner}
        <div class="p-6 sm:p-8 text-center">
            <div class="phone-pulse mx-auto mb-6" style="--net:${net ? net.color : '#8BAE77'}">
                <i class="fa-solid fa-mobile-screen-button"></i>
            </div>
            <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-armyGreenLight">Step 2 of 3</span>
            <h3 class="font-serif text-2xl font-semibold text-white mt-2">Approve on your phone</h3>
            <p class="text-sm text-greyLight mt-3 leading-relaxed">
                A payment request for <strong class="text-white">${formatKwacha(o.total)}</strong> has been sent to
                <strong class="text-white whitespace-nowrap">${esc(o.phoneMasked)}</strong>${net ? ` <span class="whitespace-nowrap">(${net.name})</span>` : ''}.
            </p>
            <p class="text-sm text-greyMuted mt-1">${net ? net.prompt : 'Enter your PIN on the prompt to approve.'}</p>

            <div class="mt-6 rounded-2xl bg-white/[0.03] border border-white/10 p-4 text-left text-xs text-greyMuted space-y-2">
                <p><i class="fa-solid fa-circle-info text-armyGreenLight mr-2"></i>Keep this page open — it updates automatically.</p>
                <p><i class="fa-solid fa-bell text-armyGreenLight mr-2"></i>No prompt? Make sure your phone is on and has network, then tap “Check again”.</p>
            </div>

            <div class="mt-6 flex items-center justify-center gap-3 text-xs text-greyMuted">
                <span class="pay-dots"><span></span><span></span><span></span></span>
                Waiting for approval · <span id="payCountdown" class="font-mono text-greyLight">3:00</span>
            </div>
            <div class="mt-2 h-1 rounded-full bg-white/5 overflow-hidden"><div id="payProgress" class="h-full bg-gradient-to-r from-armyGreen to-armyGreenLight" style="width:100%;transition:width 1s linear"></div></div>

            <div class="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" data-pay-check class="btn-primary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider">I've approved it</button>
                <button type="button" data-pay-cancel class="py-3.5 rounded-xl glass-card text-xs font-semibold uppercase tracking-wider text-greyLight hover:text-white">Cancel</button>
            </div>
            <p class="text-[11px] text-greyMuted mt-4">Reference <span class="font-mono text-greyLight">${esc(o.ref)}</span></p>
        </div>`;
        body.querySelector('[data-pay-check]').addEventListener('click', (e) => { e.currentTarget.innerHTML = '<span class="pay-spinner sm"></span> Checking…'; poll(true); });
        body.querySelector('[data-pay-cancel]').addEventListener('click', closePaymentModal);
    }

    if (state === 'paid') {
        const isEnroll = o.type === 'enrollment';
        body.innerHTML = `
        ${testBanner}
        <div class="p-6 sm:p-8" id="receiptPrint">
            <div class="text-center">
                <div class="success-check mx-auto mb-5"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-15"/></svg></div>
                <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-armyGreenLight">Payment confirmed</span>
                <h3 class="font-serif text-2xl font-semibold text-white mt-2">${isEnroll ? 'You’re enrolled!' : 'Booking confirmed'}</h3>
                <p class="text-sm text-greyMuted mt-2">Thank you, ${esc(o.name.split(' ')[0])}. A receipt has been sent to <span class="text-greyLight">${esc(o.email)}</span>.</p>
            </div>

            <div class="mt-6 rounded-2xl border border-white/10 divide-y divide-white/10 text-sm">
                <div class="flex justify-between gap-4 px-4 py-3"><span class="text-greyMuted">Reference</span><span class="font-mono text-white">${esc(o.ref)}</span></div>
                ${o.items.map(i => `<div class="flex justify-between gap-4 px-4 py-3"><span class="text-greyLight">${esc(i.title)}<span class="block text-[11px] text-greyMuted">${esc(i.tierName)}${i.qty > 1 ? ` · ${i.qty} ${esc(i.unit)}s` : ''}</span></span><span class="text-white whitespace-nowrap">${formatKwacha(i.lineTotal)}</span></div>`).join('')}
                ${o.discountPct ? `<div class="flex justify-between gap-4 px-4 py-3 text-armyGreenLight"><span>Synergy discount (${o.discountPct}%)</span><span>−${formatKwacha(o.subtotal - o.total)}</span></div>` : ''}
                <div class="flex justify-between gap-4 px-4 py-3"><span class="text-white font-semibold">Total paid</span><span class="font-serif text-lg text-armyGreenLight font-semibold">${formatKwacha(o.total)}</span></div>
                <div class="flex justify-between gap-4 px-4 py-3"><span class="text-greyMuted">Paid with</span><span class="text-greyLight">${net ? net.name : 'Mobile Money'} · ${esc(o.phoneMasked)}</span></div>
            </div>

            <div class="mt-5 rounded-2xl bg-armyGreen/15 border border-armyGreenBright/30 p-4">
                <p class="text-sm text-white font-semibold"><i class="fa-solid fa-receipt text-armyGreenLight mr-2"></i>Send your Proof of Payment (POP)</p>
                <p class="text-xs text-greyLight mt-1.5 leading-relaxed">Email a screenshot of your mobile money confirmation SMS with the subject <strong class="text-white">“POP – ${esc(o.ref)}”</strong>.</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 no-print">
                    <a href="mailto:${SITE.email}?subject=${encodeURIComponent('POP – ' + o.ref)}&body=${encodeURIComponent(`Hello KABOVELO 360,\n\nPlease find attached my proof of payment for ${o.ref} (${formatKwacha(o.total)}).\n\n${o.name}`)}" class="btn-primary py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider text-center"><i class="fa-solid fa-envelope mr-1"></i> Email POP</a>
                    <a href="${SITE.whatsapp}?text=${encodeURIComponent(`Hello, here is my proof of payment for ${o.ref} (${formatKwacha(o.total)}).`)}" target="_blank" rel="noopener" class="py-3 rounded-xl glass-card text-[11px] font-bold uppercase tracking-wider text-center text-white"><i class="fa-brands fa-whatsapp mr-1"></i> WhatsApp POP</a>
                </div>
                <p class="text-[11px] text-greyMuted mt-2">${esc(SITE.email)} · ${esc(SITE.phoneDisplay)}</p>
            </div>

            <div class="mt-6 flex flex-col sm:flex-row gap-3 no-print">
                <button type="button" onclick="window.print()" class="flex-1 py-3 rounded-xl glass-card text-xs font-semibold uppercase tracking-wider text-greyLight hover:text-white"><i class="fa-solid fa-print mr-1"></i> Print receipt</button>
                <a href="./index.html" class="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold uppercase tracking-wider text-white text-center">Back to home</a>
            </div>
        </div>`;
    }

    if (state === 'failed' || state === 'error') {
        const msg = state === 'error' ? extra.message : (o && o.message) || 'The payment was not completed.';
        body.innerHTML = `
        ${testBanner}
        <div class="p-8 sm:p-10 text-center">
            <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-rose-500/10 border border-rose-400/40 flex items-center justify-center text-rose-300 text-2xl"><i class="fa-solid fa-xmark"></i></div>
            <h3 class="font-serif text-2xl font-semibold text-white">Payment not completed</h3>
            <p class="text-sm text-greyLight mt-3 leading-relaxed">${esc(msg)}</p>
            <p class="text-xs text-greyMuted mt-2">No money has been taken. You can try again or use a different number.</p>
            <div class="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" data-pay-retry class="btn-primary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider">Try again</button>
                <button type="button" data-pay-cancel class="py-3.5 rounded-xl glass-card text-xs font-semibold uppercase tracking-wider text-greyLight hover:text-white">Change details</button>
            </div>
            ${o ? `<p class="text-[11px] text-greyMuted mt-5">Need help? Quote reference <span class="font-mono">${esc(o.ref)}</span> when you <a class="text-armyGreenLight underline" href="${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp us</a>.</p>` : ''}
        </div>`;
        body.querySelector('[data-pay-retry]').addEventListener('click', () => startPayment(pay.payload));
        body.querySelector('[data-pay-cancel]').addEventListener('click', closePaymentModal);
    }

    if (state === 'timeout') {
        body.innerHTML = `
        <div class="p-8 sm:p-10 text-center">
            <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-200 text-2xl"><i class="fa-solid fa-hourglass-half"></i></div>
            <h3 class="font-serif text-2xl font-semibold text-white">Still waiting for approval</h3>
            <p class="text-sm text-greyLight mt-3 leading-relaxed">We haven’t received a confirmation yet. If you approved the payment, it may take a moment to arrive.</p>
            <div class="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" data-pay-check class="btn-primary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider">Check again</button>
                <button type="button" data-pay-retry class="py-3.5 rounded-xl glass-card text-xs font-semibold uppercase tracking-wider text-greyLight hover:text-white">Send a new request</button>
            </div>
            <p class="text-[11px] text-greyMuted mt-5">Reference <span class="font-mono text-greyLight">${esc(o.ref)}</span> · <a class="text-armyGreenLight underline" href="${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp us</a> if money left your account.</p>
        </div>`;
        body.querySelector('[data-pay-check]').addEventListener('click', () => { pay.started = Date.now(); renderPayment('waiting'); startCountdown(); poll(true); });
        body.querySelector('[data-pay-retry]').addEventListener('click', () => startPayment(pay.payload));
    }
}

function startCountdown() {
    clearInterval(pay.tick);
    const update = () => {
        const left = Math.max(0, POLL_TIMEOUT - (Date.now() - pay.started));
        const cd = document.getElementById('payCountdown');
        const bar = document.getElementById('payProgress');
        if (cd) cd.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
        if (bar) bar.style.width = `${(left / POLL_TIMEOUT) * 100}%`;
    };
    update();
    pay.tick = setInterval(update, 1000);
}

async function poll(immediate = false) {
    clearTimeout(pay.timer);
    const run = async () => {
        try {
            const { order, mode } = await apiRequest(`/api/orders/${pay.order.ref}`);
            pay.order = order; pay.mode = mode;
            if (order.status === 'paid') { stopPolling(); renderPayment('paid'); onPaid(order); return; }
            if (order.status === 'failed') { stopPolling(); renderPayment('failed'); return; }
        } catch (e) { /* temporary network issue — keep polling */ }
        if (Date.now() - pay.started > POLL_TIMEOUT) { stopPolling(); renderPayment('timeout'); return; }
        const btn = document.querySelector('[data-pay-check]');
        if (btn && btn.textContent.includes('Checking')) btn.textContent = "I've approved it";
        pay.timer = setTimeout(run, POLL_INTERVAL);
    };
    if (immediate) run(); else pay.timer = setTimeout(run, POLL_INTERVAL);
}

function renderComingSoon(payload) {
    const lines = payload.items.map(i => { const s = findService(i.serviceId); return `${s.title} – ${s.packages[i.tier].name} (${formatPrice(s.packages[i.tier], { short: true })})`; });
    const msg = `Hello KABOVELO 360, I'd like to ${payload.type === 'enrollment' ? 'enroll in' : 'book'}:\n${lines.join('\n')}\n\nName: ${payload.customer.name}\nPhone: ${payload.customer.phone}\nEmail: ${payload.customer.email}${payload.details.intake ? `\nIntake: ${payload.details.intake}` : ''}`;
    document.getElementById('paymentBody').innerHTML = `
        <div class="p-8 sm:p-10 text-center">
            <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-armyGreen/30 border border-armyGreenBright/40 flex items-center justify-center text-armyGreenLight text-2xl"><i class="fa-solid fa-mobile-screen-button"></i></div>
            <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-armyGreenLight">Launching soon</span>
            <h3 class="font-serif text-2xl font-semibold text-white mt-2">Online payments are almost ready</h3>
            <p class="text-sm text-greyLight mt-3 leading-relaxed">Reserve your place now — send us your details and our team will confirm and share mobile money payment instructions.</p>
            <div class="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="${SITE.whatsapp}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" class="btn-primary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider"><i class="fa-brands fa-whatsapp mr-1"></i> Reserve on WhatsApp</a>
                <a href="mailto:${SITE.email}?subject=${encodeURIComponent(payload.type === 'enrollment' ? 'Film Academy enrollment' : 'Service booking')}&body=${encodeURIComponent(msg)}" class="py-3.5 rounded-xl glass-card text-xs font-bold uppercase tracking-wider text-white"><i class="fa-solid fa-envelope mr-1"></i> Reserve by email</a>
            </div>
            <button type="button" data-pay-cancel class="mt-4 text-xs text-greyMuted hover:text-white">Close</button>
        </div>`;
    document.querySelector('#paymentBody [data-pay-cancel]').addEventListener('click', closePaymentModal);
}

async function startPayment(payload) {
    pay.payload = payload;
    stopPolling();
    injectPaymentModal();
    openPaymentModal();
    if (!PAYMENTS_LIVE) { renderComingSoon(payload); return; }
    renderPayment('sending');
    const minDelay = new Promise(r => setTimeout(r, 900)); // let the "sending" state register
    try {
        const [{ order, mode }] = await Promise.all([apiRequest('/api/orders', { method: 'POST', body: JSON.stringify(payload) }), minDelay]);
        pay.order = order; pay.mode = mode; pay.started = Date.now();
        renderPayment('waiting', { mode });
        startCountdown();
        poll();
    } catch (e) {
        await minDelay;
        pay.order = null;
        renderPayment('error', { message: e.message });
    }
}

function onPaid(order) {
    if (order.type === 'booking') {
        try { localStorage.removeItem('k360-synergy-selection'); } catch (e) { /* ignore */ }
    }
}

// ------------------------------------------------------------------
// CHECKOUT PAGE (services & packages)
// ------------------------------------------------------------------
let cart = [];

function payableTiers(service) {
    return ['starter', 'pro', 'enterprise'].filter(k => isPayableOnline(service.packages[k]));
}

function loadCart() {
    const params = new URLSearchParams(location.search);
    let items = [];
    if (params.get('items')) {
        items = params.get('items').split(',').map(s => {
            const [serviceId, tier, qty] = s.split(':');
            return { serviceId, tier, qty: parseInt(qty, 10) || 1 };
        });
    } else if (params.get('from') === 'package') {
        let ids = [];
        try { ids = JSON.parse(localStorage.getItem('k360-synergy-selection') || '[]'); } catch (e) { /* ignore */ }
        items = ids.map(id => ({ serviceId: id, tier: null, qty: 1 }));
    }
    const seen = new Set();
    cart = items.map(it => {
        const s = findService(it.serviceId);
        if (!s || seen.has(s.id)) return null;
        seen.add(s.id);
        const tiers = payableTiers(s);
        const tier = tiers.includes(it.tier) ? it.tier : tiers[0];
        return { serviceId: s.id, tier: tier || null, qty: Math.max(1, Math.min(30, it.qty)) };
    }).filter(Boolean);
}

function saveCartToUrl() {
    const q = cart.filter(c => c.tier).map(c => `${c.serviceId}:${c.tier}${c.qty > 1 ? ':' + c.qty : ''}`).join(',');
    history.replaceState(null, '', q ? `?items=${q}` : location.pathname);
}

function cartTotals() {
    const lines = cart.filter(c => c.tier).map(c => {
        const s = findService(c.serviceId);
        const pkg = s.packages[c.tier];
        const qty = pkg.unit ? c.qty : 1;
        return { s, pkg, qty, total: pkg.price * qty };
    });
    const subtotal = lines.reduce((a, l) => a + l.total, 0);
    const divisions = new Set(lines.map(l => l.s.division)).size;
    const pct = SYNERGY[divisions] || 0;
    const total = Math.round(subtotal * (100 - pct) / 100);
    return { lines, subtotal, pct, total, divisions };
}

function renderCart() {
    const list = document.getElementById('cartList');
    const unpayable = cart.filter(c => !c.tier);
    if (!cart.length) {
        list.innerHTML = `
            <div class="text-center py-12 px-6 rounded-2xl border border-dashed border-white/15">
                <i class="fa-solid fa-bag-shopping text-3xl text-armyGreenLight mb-4"></i>
                <h3 class="font-serif text-xl text-white">Your booking is empty</h3>
                <p class="text-sm text-greyMuted mt-2 mb-6">Choose a service package to book and pay online.</p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="./services.html" class="btn-primary px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider">Browse services</a>
                    <a href="./enroll.html" class="px-6 py-3 rounded-full glass-card text-xs font-bold uppercase tracking-wider text-white">Film Academy enrollment</a>
                </div>
            </div>`;
    } else {
        list.innerHTML = cart.map((c, i) => {
            const s = findService(c.serviceId);
            const tiers = payableTiers(s);
            const pkg = c.tier ? s.packages[c.tier] : null;
            return `
            <div class="cart-item rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 flex gap-4">
                <img src="${s.image}" alt="" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <span class="text-[10px] uppercase tracking-[0.18em] text-armyGreenLight font-semibold">${esc(s.division)}</span>
                            <h3 class="text-sm sm:text-base font-semibold text-white leading-snug mt-0.5">${esc(s.title)}</h3>
                        </div>
                        <button type="button" data-remove="${i}" aria-label="Remove ${esc(s.title)}" class="w-9 h-9 -mr-1 -mt-1 rounded-lg text-greyMuted hover:text-rose-300 hover:bg-white/5 flex-shrink-0"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    ${tiers.length ? `
                    <div class="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                        <label class="sr-only" for="tier-${i}">Package</label>
                        <select id="tier-${i}" data-tier="${i}" class="field !py-2.5 sm:max-w-[16rem]">
                            ${tiers.map(k => `<option value="${k}" ${k === c.tier ? 'selected' : ''}>${esc(s.packages[k].name)} — ${formatPrice(s.packages[k], { short: true })}</option>`).join('')}
                        </select>
                        ${pkg && pkg.unit ? `
                        <div class="qty-stepper" role="group" aria-label="Number of ${pkg.unit}s">
                            <button type="button" data-qty="${i}" data-step="-1" aria-label="Fewer">−</button>
                            <span>${c.qty} ${pkg.unit}${c.qty > 1 ? 's' : ''}</span>
                            <button type="button" data-qty="${i}" data-step="1" aria-label="More">+</button>
                        </div>` : ''}
                        <span class="sm:ml-auto font-serif text-base text-white whitespace-nowrap">${formatKwacha(pkg.price * (pkg.unit ? c.qty : 1))}</span>
                    </div>
                    <p class="text-[11px] text-greyMuted mt-2 leading-relaxed">${pkg.items.map(esc).join(' · ')}</p>` : `
                    <p class="text-xs text-amber-200/90 mt-3"><i class="fa-solid fa-circle-info mr-1"></i>This service is above the mobile money limit. <a class="underline" href="./contact.html?division=${encodeURIComponent(s.division)}&service=${encodeURIComponent(s.title)}">Request a quote</a> instead.</p>`}
                </div>
            </div>`;
        }).join('');
    }

    list.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => { cart.splice(+b.dataset.remove, 1); saveCartToUrl(); renderCart(); }));
    list.querySelectorAll('[data-tier]').forEach(sel => sel.addEventListener('change', () => { cart[+sel.dataset.tier].tier = sel.value; saveCartToUrl(); renderCart(); }));
    list.querySelectorAll('[data-qty]').forEach(b => b.addEventListener('click', () => {
        const c = cart[+b.dataset.qty];
        c.qty = Math.max(1, Math.min(30, c.qty + +b.dataset.step));
        saveCartToUrl(); renderCart();
    }));

    // Summary
    const t = cartTotals();
    document.getElementById('sumSubtotal').textContent = formatKwacha(t.subtotal);
    document.getElementById('sumDiscountRow').classList.toggle('hidden', !t.pct);
    document.getElementById('sumDiscountLabel').textContent = `Synergy discount (${t.pct}%)`;
    document.getElementById('sumDiscount').textContent = '−' + formatKwacha(t.subtotal - t.total);
    document.getElementById('sumTotal').textContent = formatKwacha(t.total);
    document.getElementById('sumCount').textContent = `${t.lines.length} item${t.lines.length === 1 ? '' : 's'}`;
    const over = t.total > SITE.onlineLimit;
    const warn = document.getElementById('sumWarning');
    warn.classList.toggle('hidden', !over && !unpayable.length);
    warn.innerHTML = over
        ? `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Mobile money payments are limited to ${formatKwacha(SITE.onlineLimit)}. Remove an item or <a class="underline" href="./contact.html">request a quote</a>.`
        : unpayable.length ? '<i class="fa-solid fa-circle-info mr-1"></i> Items above the mobile money limit are not included in the total.' : '';
    const btn = document.getElementById('payButton');
    btn.disabled = !t.lines.length || over;
    btn.querySelector('[data-amount]').textContent = formatKwacha(t.total);
}

function initCheckoutPage() {
    loadCart();
    saveCartToUrl();
    renderCart();
    const form = document.getElementById('checkoutForm');
    bindNetworkBadge(form.phone, document.getElementById('netBadge'));
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    form.preferredDate.min = tomorrow;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        setFieldError(form, '');
        const lines = cartTotals().lines;
        if (!lines.length) return setFieldError(form, 'Add at least one service to your booking.');
        if (!normalizeZmPhone(form.phone.value)) return setFieldError(form, 'Enter a valid MTN, Airtel or Zamtel number, e.g. 0977 123 456.');
        if (!form.terms.checked) return setFieldError(form, 'Please accept the terms to continue.');
        startPayment({
            type: 'booking',
            website: form.website.value,
            customer: { name: form.fullName.value, email: form.email.value, phone: form.phone.value },
            items: cart.filter(c => c.tier).map(c => ({ serviceId: c.serviceId, tier: c.tier, qty: c.qty })),
            details: { preferredDate: form.preferredDate.value, notes: form.notes.value }
        });
    });
}

// ------------------------------------------------------------------
// ENROLLMENT PAGE (Film Academy)
// ------------------------------------------------------------------
const enrollState = { course: null, tier: null, intake: null };

function academyCourses() { return ECOSYSTEM_DIVISIONS['film-academy'].services; }

function renderCourses() {
    const wrap = document.getElementById('courseList');
    wrap.innerHTML = academyCourses().map(c => {
        const from = payableTiers(c).length ? formatPrice(c.packages[payableTiers(c)[0]], { short: true }) : 'Scholarship';
        return `
        <label class="choice-card group" data-course="${c.id}">
            <input type="radio" name="course" value="${c.id}" class="sr-only" ${enrollState.course === c.id ? 'checked' : ''}>
            <img src="${c.image}" alt="" class="w-full h-28 sm:h-32 object-cover rounded-xl mb-3 group-hover:scale-[1.02] transition-transform duration-500">
            <span class="block text-sm font-semibold text-white leading-snug">${esc(c.title)}</span>
            <span class="block text-[11px] text-greyMuted mt-1">${esc(c.turnaround)}</span>
            <span class="block text-xs text-armyGreenLight font-semibold mt-2">From ${from.replace('from ', '')}</span>
            <span class="choice-tick"><i class="fa-solid fa-check"></i></span>
        </label>`;
    }).join('');
    wrap.querySelectorAll('input[name=course]').forEach(r => r.addEventListener('change', () => {
        enrollState.course = r.value;
        const tiers = payableTiers(findService(r.value));
        enrollState.tier = tiers.includes(enrollState.tier) ? enrollState.tier : (tiers[0] || null);
        renderLevels(); renderEnrollSummary();
        document.getElementById('levelSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
}

function renderLevels() {
    const wrap = document.getElementById('levelList');
    const c = enrollState.course ? findService(enrollState.course) : null;
    if (!c) { wrap.innerHTML = '<p class="text-sm text-greyMuted">Choose a course above to see the program levels.</p>'; return; }
    wrap.innerHTML = ['starter', 'pro', 'enterprise'].map(k => {
        const p = c.packages[k];
        const ok = isPayableOnline(p);
        return `
        <label class="choice-card ${ok ? '' : 'is-disabled'}" data-level="${k}">
            <input type="radio" name="level" value="${k}" class="sr-only" ${enrollState.tier === k ? 'checked' : ''} ${ok ? '' : 'disabled'}>
            <span class="flex items-start justify-between gap-3">
                <span class="text-sm font-semibold text-white">${esc(p.name)}</span>
                ${k === 'pro' ? '<span class="text-[9px] font-bold uppercase tracking-wider bg-armyGreenBright text-white px-2 py-0.5 rounded-full">Popular</span>' : ''}
            </span>
            <span class="block font-serif text-lg text-armyGreenLight mt-1">${formatPrice(p)}</span>
            <ul class="mt-3 space-y-1.5 text-[11px] text-greyLight">${p.items.map(it => `<li class="flex gap-2"><i class="fa-solid fa-check text-armyGreenLight mt-0.5"></i>${esc(it)}</li>`).join('')}</ul>
            ${ok ? '' : `<a href="./contact.html?division=Film%20Academy&service=${encodeURIComponent(c.title)}&package=${encodeURIComponent(p.name)}" class="inline-block mt-3 text-[11px] text-amber-200 underline">Request a quote</a>`}
            <span class="choice-tick"><i class="fa-solid fa-check"></i></span>
        </label>`;
    }).join('');
    wrap.querySelectorAll('input[name=level]').forEach(r => r.addEventListener('change', () => { enrollState.tier = r.value; renderEnrollSummary(); }));
}

function renderIntakes() {
    const wrap = document.getElementById('intakeList');
    wrap.innerHTML = ACADEMY_INTAKES.map((it, i) => `
        <label class="choice-pill">
            <input type="radio" name="intake" value="${it.id}" class="sr-only" ${(enrollState.intake || ACADEMY_INTAKES[0].id) === it.id ? 'checked' : ''}>
            <span class="block text-sm font-semibold text-white">${esc(it.label)}</span>
            <span class="block text-[11px] text-greyMuted mt-0.5">Classes start ${esc(it.starts)}</span>
        </label>`).join('');
    enrollState.intake = enrollState.intake || ACADEMY_INTAKES[0].id;
    wrap.querySelectorAll('input[name=intake]').forEach(r => r.addEventListener('change', () => { enrollState.intake = r.value; renderEnrollSummary(); }));
}

function renderEnrollSummary() {
    const c = enrollState.course ? findService(enrollState.course) : null;
    const p = c && enrollState.tier ? c.packages[enrollState.tier] : null;
    const intake = ACADEMY_INTAKES.find(i => i.id === enrollState.intake);
    document.getElementById('sumCourseImg').src = c ? c.image : './assets/images/team/academy-classroom.jpg';
    document.getElementById('sumCourse').textContent = c ? c.title : 'Choose a course';
    document.getElementById('sumLevel').textContent = p ? p.name : '—';
    document.getElementById('sumIntake').textContent = intake ? `${intake.label} · starts ${intake.starts}` : '—';
    document.getElementById('sumTotal').textContent = p ? formatKwacha(p.price) : 'K0';
    const btn = document.getElementById('payButton');
    btn.disabled = !p;
    btn.querySelector('[data-amount]').textContent = p ? formatKwacha(p.price) : 'K0';
}

function ageFrom(dob) {
    if (!dob) return null;
    const d = new Date(dob), n = new Date();
    let a = n.getFullYear() - d.getFullYear();
    if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
    return a;
}

function initEnrollPage() {
    const params = new URLSearchParams(location.search);
    const courseId = params.get('course');
    if (courseId && findService(courseId) && findService(courseId).division === 'Film Academy') {
        enrollState.course = courseId;
        const tiers = payableTiers(findService(courseId));
        enrollState.tier = tiers.includes(params.get('tier')) ? params.get('tier') : tiers[0] || null;
    }
    renderCourses(); renderLevels(); renderIntakes(); renderEnrollSummary();

    const form = document.getElementById('enrollForm');
    bindNetworkBadge(form.phone, document.getElementById('netBadge'));
    form.dob.max = new Date(Date.now() - 10 * 365 * 86400000).toISOString().slice(0, 10);
    const guardian = document.getElementById('guardianFields');
    form.dob.addEventListener('change', () => {
        const a = ageFrom(form.dob.value);
        const minor = a !== null && a < 18;
        guardian.classList.toggle('hidden', !minor);
        form.guardianName.required = minor;
        form.guardianPhone.required = minor;
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        setFieldError(form, '');
        if (!enrollState.course) return setFieldError(form, 'Choose a course to enroll in.');
        if (!enrollState.tier) return setFieldError(form, 'Choose a program level.');
        if (!normalizeZmPhone(form.phone.value)) return setFieldError(form, 'Enter a valid MTN, Airtel or Zamtel number, e.g. 0977 123 456.');
        if (!form.terms.checked) return setFieldError(form, 'Please accept the enrollment terms to continue.');
        const intake = ACADEMY_INTAKES.find(i => i.id === enrollState.intake);
        startPayment({
            type: 'enrollment',
            website: form.website.value,
            customer: { name: form.fullName.value, email: form.email.value, phone: form.phone.value },
            items: [{ serviceId: enrollState.course, tier: enrollState.tier, qty: 1 }],
            details: {
                intake: intake ? `${intake.label} (starts ${intake.starts})` : enrollState.intake,
                studentName: form.fullName.value, dob: form.dob.value, idNumber: form.idNumber.value,
                experience: form.experience.value, heardFrom: form.heardFrom.value,
                guardianName: form.guardianName.value, guardianPhone: form.guardianPhone.value, notes: form.notes.value
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (page === 'checkout') initCheckoutPage();
    if (page === 'enroll') initEnrollPage();
});
