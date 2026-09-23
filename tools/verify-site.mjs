import fs from 'node:fs';
import path from 'node:path';

const pages = [
  'index.html',
  'o-nas/index.html',
  'svatby/index.html',
  'firemni-akce/index.html',
  'ukazky/index.html',
  'reference/index.html',
  'co-hrajeme/index.html',
  'akce/index.html',
  'kontakt/index.html'
];

const routes = new Set([
  '/',
  '/o-nas/',
  '/svatby/',
  '/firemni-akce/',
  '/ukazky/',
  '/reference/',
  '/co-hrajeme/',
  '/akce/',
  '/kontakt/'
]);

let failed = false;
const fail = msg => { failed = true; console.error('FAIL:', msg); };

for (const file of pages) {
  if (!fs.existsSync(file)) { fail(`Missing page: ${file}`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('<meta name="robots" content="noindex,nofollow">')) {
    fail(`${file}: staging must remain noindex,nofollow until production cutover`);
  }
  if (!html.includes('site-brand-version')) fail(`${file}: missing Celliano brand marker`);
  for (const m of html.matchAll(/href=["'](\/[^"'?#]*\/?)(?:[?#][^"']*)?["']/g)) {
    const href = m[1];
    if (href.startsWith('/assets/') || href.startsWith('/api/')) continue;
    if (!routes.has(href)) fail(`${file}: unknown internal route ${href}`);
  }
  if (/src=["']\/assets\//.test(html)) fail(`${file}: unresolved root-local asset reference`);
}

for (const required of ['api/poptavka.php', '.htaccess', 'sitemap.xml', 'robots.txt']) {
  if (!fs.existsSync(required)) fail(`Missing production support file: ${required}`);
}

const contact = fs.readFileSync('kontakt/index.html','utf8');
if (!contact.includes('https://celliano.cz/api/poptavka.php')) {
  fail('kontakt/index.html: enquiry form is not wired to the current Celliano endpoint');
}

const events = fs.readFileSync('akce/index.html','utf8');
if (!events.includes('supabase.co/rest/v1/')) fail('akce/index.html: public events data source missing');

const repertoire = fs.readFileSync('co-hrajeme/index.html','utf8');
if (!repertoire.includes('script.google.com/macros/s/')) fail('co-hrajeme/index.html: repertoire data source missing');

if (failed) process.exit(1);
console.log('Celliano staging checks passed for all 9 public pages.');
