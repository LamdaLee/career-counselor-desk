import {readdir,writeFile} from 'node:fs/promises';
async function files(dir,prefix=''){let out=[];for(const item of await readdir(dir,{withFileTypes:true})){if(item.name==='classic'||item.name==='sw.js')continue;const name=prefix+item.name;if(item.isDirectory())out.push(...await files(dir+'/'+item.name,name+'/'));else out.push('./'+name)}return out}
const list=['./',...await files('dist')];
await writeFile('dist/sw.js',`const PREFIX='career-counselor-desk-';const CACHE=PREFIX+'v13';const FILES=${JSON.stringify(list)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!FILES.some(f=>new URL(f,self.registration.scope).href===e.request.url))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return r}).catch(()=>caches.match(e.request)))})`);
