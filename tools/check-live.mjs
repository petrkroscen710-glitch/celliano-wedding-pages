const base='https://celliano.cz';
const pages=[
  ['/', 'cello · piano'],
  ['/o-nas/', 'Když se potká piano s violoncellem'],
  ['/svatby/', 'Živá hudba pro svatby'],
  ['/firemni-akce/', 'Hudba, která dává akci úroveň'],
  ['/ukazky/', 'Ukázky'],
  ['/reference/', 'Vaše chvíle. Vaše slova.'],
  ['/co-hrajeme/', 'Náš repertoár'],
  ['/akce/', 'Kde nás můžete slyšet'],
  ['/kontakt/', 'Poptávkový formulář']
];

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const bodies=new Map();

for(const [route,marker] of pages){
  try{
    const res=await fetch(base+route,{headers:{'user-agent':'CellianoDeployCheck/1.0','cache-control':'no-cache'}});
    const body=await res.text();
    bodies.set(route,body);
    if(res.status!==200) fail(route+' HTTP '+res.status);
    if(!body.includes(marker)) fail(route+' missing marker');
    console.log(route,'HTTP',res.status,'marker',body.includes(marker)?'OK':'MISSING');
  }catch(e){fail(route+' fetch error '+e.name)}
}

for(const [asset,min] of [
  ['/assets/celliano-home-duo-cutout.webp',100000],
  ['/assets/celliano-duo-wedding-cutout.png',1000000]
]){
  try{
    const res=await fetch(base+asset,{headers:{'user-agent':'CellianoDeployCheck/1.0'}});
    const buf=await res.arrayBuffer();
    if(res.status!==200) fail(asset+' HTTP '+res.status);
    if(buf.byteLength<min) fail(asset+' too small: '+buf.byteLength);
    console.log(asset,'HTTP',res.status,'bytes',buf.byteLength);
  }catch(e){fail(asset+' fetch error '+e.name)}
}

try{
  const res=await fetch(base+'/api/poptavka.php',{redirect:'manual',headers:{'user-agent':'CellianoDeployCheck/1.0'}});
  if(res.status!==405) fail('/api/poptavka.php expected 405 for GET, got '+res.status);
  console.log('/api/poptavka.php GET',res.status);
}catch(e){fail('contact endpoint fetch error '+e.name)}

try{
  const html=bodies.get('/co-hrajeme/')||'';
  const m=html.match(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/);
  if(!m) fail('repertoire Apps Script URL not found');
  else{
    const res=await fetch(m[0],{redirect:'follow',headers:{'user-agent':'CellianoDeployCheck/1.0'}});
    if(!res.ok) fail('repertoire data HTTP '+res.status);
    else console.log('repertoire data source HTTP',res.status);
  }
}catch(e){fail('repertoire source check '+e.name)}

try{
  const html=bodies.get('/akce/')||'';
  const urlm=html.match(/https:\/\/[A-Za-z0-9-]+\.supabase\.co\/rest\/v1\/[A-Za-z0-9_?=&.,-]+/);
  const keym=html.match(/sb_publishable_[A-Za-z0-9_-]+/);
  if(!urlm||!keym) fail('events Supabase public source not found');
  else{
    const res=await fetch(urlm[0],{headers:{apikey:keym[0],Authorization:'Bearer '+keym[0],Accept:'application/json'}});
    if(!res.ok) fail('events data HTTP '+res.status);
    else{
      const data=await res.json();
      if(!Array.isArray(data)) fail('events data is not an array');
      console.log('events data source HTTP',res.status,'rows',Array.isArray(data)?data.length:'?');
    }
  }
}catch(e){fail('events source check '+e.name)}

try{
  const res=await fetch(base+'/DEPLOYED_FROM.txt',{headers:{'user-agent':'CellianoDeployCheck/1.0','cache-control':'no-cache'}});
  if(res.status===200){
    const text=(await res.text()).trim();
    console.log('Git-managed production marker present:',text.slice(0,120));
  }else{
    console.log('Git-managed production marker not live yet (expected before Hostinger Git cutover): HTTP',res.status);
  }
}catch(e){
  console.log('Production marker check skipped:',e.name);
}

if(failed) process.exit(1);
console.log('Live Celliano smoke/dependency check passed.');
