import fs from 'node:fs';
import path from 'node:path';

const root=process.argv[2]||'_production';
const pages=[
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
const routes=new Set(['/','/o-nas/','/svatby/','/firemni-akce/','/ukazky/','/reference/','/co-hrajeme/','/akce/','/kontakt/']);
let bad=false;
const fail=m=>{bad=true;console.error('FAIL:',m)};

for(const rel of pages){
  const file=path.join(root,rel);
  if(!fs.existsSync(file)){fail('missing '+rel);continue}
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('<meta name="robots" content="index,follow">')) fail(rel+': not indexable');
  if(html.includes('github.io')) fail(rel+': staging rewrite leaked into production');
  if(/src=["']https:\/\/celliano\.cz\/assets\//.test(html)) fail(rel+': live-site asset dependency remains');
  const re=/href=["'](\/[^"'?#]*\/?)(?:[?#][^"']*)?["']/g;
  let m;
  while((m=re.exec(html))){
    const href=m[1];
    if(href.startsWith('/assets/')||href.startsWith('/api/')) continue;
    if(!routes.has(href)) fail(rel+': unknown internal route '+href);
  }
}
const contact=fs.readFileSync(path.join(root,'kontakt/index.html'),'utf8');
if(!contact.includes('action="/api/poptavka.php"')) fail('contact form is not same-origin');
for(const rel of ['.htaccess','api/poptavka.php','sitemap.xml','robots.txt','assets/celliano-home-duo-cutout.webp','assets/celliano-duo-wedding-cutout.png']){
  if(!fs.existsSync(path.join(root,rel))) fail('missing '+rel);
}
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
if(robots.includes('Disallow: /\n')) fail('production robots blocks the whole site');
if(bad) process.exit(1);
console.log('Production package checks passed.');
