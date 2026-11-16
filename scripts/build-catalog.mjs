// Copies service prices from assets/js/data.js into api/src/catalog.json
// so the payment server charges exactly what the website shows.
// Run with: npm run catalog
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8');

const sandbox = { location: { hostname: 'build' } };
vm.createContext(sandbox);
vm.runInContext(`${src}\n;globalThis.__out = { ECOSYSTEM_DIVISIONS, SITE };`, sandbox);
const { ECOSYSTEM_DIVISIONS, SITE } = sandbox.__out;

const services = {};
for (const div of Object.values(ECOSYSTEM_DIVISIONS)) {
    for (const s of div.services) {
        services[s.id] = {
            title: s.title,
            division: s.division,
            tiers: Object.fromEntries(Object.entries(s.packages).map(([key, p]) => [key, {
                name: p.name,
                price: p.price,
                unit: p.unit || null,
                payable: p.payable !== false && p.price > 0
            }]))
        };
    }
}

const out = path.join(root, 'api/src/catalog.json');
fs.writeFileSync(out, JSON.stringify({ generatedFrom: 'assets/js/data.js', onlineLimit: SITE.onlineLimit, services }, null, 2) + '\n');
console.log(`Wrote ${Object.keys(services).length} services to api/src/catalog.json`);
