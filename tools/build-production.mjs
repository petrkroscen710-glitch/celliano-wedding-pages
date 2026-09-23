import fs from 'node:fs';
import path from 'node:path';

const pages = [
  "index.html",
  "o-nas/index.html",
  "svatby/index.html",
  "firemni-akce/index.html",
  "ukazky/index.html",
  "reference/index.html",
  "co-hrajeme/index.html",
  "akce/index.html",
  "kontakt/index.html"
];
const out = '_production';
const navFix = `<script>
(function(){
  if (!location.hostname.endsWith('.github.io')) return;
  const prefix='/celliano-wedding-pages';
  document.querySelectorAll('a[href^="/"]').forEach(function(a){
    const href=a.getAttribute('href');
    if (!href || href.startsWith('//')) return;
    a.setAttribute('href', prefix + href);
  });
})();
</script>`;

fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

function write(rel, content){
  const dest=path.join(out,rel);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,content);
}

for(const file of pages){
  let html=fs.readFileSync(file,'utf8')
    .replace('<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="index,follow">')
    .replaceAll('src="https://celliano.cz/assets/','src="/assets/')
    .replace(navFix,'');
  if(file==='kontakt/index.html'){
    html=html
      .replace('action="https://celliano.cz/api/poptavka.php" data-celliano-live-form="1"','action="/api/poptavka.php"')
      .replace(/<!-- STAGING_CONTACT_FALLBACK_START -->[\s\S]*?<!-- STAGING_CONTACT_FALLBACK_END -->/,'');
  }
  write(file,html);
}

for(const rel of [
  '.htaccess',
  'api/poptavka.php',
  'sitemap.xml',
  'assets/celliano-home-duo-cutout.webp',
  'assets/celliano-duo-wedding-cutout.png',
  'assets/celliano-about-duo-original-cutout.png',
  'assets/celliano-about-duo-original-cutout-v2.png'
]){
  const dest=path.join(out,rel);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(rel,dest);
}

write('robots.txt',`User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://celliano.cz/sitemap.xml
`);

write('DEPLOYED_FROM.txt',`Generated from Celliano GitHub main branch.
Do not edit production files manually; edit main and let the promotion workflow publish them.
`);

console.log('Built production package in '+out);
