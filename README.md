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
| Contact | `contact.html` | Contact details, form (pre-filled from service/work buttons), FAQ |
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

- The contact and proposal forms are front-end only (they show a confirmation). Connect them to a form service (e.g. Formspree, Netlify Forms) or your backend before launch.
- `assets/images/director:sessions/` holds the original full-size photos (3–8 MB each). The site uses the optimised copies in `assets/images/team/`, so that folder does not need to be uploaded.
