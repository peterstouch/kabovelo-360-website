# KABOVELO 360 Website

A static multi-page website built with Tailwind CSS and vanilla JavaScript.

## Pages

| Page | File | What it shows |
| --- | --- | --- |
| Home | `index.html` | Hero, division tabs, founder spotlight, featured work tabs, client logos, impact counters |
| About | `about.html` | Story, mission, founder profile, teaching-session gallery, client logos |
| Divisions | `divisions.html` | Tabbed view of all 5 divisions with services, demo work and (Film Academy) founder teaching photos. Deep-link with `divisions.html#film-academy` |
| Services | `services.html` | Searchable catalog with tier modals. Filter by link: `services.html?division=Film%20Farm` |
| Our Work | `work.html` | Demo case studies, one tab per division. Deep-link with `work.html#fashion-avenue` |
| Synergy Builder | `synergy.html` | Multi-division package builder with discounts |
| Impact | `impact.html` | Counters, Hope Foundation stories & programs, partners |
| Contact | `contact.html` | Contact details, form (sent to admin@ by email), FAQ |
| Enroll | `enroll.html` | Film Academy online enrollment: course, level, intake, student details, mobile money payment |
| Checkout | `checkout.html` | Book & pay for services/packages with mobile money (`checkout.html?items=ff-1:starter,ml-4:starter:2`) |
| Legal | `legal.html` | Privacy / Terms / Grant Transparency tabs (`#privacy`, `#terms`, `#grants`) |

## Project structure

- `assets/js/layout.js` — shared header, footer, page loader, page transitions, toast, modals, broken-image fallback
- `assets/js/data.js` — **all content**: divisions & services, founder profile, client logos, demo work projects
- `assets/js/main.js` — page logic (tabs, modals, filters, synergy builder, contact form)
- `src/input.css` — Tailwind source + custom styles (loader, marquee, animations)
- `assets/css/styles.css` — generated stylesheet (do not edit by hand)
- `assets/images/` — `team/` (founder & teaching photos, web-optimised), `clients/` (logos), `stock/` (local copies of stock photos), division banners

## Editing content

- **Founder name & bio:** edit `FOUNDER` in `assets/js/data.js`
- **Demo work → real work:** edit `WORK_PROJECTS` in `assets/js/data.js` (same fields; pages update automatically)
- **Client logos:** add the file to `assets/images/clients/` and an entry to `CLIENTS`
- **Navigation / social links:** `NAV_LINKS` and `SOCIAL_LINKS` at the top of `assets/js/layout.js`

Use simple file names for images (lowercase, dashes, no spaces or `:`).

## Start locally

```bash
npm install
npm run build
npm start
```

Then open: http://localhost:8000

## Rebuild Tailwind after edits

```bash
npm run build      # once
npm run watch      # live while editing
```

## Notes

- `assets/images/director:sessions/` holds the original full-size photos (3–8 MB each). The site uses the optimised copies in `assets/images/team/`, so that folder does not need to be uploaded.

## Online payments (Lipila mobile money)

The website (GitHub Pages) talks to a small API in `api/` that runs on **Cloudflare Workers**.
It creates the mobile money request with **Lipila**, stores orders in **Cloudflare D1**, and emails
receipts and admin alerts through **Resend** from admin@kabovelo360.co.zm.

Flow: customer fills the form → API prices the order from `api/src/catalog.json` → Lipila sends a PIN
prompt to the customer's phone (MTN / Airtel / Zamtel) → the page checks the status every few seconds →
on success the customer sees a receipt and gets an email with the purchase details and instructions to
send their Proof of Payment (POP) to admin@kabovelo360.co.zm.

### Prices

Prices live in `assets/js/data.js` (Kwacha). After editing them run `npm run build` — this also
regenerates `api/src/catalog.json`, which the API uses — then redeploy the API (`cd api && npm run deploy`).
Payments above `SITE.onlineLimit` / `ONLINE_LIMIT` (K150,000) show "Request Quote" instead of "Pay".

### Run locally

```bash
npm run build
cd api && npm install && npm run db:init && npm run dev   # API on http://localhost:8787 (test mode)
npm start                                                   # in another terminal, site on http://localhost:8000
```

In test mode no real money moves. Test numbers: `0977000002` fails, `0977000003` stays pending,
any other valid number succeeds after ~8 seconds.

### Go live

1. `cd api && npx wrangler login`
2. `npx wrangler d1 create kabovelo-orders` → put the `database_id` into `api/wrangler.toml`
3. `npm run db:init:remote`
4. `npm run deploy` → note the URL (e.g. `https://kabovelo-api.<you>.workers.dev`) and put it in
   `API_PUBLIC_URL` (wrangler.toml) and `SITE.apiBase` (assets/js/data.js)
5. Secrets: `npx wrangler secret put RESEND_API_KEY`, then (after signing up with Lipila)
   `npx wrangler secret put LIPILA_API_KEY` and set `LIPILA_MODE` to `sandbox`, later `live`
6. Lipila dashboard: callback URL = `<API URL>/api/webhooks/lipila`
7. Resend: verify the domain kabovelo360.co.zm (add the DNS records Resend shows at Infratel)

Useful: `npm run orders` (latest orders), `npm run logs` (live API logs).
