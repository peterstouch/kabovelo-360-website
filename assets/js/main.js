// KABOVELO 360 — PAGE LOGIC
// Depends on layout.js (header/footer/modals/toast) and data.js (content).

const DIVISION_KEYS = Object.keys(ECOSYSTEM_DIVISIONS);
const SYNERGY_STORAGE_KEY = 'k360-synergy-selection';

function qs(name) {
    return new URLSearchParams(location.search).get(name);
}

function storageGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable — selection stays in memory */ }
}

// Where a package's button leads: enrollment, online checkout, grant application or quote request
function tierAction(service, tierKey) {
    const pkg = service.packages[tierKey];
    if (pkg.payable === false) return { href: contactUrl({ division: service.division, service: service.title, package: pkg.name }), label: 'Apply', icon: 'fa-file-signature' };
    if (!isPayableOnline(pkg)) return { href: contactUrl({ division: service.division, service: service.title, package: pkg.name }), label: 'Request Quote', icon: 'fa-file-invoice' };
    if (service.division === 'Film Academy') return { href: `/enroll/?course=${service.id}&tier=${tierKey}`, label: 'Enroll & Pay', icon: 'fa-graduation-cap' };
    return { href: `/checkout/?items=${service.id}:${tierKey}`, label: 'Book & Pay', icon: 'fa-mobile-screen-button' };
}

function contactUrl(params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    return `/contact/${q.toString() ? '?' + q.toString() : ''}`;
}

// =================================================================
// SHARED TABS
// =================================================================
function renderTabs(container, items, activeKey, onSelect) {
    if (!container) return;
    container.setAttribute('role', 'tablist');
    container.innerHTML = items.map(item => `
        <button type="button" role="tab" data-key="${item.key}" aria-selected="${item.key === activeKey}"
            class="tab-btn ${item.key === activeKey ? 'active' : ''} px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl glass-card text-[11px] sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all text-greyLight border-charcoalBorder whitespace-nowrap">
            ${item.icon ? `<i class="fa-solid ${item.icon} text-armyGreenLight"></i>` : ''} ${item.label}
            ${item.count !== undefined ? `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-greyMuted">${item.count}</span>` : ''}
        </button>`).join('');
    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            onSelect(btn.dataset.key);
        });
    });
}

function setActiveTab(container, key) {
    if (!container) return;
    container.querySelectorAll('.tab-btn').forEach(b => {
        const on = b.dataset.key === key;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
    });
}

function divisionTabItems() {
    return DIVISION_KEYS.map(k => ({ key: k, label: ECOSYSTEM_DIVISIONS[k].name, icon: ECOSYSTEM_DIVISIONS[k].icon }));
}

// =================================================================
// CARD TEMPLATES
// =================================================================
function serviceCardHTML(s) {
    const divData = getDivisionByName(s.division);
    return `
        <article class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-charcoalBorder hover:border-armyGreenBright/50 transition-all group reveal">
            <button type="button" onclick="openServiceModal('${s.id}')" class="text-left block w-full">
                <div class="relative h-44 w-full overflow-hidden">
                    <img src="${s.image}" alt="${s.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-tacticalBlack via-tacticalBlack/40 to-transparent"></div>
                    <div class="absolute top-3 left-3 right-3 flex justify-between items-center gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md ${divData ? divData.badgeColor : ''} border border-armyGreenBright/30 truncate">${s.division}</span>
                        <span class="text-[10px] text-white font-mono bg-obsidian/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 flex-shrink-0">
                            <i class="fa-solid fa-clock text-armyGreenLight mr-1"></i>${s.turnaround.split(' ')[0]}
                        </span>
                    </div>
                </div>
                <div class="p-5 sm:p-6 space-y-3">
                    <h3 class="font-serif text-lg font-bold text-white group-hover:text-armyGreenLight transition-colors">${s.title}</h3>
                    <p class="text-xs text-greyMuted leading-relaxed">${s.shortDesc}</p>
                </div>
            </button>
            <div class="px-5 sm:px-6 pb-5 pt-4 border-t border-charcoalBorder/50 flex items-center justify-between gap-3">
                <div>
                    <span class="text-[10px] text-greyMuted uppercase block">Starting Tier</span>
                    <span class="text-sm font-bold text-armyGreenLight font-serif">${formatPrice(s.packages.starter, { short: true })}</span>
                </div>
                <button type="button" onclick="openServiceModal('${s.id}')" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-armyGreenBright text-white font-semibold text-xs uppercase tracking-wider transition-all border border-white/10 whitespace-nowrap">
                    View Packages &rarr;
                </button>
            </div>
        </article>`;
}

function workCardHTML(p) {
    const div = ECOSYSTEM_DIVISIONS[p.division];
    return `
        <button type="button" onclick="openWorkModal('${p.id}')" class="group relative text-left rounded-2xl overflow-hidden glass-card border border-charcoalBorder h-72 sm:h-80 w-full reveal">
            <img src="${p.image}" alt="${p.title}" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-transparent opacity-90"></div>
            <div class="absolute inset-0 p-5 flex flex-col justify-between">
                <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-armyGreen/50 text-armyGreenLight border border-armyGreenBright/40 backdrop-blur-md truncate">
                        <i class="fa-solid ${div.icon} mr-1"></i>${div.name}
                    </span>
                    <span class="text-[10px] font-mono text-white bg-obsidian/70 px-2 py-0.5 rounded border border-white/10">${p.year}</span>
                </div>
                <div>
                    <span class="text-[10px] uppercase tracking-widest text-armyGreenLight font-semibold">${p.type}</span>
                    <h3 class="font-serif text-xl font-bold text-white mt-1 group-hover:text-armyGreenLight transition-colors">${p.title}</h3>
                    <p class="text-xs text-greyLight/80 mt-1.5 line-clamp-2">${p.summary}</p>
                    <span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-armyGreenLight uppercase tracking-wider mt-3">
                        View Case Study <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </span>
                </div>
            </div>
        </button>`;
}

function clientLogosHTML(size = 'h-20') {
    return CLIENTS.map(c => `
        <div class="logo-tile ${size} w-36 sm:w-44 flex-shrink-0" title="${c.name}">
            <img src="${c.logo}" alt="${c.name} logo" loading="lazy">
        </div>`).join('');
}

function renderClientMarquee(container) {
    if (!container) return;
    // Track is duplicated so the loop is seamless
    container.innerHTML = `<div class="marquee"><div class="marquee-track">${clientLogosHTML()}${clientLogosHTML()}</div></div>`;
}

function renderClientGrid(container) {
    if (!container) return;
    container.innerHTML = CLIENTS.map(c => `
        <div class="logo-tile h-24 reveal" title="${c.name}">
            <img src="${c.logo}" alt="${c.name} logo" loading="lazy">
        </div>`).join('');
}

function sessionsGalleryHTML(limit) {
    const list = limit ? FOUNDER.sessions.slice(0, limit) : FOUNDER.sessions;
    return list.map((s, i) => `
        <button type="button" onclick="openImageLightbox(${i})" class="group relative rounded-2xl overflow-hidden border border-charcoalBorder aspect-[4/3] reveal">
            <img src="${s.src}" alt="${s.caption}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <span class="absolute bottom-3 left-3 right-3 text-left text-[11px] font-semibold text-white">${s.caption}</span>
            <span class="absolute top-3 right-3 w-8 h-8 rounded-full bg-obsidian/70 border border-white/10 flex items-center justify-center text-armyGreenLight text-xs opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-expand"></i></span>
        </button>`).join('');
}

// =================================================================
// MODALS (injected once on every page)
// =================================================================
function injectModals() {
    document.body.insertAdjacentHTML('beforeend', `
    <div id="serviceModal" data-modal role="dialog" aria-modal="true" aria-labelledby="modalTitle" class="fixed inset-0 z-[70] hidden items-center justify-center p-3 sm:p-6 bg-obsidian/85 backdrop-blur-md opacity-0 transition-opacity duration-300">
        <div class="glass-panel w-full max-w-3xl rounded-3xl border border-armyGreenBright/40 overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            <div class="relative h-40 sm:h-52 w-full overflow-hidden flex-shrink-0">
                <img id="modalHeaderImg" src="${FALLBACK_IMAGE}" alt="" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-tacticalBlack via-tacticalBlack/60 to-transparent"></div>
                <div class="absolute bottom-4 left-5 right-5">
                    <span id="modalDivisionBadge" class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-armyGreenBright/40 backdrop-blur-md">Division</span>
                    <h3 id="modalTitle" class="font-serif text-xl sm:text-3xl font-bold text-white mt-2">Service</h3>
                </div>
                <button type="button" onclick="closeModalById('serviceModal')" aria-label="Close" class="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-obsidian/70 backdrop-blur-md text-greyLight hover:text-white flex items-center justify-center border border-white/10">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-5 sm:p-6 overflow-y-auto space-y-6 text-greyLight text-xs sm:text-sm">
                <p id="modalDescription" class="leading-relaxed"></p>
                <div>
                    <h4 class="font-serif text-base font-bold text-white mb-4">Packaged Tiers &amp; Deliverables</h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="modalPackagesGrid"></div>
                </div>
                <div class="p-4 rounded-xl glass-card border-charcoalBorder">
                    <h5 class="font-bold text-white mb-2 flex items-center gap-2"><i class="fa-solid fa-circle-info text-armyGreenLight"></i> Turnaround &amp; Integration</h5>
                    <p id="modalTurnaround" class="text-xs text-greyMuted"></p>
                </div>
            </div>
            <div class="p-4 sm:p-5 border-t border-charcoalBorder bg-tacticalBlack flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button type="button" onclick="closeModalById('serviceModal')" class="px-5 py-3 rounded-xl glass-card text-greyLight hover:text-white text-xs uppercase font-semibold">Close</button>
                <button type="button" id="modalAddToPackage" class="px-5 py-3 rounded-xl border border-armyGreenBright/50 text-armyGreenLight hover:bg-armyGreen/30 text-xs font-bold uppercase tracking-wider"><i class="fa-solid fa-plus mr-1"></i> Add to Package</button>
                <a id="modalBookLink" href="/contact/" class="px-6 py-3 rounded-xl bg-armyGreenBright text-white text-xs font-bold uppercase tracking-wider hover:scale-105 transition-all shadow-md text-center">Book Service Package</a>
            </div>
        </div>
    </div>

    <div id="workModal" data-modal role="dialog" aria-modal="true" aria-labelledby="workTitle" class="fixed inset-0 z-[70] hidden items-center justify-center p-3 sm:p-6 bg-obsidian/90 backdrop-blur-lg opacity-0 transition-opacity duration-300">
        <div class="glass-panel w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-armyGreenBright/40 shadow-2xl relative" id="workModalBody"></div>
    </div>

    <div id="imageLightbox" data-modal role="dialog" aria-modal="true" aria-label="Photo viewer" class="fixed inset-0 z-[80] hidden items-center justify-center p-3 sm:p-8 bg-obsidian/95 backdrop-blur-lg opacity-0 transition-opacity duration-300">
        <div class="relative w-full max-w-5xl">
            <button type="button" onclick="closeModalById('imageLightbox')" aria-label="Close" class="absolute -top-2 right-0 sm:-right-2 -translate-y-full w-10 h-10 rounded-full bg-obsidian/80 text-white border border-white/10 flex items-center justify-center hover:bg-armyGreenBright"><i class="fa-solid fa-xmark"></i></button>
            <img id="lightboxImage" src="${FALLBACK_IMAGE}" alt="" class="w-full max-h-[75vh] object-contain rounded-2xl border border-charcoalBorder bg-black">
            <div class="flex items-center justify-between gap-4 mt-4">
                <button type="button" onclick="stepImageLightbox(-1)" aria-label="Previous photo" class="w-11 h-11 rounded-full glass-card text-white flex items-center justify-center flex-shrink-0"><i class="fa-solid fa-chevron-left"></i></button>
                <p id="lightboxCaption" class="text-xs sm:text-sm text-greyLight text-center"></p>
                <button type="button" onclick="stepImageLightbox(1)" aria-label="Next photo" class="w-11 h-11 rounded-full glass-card text-white flex items-center justify-center flex-shrink-0"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
        </div>
    </div>`);

    document.getElementById('modalAddToPackage').addEventListener('click', () => {
        if (currentModalService) addServiceToPackage(currentModalService.id);
    });
}

// ---- Service modal
let currentModalService = null;
function openServiceModal(serviceId) {
    const service = getAllServices().find(s => s.id === serviceId);
    if (!service) return;
    currentModalService = service;
    const divData = getDivisionByName(service.division);

    document.getElementById('modalHeaderImg').src = service.image;
    document.getElementById('modalHeaderImg').alt = service.title;
    const badge = document.getElementById('modalDivisionBadge');
    badge.innerText = service.division;
    badge.className = `text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-armyGreenBright/40 backdrop-blur-md ${divData ? divData.badgeColor : ''}`;
    document.getElementById('modalTitle').innerText = service.title;
    document.getElementById('modalDescription').innerText = service.fullDesc;
    document.getElementById('modalTurnaround').innerText = `Estimated Turnaround: ${service.turnaround}. Fully integrable with other KABOVELO 360 divisions.`;
    const bookTier = isPayableOnline(service.packages.pro) ? 'pro' : 'starter';
    const book = tierAction(service, bookTier);
    const bookLink = document.getElementById('modalBookLink');
    bookLink.href = book.href;
    bookLink.innerHTML = `<i class="fa-solid ${book.icon} mr-1"></i> ${book.label}`;

    const tiers = [
        { key: 'starter', label: 'Starter Tier', featured: false },
        { key: 'pro', label: 'Professional Tier', featured: true },
        { key: 'enterprise', label: 'Enterprise Tier', featured: false }
    ];
    document.getElementById('modalPackagesGrid').innerHTML = tiers.map(t => {
        const pkg = service.packages[t.key];
        return `
        <div class="glass-card p-4 rounded-xl border ${t.featured ? 'border-armyGreenBright/50 bg-armyGreen/10' : 'border-charcoalBorder'} flex flex-col justify-between relative ${t.featured ? 'mt-2 md:mt-0' : ''}">
            ${t.featured ? '<span class="absolute -top-2.5 right-2 text-[9px] font-bold uppercase tracking-wider bg-armyGreenBright text-white px-2 py-0.5 rounded-full">Recommended</span>' : ''}
            <div>
                <span class="text-[10px] ${t.featured ? 'text-armyGreenLight' : 'text-greyMuted'} font-bold uppercase">${t.label}</span>
                <h5 class="font-serif font-bold text-white text-base mt-1">${pkg.name}</h5>
                <p class="text-sm font-bold text-armyGreenLight mt-1">${formatPrice(pkg)}</p>
                <ul class="mt-3 space-y-1.5 text-[11px] text-greyLight">
                    ${pkg.items.map(item => `<li class="flex gap-1.5"><i class="fa-solid fa-check text-armyGreenLight mt-0.5"></i><span>${item}</span></li>`).join('')}
                </ul>
            </div>
            <a href="${tierAction(service, t.key).href}" class="mt-4 block text-center py-2.5 rounded-lg ${t.featured ? 'bg-armyGreenBright hover:bg-armyGreenLight' : 'bg-white/5 hover:bg-armyGreenBright'} border border-white/10 text-[11px] font-bold uppercase tracking-wider text-white transition-colors"><i class="fa-solid ${tierAction(service, t.key).icon} mr-1"></i> ${tierAction(service, t.key).label}</a>
        </div>`;
    }).join('');

    openModal('serviceModal');
}

// ---- Work / case study modal
let workModalList = WORK_PROJECTS;
let currentWorkIndex = 0;
function openWorkModal(projectId, list) {
    if (list) workModalList = list;
    if (!workModalList.some(p => p.id === projectId)) workModalList = WORK_PROJECTS;
    currentWorkIndex = workModalList.findIndex(p => p.id === projectId);
    renderWorkModal();
    openModal('workModal');
}

function stepWorkModal(dir) {
    currentWorkIndex = (currentWorkIndex + dir + workModalList.length) % workModalList.length;
    renderWorkModal();
    document.getElementById('workModalBody').scrollTop = 0;
}

function renderWorkModal() {
    const p = workModalList[currentWorkIndex];
    const div = ECOSYSTEM_DIVISIONS[p.division];
    const images = [p.image, ...(p.gallery || [])];
    document.getElementById('workModalBody').innerHTML = `
        <div class="relative">
            <img id="workMainImg" src="${images[0]}" alt="${p.title}" class="w-full h-56 sm:h-96 object-cover object-[50%_25%]">
            <div class="absolute inset-0 bg-gradient-to-t from-tacticalBlack via-transparent to-transparent pointer-events-none"></div>
            <button type="button" onclick="closeModalById('workModal')" aria-label="Close" class="absolute top-3 right-3 w-10 h-10 rounded-full bg-obsidian/80 text-white border border-white/10 flex items-center justify-center hover:bg-armyGreenBright"><i class="fa-solid fa-xmark"></i></button>
            ${workModalList.length > 1 ? `
            <button type="button" onclick="stepWorkModal(-1)" aria-label="Previous project" class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-obsidian/80 text-white border border-white/10 flex items-center justify-center hover:bg-armyGreenBright"><i class="fa-solid fa-chevron-left"></i></button>
            <button type="button" onclick="stepWorkModal(1)" aria-label="Next project" class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-obsidian/80 text-white border border-white/10 flex items-center justify-center hover:bg-armyGreenBright"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
        </div>
        <div class="px-5 sm:px-8 -mt-8 relative flex gap-2 overflow-x-auto no-scrollbar pb-1">
            ${images.map((src, i) => `
                <button type="button" onclick="document.getElementById('workMainImg').src='${src}'; this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('ring-2')); this.classList.add('ring-2');" class="flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden border border-white/20 ring-armyGreenLight ${i === 0 ? 'ring-2' : ''}">
                    <img src="${src}" alt="" class="w-full h-full object-cover">
                </button>`).join('')}
        </div>
        <div class="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="md:col-span-2 space-y-5">
                <div>
                    <span class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-armyGreen/40 text-armyGreenLight border border-armyGreenBright/40"><i class="fa-solid ${div.icon}"></i> ${div.name}</span>
                    <h3 id="workTitle" class="font-serif text-2xl sm:text-4xl font-bold text-white mt-3">${p.title}</h3>
                    <p class="text-xs uppercase tracking-widest text-greyMuted mt-2">${p.type} · ${p.client} · ${p.year}</p>
                </div>
                <p class="text-sm sm:text-base text-greyLight leading-relaxed">${p.summary}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="glass-card rounded-xl p-4 border-charcoalBorder">
                        <h4 class="text-xs font-bold uppercase tracking-widest text-armyGreenLight mb-2"><i class="fa-solid fa-flag mr-1"></i> The Challenge</h4>
                        <p class="text-xs text-greyMuted leading-relaxed">${p.challenge}</p>
                    </div>
                    <div class="glass-card rounded-xl p-4 border-charcoalBorder">
                        <h4 class="text-xs font-bold uppercase tracking-widest text-armyGreenLight mb-2"><i class="fa-solid fa-compass-drafting mr-1"></i> Our Approach</h4>
                        <p class="text-xs text-greyMuted leading-relaxed">${p.approach}</p>
                    </div>
                </div>
            </div>
            <aside class="space-y-5">
                <div class="grid grid-cols-3 md:grid-cols-1 gap-3">
                    ${p.results.map(r => `
                        <div class="glass-card rounded-xl p-3 md:p-4 border-charcoalBorder text-center md:text-left">
                            <div class="font-serif text-lg sm:text-2xl font-bold text-white">${r.value}</div>
                            <div class="text-[10px] uppercase tracking-wider text-greyMuted">${r.label}</div>
                        </div>`).join('')}
                </div>
                <div class="flex flex-wrap gap-2">${p.tags.map(t => `<span class="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-greyLight">${t}</span>`).join('')}</div>
                <div class="space-y-2.5">
                    <a href="${contactUrl({ division: div.name, project: p.title })}" class="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-armyGreen via-armyGreenMedium to-armyGreenBright text-white font-bold text-xs uppercase tracking-wider border border-armyGreenLight/30">Start a Similar Project</a>
                    <a href="/divisions/#${div.id}" class="block w-full text-center py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs uppercase tracking-wider">Explore ${div.name}</a>
                </div>
                ${workModalList.length > 1 ? `<p class="text-[10px] text-greyMuted text-center font-mono">${currentWorkIndex + 1} / ${workModalList.length}</p>` : ''}
            </aside>
        </div>`;
}

// ---- Image lightbox (founder / teaching photos)
let lightboxIndex = 0;
function openImageLightbox(index) {
    lightboxIndex = index;
    updateImageLightbox();
    openModal('imageLightbox');
}
function stepImageLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + FOUNDER.sessions.length) % FOUNDER.sessions.length;
    updateImageLightbox();
}
function updateImageLightbox() {
    const item = FOUNDER.sessions[lightboxIndex];
    const img = document.getElementById('lightboxImage');
    img.src = item.src;
    img.alt = item.caption;
    document.getElementById('lightboxCaption').innerText = `${item.caption}  ·  ${lightboxIndex + 1} / ${FOUNDER.sessions.length}`;
}
document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('imageLightbox');
    const wm = document.getElementById('workModal');
    if (lb && !lb.classList.contains('hidden')) {
        if (e.key === 'ArrowRight') stepImageLightbox(1);
        if (e.key === 'ArrowLeft') stepImageLightbox(-1);
    } else if (wm && !wm.classList.contains('hidden') && workModalList.length > 1) {
        if (e.key === 'ArrowRight') stepWorkModal(1);
        if (e.key === 'ArrowLeft') stepWorkModal(-1);
    }
});

// =================================================================
// DIVISION PANEL (Home + Divisions page)
// =================================================================
// DIVISION VIDEOS — autoplay (muted) while on screen, sound toggle,
// pause, full-screen player with sound, swipeable rail for 3+ videos
// =================================================================
const VIDEO_RATIO = { vertical: '9 / 16', square: '1 / 1', wide: '16 / 9', ultrawide: '8 / 3' };

function videoCardHTML(v, inRail = false) {
    return `
        <figure class="video-card group ${inRail ? 'in-rail' : ''}" data-shape="${v.shape}">
            <div class="video-frame relative rounded-2xl overflow-hidden border border-white/10 bg-black" style="aspect-ratio:${VIDEO_RATIO[v.shape] || '16 / 9'}">
                ${v.shape === 'ultrawide' ? `<img src="${v.poster}" alt="" aria-hidden="true" class="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60">` : ''}
                <video class="absolute inset-0 w-full h-full ${v.shape === 'ultrawide' ? 'object-contain' : 'object-cover'}" src="${v.src}" poster="${v.poster}" muted loop playsinline preload="none" aria-label="${v.title}"></video>
                <div class="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-obsidian/10 to-obsidian/30 pointer-events-none"></div>
                <span class="video-live absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white bg-obsidian/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10"><span class="w-1.5 h-1.5 rounded-full bg-armyGreenLight"></span> Playing</span>
                <div class="absolute top-3 right-3 flex gap-2">
                    <button type="button" class="video-btn" data-video-play aria-label="Pause video"><i class="fa-solid fa-pause"></i></button>
                    <button type="button" class="video-btn" data-video-sound aria-label="Turn sound on"><i class="fa-solid fa-volume-xmark"></i></button>
                    <button type="button" class="video-btn" data-video-expand aria-label="Watch full screen with sound"><i class="fa-solid fa-expand"></i></button>
                </div>
                <figcaption class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    ${v.client ? `<span class="block text-[10px] font-bold uppercase tracking-[0.2em] text-armyGreenLight mb-1">${v.client}</span>` : ''}
                    <span class="block font-serif text-base sm:text-lg font-semibold text-white leading-snug">${v.title}</span>
                    <span class="flex items-center gap-2 text-[11px] sm:text-xs text-greyLight/90 mt-1 min-w-0">
                        ${v.duration ? `<span class="font-mono text-white/80 whitespace-nowrap flex-shrink-0"><i class="fa-regular fa-clock mr-1 text-[10px]"></i>${v.duration}</span><span class="opacity-40 flex-shrink-0">·</span>` : ''}
                        <span class="line-clamp-1 min-w-0">${v.caption}</span>
                    </span>
                </figcaption>
                <div class="video-progress absolute bottom-0 left-0 h-0.5 bg-armyGreenLight"></div>
            </div>
        </figure>`;
}

function videoShowcaseHTML(divisionKey) {
    const set = DIVISION_VIDEOS[divisionKey];
    if (!set || !set.videos.length) return '';
    const div = ECOSYSTEM_DIVISIONS[divisionKey];
    const vids = set.videos;
    const cta = divisionKey === 'film-academy'
        ? `<a href="/enroll/" class="btn-primary px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest"><i class="fa-solid fa-graduation-cap mr-1.5"></i> Enroll online</a>`
        : `<a href="/services/?division=${encodeURIComponent(div.name)}" class="btn-primary px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest"><i class="fa-solid fa-mobile-screen-button mr-1.5"></i> Book &amp; pay</a>`;
    const header = (withArrows) => `
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-6">
                <div>
                    <span class="eyebrow">Watch · ${vids.length} ${vids.length === 1 ? 'video' : 'videos'}</span>
                    <h4 class="font-serif text-2xl sm:text-3xl font-semibold text-white mt-3">${set.heading}</h4>
                    <p class="text-sm text-greyMuted leading-relaxed mt-2 max-w-xl">${set.intro}</p>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                    ${withArrows ? `
                    <button type="button" class="rail-arrow" data-rail-prev aria-label="Previous videos"><i class="fa-solid fa-arrow-left"></i></button>
                    <button type="button" class="rail-arrow" data-rail-next aria-label="More videos"><i class="fa-solid fa-arrow-right"></i></button>` : ''}
                    ${cta}
                </div>
            </div>`;

    // One or two vertical videos: feature them next to the text
    if (vids.length <= 2 && vids.every(v => v.shape === 'vertical')) {
        const two = vids.length === 2;
        return `
        <section class="video-showcase mb-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center" aria-label="${set.heading}">
            <div class="${two ? 'md:col-span-7 grid grid-cols-2 gap-3 sm:gap-4' : 'md:col-span-5 lg:col-span-4 w-full max-w-[22rem] mx-auto md:max-w-none'}">${vids.map(v => videoCardHTML(v)).join('')}</div>
            <div class="${two ? 'md:col-span-5' : 'md:col-span-7 lg:col-span-8'}">
                <span class="eyebrow">Watch</span>
                <h4 class="font-serif text-2xl sm:text-3xl font-semibold text-white mt-3">${set.heading}</h4>
                <p class="text-sm sm:text-base text-greyMuted leading-relaxed mt-3 max-w-xl">${set.intro}</p>
                <div class="mt-6">${cta}</div>
            </div>
        </section>`;
    }
    // Two of the same shape: side by side
    if (vids.length === 2 && vids[0].shape === vids[1].shape && vids[0].shape !== 'vertical') {
        return `
        <section class="video-showcase mb-10" aria-label="${set.heading}">
            ${header(false)}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">${vids.map(v => videoCardHTML(v)).join('')}</div>
        </section>`;
    }
    // Otherwise: a swipeable film-strip rail
    return `
        <section class="video-showcase mb-10" aria-label="${set.heading}">
            ${header(true)}
            <div class="video-rail no-scrollbar" tabindex="0" aria-label="${set.heading} videos — scroll sideways">
                ${vids.map(v => videoCardHTML(v, true)).join('')}
            </div>
            <div class="rail-dots" aria-hidden="true">${vids.map(() => '<span></span>').join('')}</div>
        </section>`;
}

const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let videoLightboxOpen = false;
const videoObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(e => {
        const v = e.target;
        const need = v.closest('.in-rail') ? 0.6 : 0.35; // in a rail only the clearly visible cards play
        if (e.isIntersecting && e.intersectionRatio >= need) {
            if (!v.dataset.userPaused && !reduceMotion && !videoLightboxOpen) playVideo(v);
        } else if (!v.paused) {
            v.pause();
        }
    });
}, { threshold: [0, 0.35, 0.6, 0.9] }) : null;

function playVideo(v) {
    if (videoLightboxOpen) return;
    if (v.preload === 'none') v.preload = 'auto';
    const p = v.play();
    if (p && p.catch) p.catch(() => { /* autoplay blocked — the play button still works */ });
}

function syncVideoUI(card) {
    const v = card.querySelector('video');
    const play = card.querySelector('[data-video-play]');
    const sound = card.querySelector('[data-video-sound]');
    play.innerHTML = `<i class="fa-solid ${v.paused ? 'fa-play' : 'fa-pause'}"></i>`;
    play.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video');
    sound.innerHTML = `<i class="fa-solid ${v.muted ? 'fa-volume-xmark' : 'fa-volume-high'}"></i>`;
    sound.setAttribute('aria-label', v.muted ? 'Turn sound on' : 'Mute');
    card.classList.toggle('is-playing', !v.paused);
}

// Full-screen player with sound and normal controls
function ensureVideoLightbox() {
    if (document.getElementById('videoLightbox')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div id="videoLightbox" data-modal role="dialog" aria-modal="true" aria-label="Video player" class="fixed inset-0 z-[85] hidden items-center justify-center p-3 sm:p-8 bg-obsidian/95 backdrop-blur-xl opacity-0 transition-opacity duration-300">
        <div class="relative w-full max-w-5xl flex flex-col items-center">
            <button type="button" data-vlb-close aria-label="Close video" class="absolute -top-1 right-0 -translate-y-full w-11 h-11 rounded-full bg-white/10 hover:bg-armyGreenBright text-white flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
            <video id="vlbVideo" class="w-auto max-w-full max-h-[78vh] rounded-2xl border border-white/10 bg-black shadow-2xl" controls playsinline></video>
            <div class="mt-4 text-center">
                <p id="vlbClient" class="text-[10px] font-bold uppercase tracking-[0.2em] text-armyGreenLight"></p>
                <p id="vlbTitle" class="font-serif text-lg sm:text-xl font-semibold text-white mt-1"></p>
                <p id="vlbCaption" class="text-xs text-greyMuted mt-1"></p>
            </div>
        </div>
    </div>`);
    const lb = document.getElementById('videoLightbox');
    const closeIt = () => {
        const v = document.getElementById('vlbVideo');
        v.pause(); v.removeAttribute('src'); v.load();
        videoLightboxOpen = false;
        closeModalById('videoLightbox');
        // let on-screen cards resume
        document.querySelectorAll('.video-card video').forEach(o => { if (videoObserver) { videoObserver.unobserve(o); videoObserver.observe(o); } });
    };
    lb.querySelector('[data-vlb-close]').addEventListener('click', closeIt);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeIt(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && videoLightboxOpen) closeIt(); });
}

function openVideoLightbox(card) {
    ensureVideoLightbox();
    const src = card.querySelector('video');
    document.querySelectorAll('.video-card video').forEach(o => o.pause());
    videoLightboxOpen = true;
    const v = document.getElementById('vlbVideo');
    v.src = src.getAttribute('src');
    v.poster = src.getAttribute('poster');
    v.muted = false;
    v.currentTime = 0;
    document.getElementById('vlbTitle').textContent = src.getAttribute('aria-label');
    const client = card.querySelector('figcaption .text-armyGreenLight');
    document.getElementById('vlbClient').textContent = client ? client.textContent : '';
    const cap = card.querySelector('figcaption .line-clamp-1');
    document.getElementById('vlbCaption').textContent = cap ? cap.textContent : '';
    openModal('videoLightbox');
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
}

function setupRail(section) {
    const rail = section.querySelector('.video-rail');
    if (!rail || rail.dataset.ready) return;
    rail.dataset.ready = '1';
    const prev = section.querySelector('[data-rail-prev]');
    const next = section.querySelector('[data-rail-next]');
    const dots = [...section.querySelectorAll('.rail-dots span')];
    const cards = [...rail.querySelectorAll('.video-card')];
    const step = () => Math.max(rail.clientWidth * 0.8, 240);
    const update = () => {
        const max = rail.scrollWidth - rail.clientWidth - 2;
        const overflow = max > 4;
        rail.classList.toggle('fits', !overflow); // everything visible: centre the cards
        [prev, next].forEach(b => b && b.classList.toggle('hidden', !overflow));
        if (prev) prev.disabled = rail.scrollLeft <= 2;
        if (next) next.disabled = rail.scrollLeft >= max;
        section.querySelector('.rail-dots').classList.toggle('hidden', !overflow);
        const mid = rail.scrollLeft + rail.clientWidth / 2;
        let active = 0;
        cards.forEach((c, i) => { if (c.offsetLeft <= mid) active = i; });
        dots.forEach((d, i) => d.classList.toggle('is-on', i === active));
    };
    prev && prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    rail.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    rail.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); rail.scrollBy({ left: step(), behavior: 'smooth' }); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); rail.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(update)).observe(rail);
    else window.addEventListener('resize', update);
    update();
    setTimeout(update, 400);
}

function initVideos(root = document) {
    root.querySelectorAll('.video-card:not([data-ready])').forEach(card => {
        card.dataset.ready = '1';
        const v = card.querySelector('video');
        const bar = card.querySelector('.video-progress');
        ['play', 'pause', 'volumechange'].forEach(ev => v.addEventListener(ev, () => syncVideoUI(card)));
        v.addEventListener('timeupdate', () => { if (v.duration) bar.style.width = `${(v.currentTime / v.duration) * 100}%`; });
        card.querySelector('[data-video-play]').addEventListener('click', () => {
            if (v.paused) { delete v.dataset.userPaused; playVideo(v); } else { v.dataset.userPaused = '1'; v.pause(); }
        });
        card.querySelector('[data-video-sound]').addEventListener('click', () => {
            const turnOn = v.muted;
            // only one video talks at a time
            document.querySelectorAll('.video-card video').forEach(o => { if (o !== v) o.muted = true; });
            v.muted = !turnOn;
            if (turnOn) { delete v.dataset.userPaused; playVideo(v); }
        });
        card.querySelector('[data-video-expand]').addEventListener('click', () => openVideoLightbox(card));
        // tapping the picture opens the full-screen player with sound
        v.addEventListener('click', () => openVideoLightbox(card));
        syncVideoUI(card);
        if (videoObserver) videoObserver.observe(v); else if (!reduceMotion) playVideo(v);
    });
    root.querySelectorAll('.video-showcase').forEach(setupRail);
}

function releaseVideos(root) {
    root.querySelectorAll('video').forEach(v => { v.pause(); if (videoObserver) videoObserver.unobserve(v); });
}

function switchDivision(divisionKey, opts = {}) {
    const divData = ECOSYSTEM_DIVISIONS[divisionKey];
    const container = document.getElementById('divisionDisplayArea');
    if (!divData || !container) return;
    const detailed = container.dataset.detailed === 'true';

    setActiveTab(document.getElementById('divisionTabs'), divisionKey);
    if (detailed && opts.updateHash !== false) history.replaceState(null, '', `#${divisionKey}`);

    container.style.opacity = '0';
    setTimeout(() => {
        releaseVideos(container);
        const work = WORK_PROJECTS.filter(p => p.division === divisionKey);
        container.innerHTML = `
            <div class="relative rounded-2xl overflow-hidden mb-8 h-72 sm:h-80 border border-charcoalBorder group">
                <img src="${divData.bannerImg}" alt="${divData.name} banner" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                <div class="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/70 to-transparent"></div>
                <div class="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 ${divData.badgeColor} backdrop-blur-md">
                            <i class="fa-solid ${divData.icon}"></i> ${divData.name} Core Division
                        </span>
                        <h3 class="font-serif text-xl sm:text-4xl font-bold text-white drop-shadow-md">${divData.tagline}</h3>
                    </div>
                    <span class="text-[10px] sm:text-xs font-bold text-armyGreenLight bg-obsidian/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-armyGreenBright/30 self-start sm:self-auto">${divData.stats}</span>
                </div>
            </div>

            ${videoShowcaseHTML(divisionKey)}

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div class="lg:col-span-7 space-y-6">
                    <p class="text-greyLight text-sm sm:text-base leading-relaxed">${divData.description}</p>
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-widest text-greyMuted mb-3">Key Division Services <span class="normal-case tracking-normal font-normal">(tap to view packages)</span></h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${divData.services.slice(0, detailed ? divData.services.length : 4).map(s => `
                                <button type="button" onclick="openServiceModal('${s.id}')" class="flex items-center gap-3 glass-card p-2.5 rounded-xl border-charcoalBorder text-xs text-greyLight text-left hover:text-white">
                                    <img src="${s.image}" alt="" class="w-11 h-11 rounded-lg object-cover flex-shrink-0">
                                    <span class="font-medium leading-snug flex-1">${s.title}</span>
                                    <i class="fa-solid fa-chevron-right text-[10px] text-armyGreenLight pr-1"></i>
                                </button>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-5">
                    <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-charcoalBorder space-y-5">
                        <h4 class="font-serif text-xl font-bold text-white">Engage ${divData.name}</h4>
                        <p class="text-xs text-greyMuted leading-relaxed">Book a division-specific consultation or integrate this pillar into a multi-disciplinary package.</p>
                        <div class="space-y-3">
                            ${divisionKey === 'film-academy' ? `<a href="/enroll/" class="btn-primary w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider"><i class="fa-solid fa-graduation-cap mr-1.5"></i> Enroll Online &amp; Pay</a>` : `<a href="/services/?division=${encodeURIComponent(divData.name)}" class="btn-primary w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider"><i class="fa-solid fa-mobile-screen-button mr-1.5"></i> Book &amp; Pay Online</a>`}
                            <a href="/services/?division=${encodeURIComponent(divData.name)}" class="block text-center w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs uppercase tracking-wider transition-all">
                                Explore All ${divData.services.length} ${divData.name} Packages
                            </a>
                            <a href="/work/#${divData.id}" class="block text-center w-full py-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs uppercase tracking-wider transition-all">
                                See ${divData.name} Work
                            </a>
                            <a href="${contactUrl({ division: divData.name })}" class="block text-center w-full py-3 rounded-xl glass-card text-greyLight hover:text-white font-semibold text-xs uppercase tracking-wider transition-all">
                                Request Division Consultation
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            ${detailed && divisionKey === 'film-academy' ? `
            <div class="mt-12">
                <div class="flex items-end justify-between gap-4 mb-5">
                    <div>
                        <span class="text-xs font-bold uppercase tracking-widest text-armyGreenLight">In the Classroom</span>
                        <h4 class="font-serif text-2xl font-bold text-white mt-1">Taught by our founder</h4>
                    </div>
                    <a href="/about/#founder" class="text-xs font-bold uppercase tracking-widest text-armyGreenLight hover:text-white whitespace-nowrap">Meet the founder <i class="fa-solid fa-arrow-right"></i></a>
                </div>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">${sessionsGalleryHTML(4)}</div>
            </div>` : ''}

            ${detailed ? `
            <div class="mt-12">
                <div class="flex items-end justify-between gap-4 mb-5">
                    <div>
                        <span class="text-xs font-bold uppercase tracking-widest text-armyGreenLight">Featured Work</span>
                        <h4 class="font-serif text-2xl font-bold text-white mt-1">${divData.name} projects</h4>
                    </div>
                    <a href="/work/#${divData.id}" class="text-xs font-bold uppercase tracking-widest text-armyGreenLight hover:text-white whitespace-nowrap">All work <i class="fa-solid fa-arrow-right"></i></a>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-work-list="${divisionKey}">${work.map(workCardHTML).join('')}</div>
            </div>` : ''}
        `;
        // Work cards in this panel should step through this division only
        container.querySelectorAll('[data-work-list] button').forEach((btn, i) => {
            btn.setAttribute('onclick', `openWorkModal('${work[i].id}', WORK_PROJECTS.filter(p => p.division === '${divisionKey}'))`);
        });
        container.style.opacity = '1';
        setupReveal(container);
        initVideos(container);
    }, 180);
}

// =================================================================
// SYNERGY SELECTION (shared: services page "Add to Package" + builder)
// =================================================================
function getSelectedIds() { return storageGet(SYNERGY_STORAGE_KEY, []); }
function setSelectedIds(ids) { storageSet(SYNERGY_STORAGE_KEY, ids); updatePackageBadge(); }

function addServiceToPackage(serviceId) {
    const ids = getSelectedIds();
    const service = getAllServices().find(s => s.id === serviceId);
    if (!ids.includes(serviceId)) {
        ids.push(serviceId);
        setSelectedIds(ids);
        showToast(`${service.title} added to your package (${ids.length} selected).`);
    } else {
        showToast(`${service.title} is already in your package.`);
    }
    if (document.body.dataset.page === 'synergy') renderSynergyAccordion();
}

function updatePackageBadge() {
    const el = document.getElementById('packageCount');
    if (!el) return;
    const n = getSelectedIds().length;
    el.innerText = n;
    el.parentElement.classList.toggle('hidden', n === 0);
}

function getSynergyDiscount(divCount) {
    return { 0: 0, 1: 0, 2: 10, 3: 15, 4: 20, 5: 25 }[divCount] || 0;
}

// =================================================================
// PAGE INITIALISERS
// =================================================================
function initHome() {
    renderTabs(document.getElementById('divisionTabs'), divisionTabItems(), 'film-farm', key => switchDivision(key));
    switchDivision('film-farm');

    const workGrid = document.getElementById('homeWorkGrid');
    const featured = DIVISION_KEYS.map(k => WORK_PROJECTS.find(p => p.division === k)).concat(WORK_PROJECTS.filter(p => p.id === 'w-fa-2'));
    const renderHomeWork = (key) => {
        const list = key === 'all' ? featured : WORK_PROJECTS.filter(p => p.division === key);
        workGrid.innerHTML = list.slice(0, 6).map(workCardHTML).join('');
        workGrid.querySelectorAll('button').forEach((b, i) => b.setAttribute('onclick', `openWorkModal('${list[i].id}')`));
        workModalList = list;
        setupReveal(workGrid);
    };
    renderTabs(document.getElementById('homeWorkTabs'), [{ key: 'all', label: 'Featured' }, ...divisionTabItems()], 'all', renderHomeWork);
    renderHomeWork('all');

    renderFounderSpotlight();
    renderClientMarquee(document.getElementById('clientMarquee'));
}

function renderFounderSpotlight() {
    document.querySelectorAll('[data-founder-name]').forEach(el => el.innerText = FOUNDER.name);
    document.querySelectorAll('[data-founder-title]').forEach(el => el.innerText = FOUNDER.title);
    document.querySelectorAll('[data-founder-quote]').forEach(el => el.innerText = `“${FOUNDER.quote}”`);
    document.querySelectorAll('[data-founder-bio]').forEach(el => el.innerHTML = FOUNDER.bio.map(p => `<p>${p}</p>`).join(''));
    document.querySelectorAll('[data-founder-highlights]').forEach(el => el.innerHTML = FOUNDER.highlights.map(h => `
        <div class="glass-card rounded-xl p-4 border-charcoalBorder">
            <i class="fa-solid ${h.icon} text-armyGreenLight text-lg"></i>
            <h4 class="font-serif text-sm font-bold text-white mt-2">${h.label}</h4>
            <p class="text-[11px] text-greyMuted mt-1 leading-relaxed">${h.text}</p>
        </div>`).join(''));
    document.querySelectorAll('[data-sessions-gallery]').forEach(el => {
        el.innerHTML = sessionsGalleryHTML(+el.dataset.sessionsGallery || 0);
        setupReveal(el);
    });
}

function initAbout() {
    renderFounderSpotlight();
    renderClientGrid(document.getElementById('clientGrid'));
}

function initDivisions() {
    const initial = DIVISION_KEYS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'film-farm';
    renderTabs(document.getElementById('divisionTabs'), divisionTabItems(), initial, key => switchDivision(key));
    switchDivision(initial, { updateHash: false });
    window.addEventListener('hashchange', () => {
        const key = location.hash.slice(1);
        if (DIVISION_KEYS.includes(key)) switchDivision(key, { updateHash: false });
    });
}

function initServices() {
    const search = document.getElementById('serviceSearch');
    const filter = document.getElementById('divisionFilter');
    const fromUrl = qs('division');
    if (fromUrl && getDivisionByName(fromUrl)) filter.value = fromUrl;

    const tabs = document.getElementById('serviceTabs');
    const tabItems = [{ key: 'all', label: 'All', count: getAllServices().length },
        ...DIVISION_KEYS.map(k => ({ key: ECOSYSTEM_DIVISIONS[k].name, label: ECOSYSTEM_DIVISIONS[k].name, icon: ECOSYSTEM_DIVISIONS[k].icon, count: ECOSYSTEM_DIVISIONS[k].services.length }))];
    renderTabs(tabs, tabItems, filter.value, key => { filter.value = key; filterServices(); });

    search.addEventListener('input', filterServices);
    filter.addEventListener('change', () => { setActiveTab(tabs, filter.value); filterServices(); });
    document.getElementById('clearFilters').addEventListener('click', () => {
        search.value = ''; filter.value = 'all'; setActiveTab(tabs, 'all'); filterServices();
    });
    filterServices();
    updatePackageBadge();
}

function filterServices() {
    const searchVal = document.getElementById('serviceSearch').value.toLowerCase().trim();
    const divFilter = document.getElementById('divisionFilter').value;
    let filtered = getAllServices();
    if (divFilter !== 'all') filtered = filtered.filter(s => s.division === divFilter);
    if (searchVal) {
        filtered = filtered.filter(s => [s.title, s.shortDesc, s.fullDesc, s.division].some(t => t.toLowerCase().includes(searchVal)));
    }
    const videoSlot = document.getElementById('serviceVideos');
    if (videoSlot && videoSlot.dataset.division !== divFilter) {
        videoSlot.dataset.division = divFilter;
        releaseVideos(videoSlot);
        const key = Object.keys(ECOSYSTEM_DIVISIONS).find(k => ECOSYSTEM_DIVISIONS[k].name === divFilter);
        videoSlot.innerHTML = key ? videoShowcaseHTML(key) : '';
        initVideos(videoSlot);
    }
    const grid = document.getElementById('servicesGrid');
    document.getElementById('serviceCount').innerText = `${filtered.length} service${filtered.length === 1 ? '' : 's'}`;
    grid.innerHTML = filtered.length ? filtered.map(serviceCardHTML).join('') : `
        <div class="col-span-full py-16 text-center text-greyMuted text-sm glass-card rounded-2xl border-charcoalBorder">
            <i class="fa-solid fa-magnifying-glass text-2xl text-armyGreenLight mb-3 block"></i>
            No services match your search. <button type="button" onclick="document.getElementById('clearFilters').click()" class="text-armyGreenLight underline">Clear filters</button>
        </div>`;
    setupReveal(grid);
}

function initWork() {
    const initial = DIVISION_KEYS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'all';
    const tabItems = [{ key: 'all', label: 'All Work', count: WORK_PROJECTS.length },
        ...DIVISION_KEYS.map(k => ({ key: k, label: ECOSYSTEM_DIVISIONS[k].name, icon: ECOSYSTEM_DIVISIONS[k].icon, count: WORK_PROJECTS.filter(p => p.division === k).length }))];
    const tabs = document.getElementById('workTabs');
    renderTabs(tabs, tabItems, initial, key => renderWorkGrid(key, true));
    renderWorkGrid(initial, false);
    window.addEventListener('hashchange', () => {
        const key = location.hash.slice(1) || 'all';
        if (key === 'all' || DIVISION_KEYS.includes(key)) { setActiveTab(tabs, key); renderWorkGrid(key, false); }
    });
}

function renderWorkGrid(key, updateHash) {
    const list = key === 'all' ? WORK_PROJECTS : WORK_PROJECTS.filter(p => p.division === key);
    if (updateHash) history.replaceState(null, '', key === 'all' ? location.pathname : `#${key}`);

    const intro = document.getElementById('workIntro');
    if (intro) {
        const div = ECOSYSTEM_DIVISIONS[key];
        intro.innerHTML = div ? `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card rounded-2xl p-5 border-charcoalBorder">
                <div class="flex items-center gap-4">
                    <img src="${div.bannerImg}" alt="" class="w-14 h-14 rounded-xl object-cover flex-shrink-0">
                    <div>
                        <h3 class="font-serif text-lg font-bold text-white">${div.name}</h3>
                        <p class="text-xs text-greyMuted">${div.tagline}</p>
                    </div>
                </div>
                <a href="/divisions/#${div.id}" class="text-xs font-bold uppercase tracking-widest text-armyGreenLight hover:text-white whitespace-nowrap">About this division <i class="fa-solid fa-arrow-right"></i></a>
            </div>` : '';
    }

    const grid = document.getElementById('workGrid');
    grid.style.opacity = '0';
    setTimeout(() => {
        grid.innerHTML = list.map(workCardHTML).join('');
        grid.querySelectorAll('button').forEach((b, i) => b.setAttribute('onclick', `openWorkModal('${list[i].id}')`));
        workModalList = list;
        grid.style.opacity = '1';
        setupReveal(grid);
    }, 150);
}

// ---- Synergy builder page
function initSynergy() {
    renderSynergyAccordion();
}

function renderSynergyAccordion() {
    const accordion = document.getElementById('calculatorAccordion');
    if (!accordion) return;
    const selected = getSelectedIds();
    const openIds = Array.from(accordion.querySelectorAll('[id^="content-"]:not(.hidden)')).map(el => el.id.replace('content-', ''));
    const isOpen = (id, idx) => openIds.length ? openIds.includes(id) : idx === 0;

    accordion.innerHTML = Object.values(ECOSYSTEM_DIVISIONS).map((div, idx) => {
        const countSel = div.services.filter(s => selected.includes(s.id)).length;
        return `
        <div class="glass-panel rounded-2xl border border-charcoalBorder overflow-hidden">
            <button type="button" onclick="toggleSynergySection('${div.id}')" aria-expanded="${isOpen(div.id, idx)}" class="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-3 text-left hover:bg-white/5 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                    <img src="${div.bannerImg}" alt="" class="w-10 h-10 rounded-lg object-cover flex-shrink-0">
                    <div class="min-w-0">
                        <h4 class="font-serif font-bold text-white text-base">${div.name}</h4>
                        <span class="text-[10px] text-greyMuted uppercase tracking-wider">${div.services.length} services${countSel ? ` · <span class="text-armyGreenLight">${countSel} selected</span>` : ''}</span>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-down text-greyMuted text-xs transition-transform duration-300 ${isOpen(div.id, idx) ? 'rotate-180' : ''}" id="chevron-${div.id}"></i>
            </button>
            <div id="content-${div.id}" class="px-4 sm:px-6 py-4 border-t border-charcoalBorder space-y-3 ${isOpen(div.id, idx) ? '' : 'hidden'}">
                ${div.services.map(s => `
                    <label class="flex items-start gap-3 p-3 rounded-xl glass-card border-charcoalBorder hover:border-armyGreenBright/40 cursor-pointer transition-all select-none ${selected.includes(s.id) ? '!border-armyGreenBright/60 bg-armyGreen/10' : ''}">
                        <input type="checkbox" onchange="toggleServiceSelection('${s.id}')" ${selected.includes(s.id) ? 'checked' : ''} class="mt-1 w-4 h-4 accent-[#6E915B] flex-shrink-0">
                        <div class="flex-1 min-w-0">
                            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                                <span class="text-xs font-bold text-white">${s.title}</span>
                                <span class="text-[10px] font-mono text-armyGreenLight">from ${formatPrice(s.packages.starter, { short: true }).replace('from ', '')}</span>
                            </div>
                            <p class="text-[11px] text-greyMuted mt-0.5">${s.shortDesc}</p>
                        </div>
                    </label>`).join('')}
            </div>
        </div>`;
    }).join('');
    updateSynergySummary();
}

function toggleSynergySection(divId) {
    const content = document.getElementById(`content-${divId}`);
    const chevron = document.getElementById(`chevron-${divId}`);
    const open = content.classList.contains('hidden');
    content.classList.toggle('hidden', !open);
    chevron.classList.toggle('rotate-180', open);
    content.previousElementSibling.setAttribute('aria-expanded', String(open));
}

function toggleServiceSelection(serviceId) {
    const ids = getSelectedIds();
    const i = ids.indexOf(serviceId);
    if (i > -1) ids.splice(i, 1); else ids.push(serviceId);
    setSelectedIds(ids);
    renderSynergyAccordion();
}

function getSelectedServices() {
    const all = getAllServices();
    return getSelectedIds().map(id => all.find(s => s.id === id)).filter(Boolean);
}

function updateSynergySummary() {
    const selected = getSelectedServices();
    const listContainer = document.getElementById('selectedServicesList');
    const divCount = new Set(selected.map(s => s.division)).size;
    const discount = getSynergyDiscount(divCount);

    document.getElementById('activeDivisionsCount').innerText = `${divCount} / 5`;
    document.getElementById('activeServicesCount').innerText = `${selected.length} Service${selected.length === 1 ? '' : 's'}`;
    document.getElementById('synergyDiscountBadge').innerText = `${discount}% Discount`;
    document.getElementById('synergyDiscountVal').innerText = discount ? `-${discount}% Synergy Savings` : 'Add 2+ divisions';
    document.getElementById('estimatedTierName').innerText =
        selected.length === 0 ? 'Starter Blueprint' : selected.length < 3 ? 'Core Blueprint' : selected.length < 6 ? 'Advanced Synergy' : 'Flagship Ecosystem';

    // Discount progress meter
    const meter = document.getElementById('discountMeter');
    if (meter) meter.style.width = `${(Math.min(divCount, 5) / 5) * 100}%`;
    const hint = document.getElementById('discountHint');
    if (hint) {
        hint.innerText = divCount >= 5 ? 'Maximum 25% synergy discount unlocked!'
            : divCount < 2 ? `Add a service from ${2 - divCount} more division${2 - divCount === 1 ? '' : 's'} to unlock 10% off.`
            : `Add one more division to unlock ${getSynergyDiscount(divCount + 1)}% off.`;
    }

    listContainer.innerHTML = selected.length === 0
        ? `<p class="text-xs text-greyMuted italic text-center py-8">No services selected yet. Choose services from the divisions to assemble your custom package.</p>`
        : selected.map(s => `
            <div class="flex items-center justify-between p-2.5 rounded-lg glass-card border-charcoalBorder text-xs">
                <div class="min-w-0 pr-2">
                    <span class="block font-semibold text-white truncate">${s.title}</span>
                    <span class="text-[9px] text-greyMuted uppercase">${s.division} · from ${formatPrice(s.packages.starter, { short: true }).replace('from ', '')}</span>
                </div>
                <button type="button" onclick="toggleServiceSelection('${s.id}')" aria-label="Remove ${s.title}" class="w-8 h-8 rounded-lg text-greyMuted hover:text-rose-400 hover:bg-white/5 flex-shrink-0"><i class="fa-solid fa-xmark"></i></button>
            </div>`).join('');

    const clearBtn = document.getElementById('clearSelection');
    if (clearBtn) clearBtn.classList.toggle('hidden', selected.length === 0);
}

function clearSynergySelection() {
    setSelectedIds([]);
    renderSynergyAccordion();
    showToast('Package cleared.');
}

function openSynergyProposalModal() {
    const selected = getSelectedServices();
    if (selected.length === 0) { showToast('Please select at least 1 service to generate a proposal.'); return; }
    const divCount = new Set(selected.map(s => s.division)).size;
    document.getElementById('synModalServicesCount').innerText = `${selected.length} Items (${divCount} Division${divCount === 1 ? '' : 's'})`;
    document.getElementById('synModalDiscountText').innerText = `${getSynergyDiscount(divCount)}% Cross-Ecosystem Discount`;
    document.getElementById('synModalList').innerHTML = selected.map(s => `
        <div class="flex justify-between gap-3"><span>• ${s.title}</span><span class="text-greyMuted font-mono text-[10px] text-right">${s.division}</span></div>`).join('');
    openModal('synergyModal');
}

async function handleSynergySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type=submit]');
    const [name, email] = [form.querySelector('input[type=text]').value, form.querySelector('input[type=email]').value];
    const selected = getSelectedServices();
    const list = selected.map(s => `• ${s.title} (${s.division})`).join('\n');
    btn.disabled = true;
    try {
        await sendInquiry({
            name, email, division: 'General Ecosystem', subject: 'Synergy proposal request',
            message: `Proposal requested for:\n${list}\n\n${form.querySelector('textarea').value}`, website: ''
        });
        closeModalById('synergyModal');
        form.reset();
        showToast('Proposal request sent! A director will contact you shortly.');
    } catch (ex) {
        showToast(ex.message);
    } finally {
        btn.disabled = false;
    }
}

function checkoutSynergyPackage() {
    const selected = getSelectedServices();
    if (!selected.length) { showToast('Select at least one service to check out.'); return; }
    const items = selected.map(s => {
        const tier = ['starter', 'pro', 'enterprise'].find(k => isPayableOnline(s.packages[k]));
        return tier ? `${s.id}:${tier}` : null;
    }).filter(Boolean);
    if (!items.length) { showToast('These services are above the mobile money limit — please request a proposal instead.'); return; }
    location.href = `/checkout/?items=${items.join(',')}`;
}

// Sends a contact / proposal message through the API
async function sendInquiry(payload) {
    if (!PAYMENTS_LIVE) {
        // Email service not connected yet: open the visitor's email app with the message ready to send
        const body = `${payload.message}\n\n${payload.name}${payload.phone ? '\n' + payload.phone : ''}\n${payload.email}`;
        location.href = `mailto:${SITE.email}?subject=${encodeURIComponent((payload.subject || 'Website inquiry') + (payload.division ? ' – ' + payload.division : ''))}&body=${encodeURIComponent(body)}`;
        return { ok: true };
    }
    let res;
    try {
        res = await fetch(`${SITE.apiBase}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {
        throw new Error('We could not send your message right now.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'We could not send your message right now.');
    return data;
}

// ---- Impact page
function initImpact() {
    initCounters();
    renderFounderSpotlight();
    const hope = WORK_PROJECTS.filter(p => p.division === 'hope-foundation');
    const grid = document.getElementById('impactWorkGrid');
    grid.innerHTML = hope.map(workCardHTML).join('');
    grid.querySelectorAll('button').forEach((b, i) => b.setAttribute('onclick', `openWorkModal('${hope[i].id}', WORK_PROJECTS.filter(p => p.division === 'hope-foundation'))`));
    const programs = document.getElementById('impactPrograms');
    programs.innerHTML = ECOSYSTEM_DIVISIONS['hope-foundation'].services.map(serviceCardHTML).join('');
    renderClientGrid(document.getElementById('clientGrid'));
}

// ---- Contact page
function initContact() {
    const division = qs('division');
    const service = qs('service');
    const pkg = qs('package');
    const project = qs('project');
    const select = document.getElementById('contactDivision');
    if (division && [...select.options].some(o => o.value === division)) select.value = division;

    const message = document.getElementById('contactMessage');
    const lines = [];
    if (service) lines.push(`I'm interested in: ${service}${pkg ? ` — ${pkg} package` : ''}.`);
    if (project) lines.push(`I'd like to start a project similar to "${project}".`);
    if (lines.length) {
        message.value = lines.join('\n') + '\n\n';
        const banner = document.getElementById('contactContext');
        banner.innerHTML = `<i class="fa-solid fa-circle-info text-armyGreenLight"></i> <span>${lines.join(' ')}</span>`;
        banner.classList.remove('hidden');
        banner.classList.add('flex');
    }

    document.getElementById('contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const err = form.querySelector('[data-form-error]');
        const btn = form.querySelector('button[type=submit]');
        const f = Object.fromEntries(new FormData(form).entries());
        const fail = (m) => { err.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-2"></i>${m}`; err.classList.remove('hidden'); };
        err.classList.add('hidden');
        if (!f.name || f.name.trim().length < 2) return fail('Please enter your name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email || '')) return fail('Please enter a valid email address.');
        if (!f.message || f.message.trim().length < 5) return fail('Please tell us a little about your request.');
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="pay-spinner sm"></span> Sending…';
        try {
            await sendInquiry(f);
            form.classList.add('hidden');
            document.getElementById('contactSuccess').classList.remove('hidden');
            showToast('Message sent — we will reply within one business day.');
            form.reset();
        } catch (ex) {
            fail(`${ex.message} You can also email <a class="underline" href="mailto:${SITE.email}">${SITE.email}</a> or <a class="underline" href="${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp us</a>.`);
        } finally {
            btn.disabled = false;
            btn.innerHTML = original;
        }
    });
    document.getElementById('contactAgain').addEventListener('click', () => {
        document.getElementById('contactSuccess').classList.add('hidden');
        document.getElementById('contactForm').classList.remove('hidden');
    });

    document.querySelectorAll('.faq-item > button').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.nextElementSibling;
            const open = panel.classList.contains('hidden');
            panel.classList.toggle('hidden', !open);
            btn.setAttribute('aria-expanded', String(open));
            btn.querySelector('i').classList.toggle('rotate-45', open);
        });
    });
}

// ---- Legal page
function initLegal() {
    const keys = ['privacy', 'terms', 'grants'];
    const show = (key) => {
        keys.forEach(k => document.getElementById(`legal-${k}`).classList.toggle('hidden', k !== key));
        setActiveTab(document.getElementById('legalTabs'), key);
    };
    const tabs = document.getElementById('legalTabs');
    renderTabs(tabs, [
        { key: 'privacy', label: 'Privacy Policy', icon: 'fa-user-shield' },
        { key: 'terms', label: 'Terms of Ecosystem', icon: 'fa-file-contract' },
        { key: 'grants', label: 'Grant Transparency', icon: 'fa-scale-balanced' }
    ], 'privacy', key => { show(key); history.replaceState(null, '', `#${key}`); });
    show(keys.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'privacy');
    window.addEventListener('hashchange', () => { if (keys.includes(location.hash.slice(1))) show(location.hash.slice(1)); });
}

// =================================================================
// BOOT
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    injectModals();
    const page = document.body.dataset.page;
    const init = { home: initHome, about: initAbout, divisions: initDivisions, services: initServices, work: initWork, synergy: initSynergy, impact: initImpact, contact: initContact, legal: initLegal }[page];
    if (init) init();
    if (page !== 'impact') initCounters();
    setupReveal();
});
