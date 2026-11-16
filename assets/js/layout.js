// KABOVELO 360 — SHARED LAYOUT
// Header, footer, page loader, page transitions, toast, modals and image fallbacks.
// Loaded in <head> (not deferred) so the image-error guard is active before any image loads.

document.documentElement.classList.add('js');

const NAV_LINKS = [
    { page: 'home', href: '/', label: 'Home' },
    { page: 'about', href: '/about/', label: 'About' },
    { page: 'divisions', href: '/divisions/', label: 'Divisions' },
    { page: 'services', href: '/services/', label: 'Services' },
    { page: 'work', href: '/work/', label: 'Our Work' },
    { page: 'synergy', href: '/synergy/', label: 'Synergy Builder' },
    { page: 'impact', href: '/impact/', label: 'Impact' },
    { page: 'contact', href: '/contact/', label: 'Contact' }
];

// Update these with the real social profile URLs
const SOCIAL_LINKS = [
    { icon: 'fa-whatsapp', label: 'WhatsApp', href: 'https://wa.me/260979813471' },
    { icon: 'fa-instagram', label: 'Instagram', href: 'https://www.instagram.com/' },
    { icon: 'fa-youtube', label: 'YouTube', href: 'https://www.youtube.com/' },
    { icon: 'fa-linkedin-in', label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    { icon: 'fa-x-twitter', label: 'X (Twitter)', href: 'https://x.com/' }
];

const DIVISION_LINKS = [
    { key: 'film-farm', label: 'Film Farm' },
    { key: 'film-academy', label: 'Film Academy' },
    { key: 'fashion-avenue', label: 'Fashion Avenue' },
    { key: 'hope-foundation', label: 'Hope Foundation' },
    { key: 'marketing-lab', label: 'Marketing Lab' }
];

const FALLBACK_IMAGE = '/assets/images/film-farm.jpg';

// ---------------------------------------------------------------
// IMAGE ERROR GUARD — any broken image is swapped for a local one
// ---------------------------------------------------------------
window.addEventListener('error', (e) => {
    const img = e.target;
    if (img && img.tagName === 'IMG' && !img.dataset.fallbackApplied) {
        img.dataset.fallbackApplied = '1';
        img.src = img.dataset.fallback || FALLBACK_IMAGE;
    }
}, true);

// ---------------------------------------------------------------
// PAGE LOADER
// ---------------------------------------------------------------
// First visit in a session gets the full intro; moving between pages is quicker.
const LOADER_START = Date.now();
const LOADER_MIN = (() => {
    try {
        const seen = sessionStorage.getItem('k360-seen');
        sessionStorage.setItem('k360-seen', '1');
        return seen ? 750 : 1700;
    } catch (e) { return 1200; }
})();
let loaderDone = false;
let pageReady = false;

// Progress counter: eases towards 90% while loading, completes when the page is ready
(function runLoaderProgress() {
    const tick = () => {
        if (loaderDone) return;
        const loader = document.getElementById('pageLoader');
        if (loader) {
            const t = Math.min(1, (Date.now() - LOADER_START) / LOADER_MIN);
            const eased = 1 - Math.pow(1 - t, 3);
            const pct = pageReady ? Math.round(eased * 100) : Math.min(90, Math.round(eased * 90));
            const bar = loader.querySelector('.loader-bar span');
            const label = loader.querySelector('.loader-pct');
            if (bar) bar.style.width = pct + '%';
            if (label) label.textContent = pct + '%';
            if (pageReady && t >= 1) { finishLoader(); return; }
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
})();

function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    const loader = document.getElementById('pageLoader');
    if (loader) {
        const bar = loader.querySelector('.loader-bar span');
        const label = loader.querySelector('.loader-pct');
        if (bar) bar.style.width = '100%';
        if (label) label.textContent = '100%';
        setTimeout(() => { loader.classList.remove('leaving'); loader.classList.add('loaded'); }, 180);
    }
    setTimeout(playIntro, 380);
}

function hidePageLoader() { pageReady = true; }
window.addEventListener('load', hidePageLoader);
setTimeout(hidePageLoader, 3500); // never wait on slow third-party assets
window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        const loader = document.getElementById('pageLoader');
        if (loader) { loader.classList.remove('leaving'); loader.classList.add('loaded'); }
    }
});

// Hero entrance: the first section's key elements rise in, one after another
function prepareIntro() {
    const hero = document.querySelector('main > section');
    if (!hero) return;
    const els = hero.querySelectorAll('h1, h1 ~ p, .eyebrow, .animate-float, h1 ~ div, .steps, span.text-xs.font-bold.uppercase');
    [...els].filter(el => !el.closest('.intro')).slice(0, 7).forEach((el, i) => {
        el.classList.add('intro');
        el.style.setProperty('--d', `${i * 0.11}s`);
    });
}
function playIntro() {
    document.querySelectorAll('.intro').forEach(el => el.classList.add('intro-in'));
}

// ---------------------------------------------------------------
// HEADER & FOOTER
// ---------------------------------------------------------------
function buildHeader(activePage) {
    const desktopLinks = NAV_LINKS.map(l => `
        <a href="${l.href}" class="relative py-2 transition-colors ${l.page === activePage ? 'text-armyGreenLight' : 'hover:text-armyGreenLight'}" ${l.page === activePage ? 'aria-current="page"' : ''}>
            ${l.label}
            ${l.page === activePage ? '<span class="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-armyGreenBright"></span>' : ''}
        </a>`).join('');

    const mobileLinks = NAV_LINKS.map(l => `
        <a href="${l.href}" class="flex items-center justify-between py-3 border-b border-charcoalBorder/60 text-sm uppercase tracking-wider ${l.page === activePage ? 'text-armyGreenLight' : 'text-greyLight hover:text-armyGreenLight'}" ${l.page === activePage ? 'aria-current="page"' : ''}>
            ${l.label} <i class="fa-solid fa-chevron-right text-[10px] opacity-60"></i>
        </a>`).join('');

    return `
    <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass-panel border-b border-charcoalBorder/60" id="mainHeader">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            <a href="/" class="flex items-center gap-3 group min-w-0" aria-label="KABOVELO 360 home">
                <div class="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-armyGreenBright via-armyGreen to-obsidian p-[1px] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <div class="w-full h-full bg-obsidian rounded-[11px] flex items-center justify-center border border-armyGreen/40">
                        <i class="fa-solid fa-compass text-armyGreenLight text-lg group-hover:rotate-180 transition-transform duration-700"></i>
                    </div>
                </div>
                <div class="flex flex-col min-w-0">
                    <span class="font-serif text-lg sm:text-xl font-bold tracking-wider text-white whitespace-nowrap">KABOVELO <span class="text-xs tracking-widest text-armyGreenLight font-sans border border-armyGreenBright/40 px-1.5 py-0.5 rounded ml-1 bg-armyGreen/20">360</span></span>
                    <span class="hidden min-[380px]:block text-[10px] text-greyMuted tracking-widest uppercase font-semibold truncate">Tactical Creative Ecosystem</span>
                </div>
            </a>

            <nav class="hidden xl:flex items-center gap-5 text-xs font-semibold uppercase tracking-wider text-greyLight" aria-label="Main navigation">
                ${desktopLinks}
            </nav>

            <div class="flex items-center gap-3">
                <a href="/enroll/" class="hidden sm:inline-flex relative px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-armyGreen to-armyGreenBright text-white shadow-lg hover:shadow-armyGreenBright/30 transition-all duration-300 hover:-translate-y-0.5 border border-armyGreenLight/30 whitespace-nowrap ${activePage === 'enroll' ? 'ring-1 ring-armyGreenLight' : ''}">
                    <span class="flex items-center gap-2"><i class="fa-solid fa-graduation-cap text-armyGreenLight"></i> Enroll Now</span>
                </a>
                <button id="mobileMenuBtn" type="button" class="xl:hidden w-11 h-11 rounded-xl flex items-center justify-center text-greyLight hover:text-white hover:bg-white/5 text-xl" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobileMenu">
                    <i class="fa-solid fa-bars-staggered"></i>
                </button>
            </div>
        </div>

        <nav id="mobileMenu" class="hidden xl:hidden glass-panel border-t border-charcoalBorder px-4 sm:px-6 pb-6 pt-2 max-h-[calc(100vh-5rem)] overflow-y-auto" aria-label="Mobile navigation">
            ${mobileLinks}
            <div class="mt-5 grid grid-cols-2 gap-3">
                <a href="/enroll/" class="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-armyGreen to-armyGreenBright text-white font-bold text-xs uppercase tracking-wider">
                    <i class="fa-solid fa-graduation-cap"></i> Enroll Now
                </a>
                <a href="/services/" class="flex items-center justify-center gap-2 py-3.5 rounded-xl glass-card text-white font-bold text-xs uppercase tracking-wider">
                    <i class="fa-solid fa-mobile-screen-button"></i> Book &amp; Pay
                </a>
            </div>
        </nav>
    </header>`;
}

function buildFooter() {
    return `
    <footer class="bg-obsidian border-t border-charcoalBorder pt-16 pb-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-charcoalBorder">
                <div class="space-y-4">
                    <a href="/" class="flex items-center gap-3">
                        <span class="w-9 h-9 rounded-lg bg-armyGreen/30 border border-armyGreenBright/40 flex items-center justify-center text-armyGreenLight font-bold text-xs">360</span>
                        <span class="font-serif text-lg font-bold text-white">KABOVELO 360</span>
                    </a>
                    <p class="text-xs text-greyMuted leading-relaxed max-w-xs">
                        The high-performance creative ecosystem uniting film, fashion, education, social impact, and brand marketing.
                    </p>
                    <p class="text-[11px] text-greyMuted flex flex-wrap gap-2 pt-1">
                        <span class="momo-chip" style="--c:#FFCB05">MTN MoMo</span><span class="momo-chip" style="--c:#E40000">Airtel Money</span><span class="momo-chip" style="--c:#00A651">Zamtel</span>
                    </p>
                    <div class="flex gap-3 text-greyMuted text-base pt-1">
                        ${SOCIAL_LINKS.map(s => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}" class="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:text-armyGreenLight hover:border-armyGreenLight/50"><i class="fa-brands ${s.icon}"></i></a>`).join('')}
                    </div>
                </div>

                <div>
                    <h5 class="text-xs font-bold uppercase tracking-widest text-armyGreenLight mb-4">Divisions</h5>
                    <ul class="space-y-2.5 text-sm text-greyMuted">
                        ${DIVISION_LINKS.map(d => `<li><a href="/divisions/#${d.key}" class="hover:text-white transition-colors">${d.label}</a></li>`).join('')}
                    </ul>
                </div>

                <div>
                    <h5 class="text-xs font-bold uppercase tracking-widest text-armyGreenLight mb-4">Explore</h5>
                    <ul class="space-y-2.5 text-sm text-greyMuted">
                        ${NAV_LINKS.filter(l => l.page !== 'home').map(l => `<li><a href="${l.href}" class="hover:text-white transition-colors">${l.label}</a></li>`).join('')}
                    </ul>
                </div>

                <div>
                    <h5 class="text-xs font-bold uppercase tracking-widest text-armyGreenLight mb-4">Get in Touch</h5>
                    <ul class="space-y-3 text-sm text-greyMuted">
                        <li class="flex gap-3"><i class="fa-solid fa-location-dot text-armyGreenLight mt-1"></i><span>KABOVELO 360 Studios, Lusaka, Zambia</span></li>
                        <li class="flex gap-3"><i class="fa-solid fa-envelope text-armyGreenLight mt-1"></i><a href="mailto:admin@kabovelo360.co.zm" class="hover:text-white break-all">admin@kabovelo360.co.zm</a></li>
                        <li class="flex gap-3"><i class="fa-solid fa-phone text-armyGreenLight mt-1"></i><a href="tel:+260979813471" class="hover:text-white">+260 979 813 471</a></li>
                        <li class="flex gap-3"><i class="fa-brands fa-whatsapp text-armyGreenLight mt-1"></i><a href="https://wa.me/260979813471" target="_blank" rel="noopener" class="hover:text-white">WhatsApp us</a></li>
                    </ul>
                    <a href="/contact/" class="inline-flex items-center gap-2 mt-5 text-xs font-bold uppercase tracking-widest text-armyGreenLight hover:text-white">Contact page <i class="fa-solid fa-arrow-right"></i></a>
                </div>
            </div>

            <div class="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-greyMuted gap-4 text-center">
                <p>&copy; ${new Date().getFullYear()} KABOVELO 360 Ecosystem. All rights reserved.</p>
                <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <a href="/legal/#privacy" class="hover:text-greyLight">Privacy Policy</a>
                    <a href="/legal/#terms" class="hover:text-greyLight">Terms of Ecosystem</a>
                    <a href="/legal/#grants" class="hover:text-greyLight">Grant Transparency</a>
                </div>
            </div>
        </div>
    </footer>

    <button id="backToTop" type="button" aria-label="Back to top" class="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full glass-panel border border-armyGreenBright/40 text-armyGreenLight flex items-center justify-center opacity-0 pointer-events-none translate-y-4 transition-all duration-300 hover:bg-armyGreenBright hover:text-white">
        <i class="fa-solid fa-arrow-up"></i>
    </button>

    <div id="toast" role="status" aria-live="polite" class="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[60] glass-panel border border-armyGreenBright/40 rounded-xl p-4 shadow-2xl flex items-center gap-3 translate-y-8 opacity-0 transition-all duration-300 pointer-events-none">
        <i class="fa-solid fa-circle-check text-armyGreenLight text-lg flex-shrink-0"></i>
        <span id="toastMsg" class="text-xs font-semibold text-white">Action completed successfully!</span>
    </div>`;
}

function setupHeader() {
    const header = document.getElementById('mainHeader');
    const backToTop = document.getElementById('backToTop');
    const onScroll = () => {
        const scrolled = window.scrollY > 40;
        header.classList.toggle('bg-obsidian/95', scrolled);
        header.classList.toggle('is-scrolled', scrolled);
        header.classList.toggle('shadow-2xl', scrolled);
        if (backToTop) {
            const show = window.scrollY > 600;
            backToTop.classList.toggle('opacity-0', !show);
            backToTop.classList.toggle('pointer-events-none', !show);
            backToTop.classList.toggle('translate-y-4', !show);
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    const setOpen = (open) => {
        menu.classList.toggle('hidden', !open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        btn.innerHTML = `<i class="fa-solid ${open ? 'fa-xmark' : 'fa-bars-staggered'}"></i>`;
    };
    btn.addEventListener('click', () => setOpen(menu.classList.contains('hidden')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    window.addEventListener('resize', () => { if (window.innerWidth >= 1280) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

// ---------------------------------------------------------------
// PAGE TRANSITIONS — show loader when moving to another page
// ---------------------------------------------------------------
function setupPageTransitions() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link || e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (link.target === '_blank' || link.hasAttribute('download')) return;
        const url = new URL(link.href, location.href);
        // only our own pages (/, /about/, …) — not files like images or PDFs
        if (url.origin !== location.origin || /\.[a-z0-9]+$/i.test(url.pathname.replace(/\.html$/, ''))) return;
        // Same page, only the hash changes → let the page handle it
        if (url.pathname === location.pathname) return;
        e.preventDefault();
        const loader = document.getElementById('pageLoader');
        if (loader) {
            const bar = loader.querySelector('.loader-bar span');
            const label = loader.querySelector('.loader-pct');
            if (bar) bar.style.width = '0%';
            if (label) label.textContent = '';
            loader.classList.remove('loaded');
            loader.classList.add('leaving');
        }
        setTimeout(() => { location.href = url.href; }, 260);
    });
}

// ---------------------------------------------------------------
// TOAST
// ---------------------------------------------------------------
let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toastMsg').innerText = msg;
    toast.classList.remove('translate-y-8', 'opacity-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('translate-y-8', 'opacity-0'), 4000);
}

// ---------------------------------------------------------------
// MODALS — generic open/close, ESC key and backdrop click
// ---------------------------------------------------------------
function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => modal.classList.remove('opacity-0'));
    const focusable = modal.querySelector('button, [href], input, select, textarea');
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 50);
}

function closeModalById(id) {
    const modal = document.getElementById(id);
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (!document.querySelector('[data-modal]:not(.hidden)')) document.body.classList.remove('modal-open');
    }, 250);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('[data-modal]:not(.hidden)').forEach(m => closeModalById(m.id));
});
document.addEventListener('click', (e) => {
    if (e.target.matches && e.target.matches('[data-modal]')) closeModalById(e.target.id);
});

// ---------------------------------------------------------------
// SCROLL REVEAL & COUNTERS
// ---------------------------------------------------------------
function setupReveal(root = document) {
    const items = root.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.classList.add('is-visible');
                io.unobserve(el);
                setTimeout(() => { el.style.transitionDelay = ''; }, 1200); // keep hover effects instant
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(i => {
        const siblings = [...i.parentElement.children].filter(c => c.classList.contains('reveal'));
        if (siblings.length > 1) i.style.transitionDelay = `${(siblings.indexOf(i) % 4) * 90}ms`;
        io.observe(i);
    });
}

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
    const run = (counter) => {
        const target = +counter.getAttribute('data-target');
        const decimals = +(counter.getAttribute('data-decimals') || 0);
        const start = performance.now();
        const step = (now) => {
            const p = Math.min((now - start) / 1800, 1);
            const v = target * (1 - Math.pow(1 - p, 3));
            counter.innerText = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString();
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); } });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
}

// ---------------------------------------------------------------
// BOOT
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page || '';
    const headerSlot = document.getElementById('siteHeader');
    const footerSlot = document.getElementById('siteFooter');
    if (headerSlot) headerSlot.outerHTML = buildHeader(page);
    if (footerSlot) footerSlot.outerHTML = buildFooter();
    setupHeader();
    setupPageTransitions();
    prepareIntro();
});
