const APP_VERSION='1.3.7';
const CACHE=`hodnotitel-${APP_VERSION}`;
const CORE=['./','./index.html','./app.js','./access-bootstrap.js','./access-gate.css','./manifest.webmanifest','./manual/','./manual/index.html','./assets/ghrab-logo.png','./icons/hodnotitel-shield-20260711-32.png','./icons/hodnotitel-shield-20260711-180.png','./icons/hodnotitel-shield-20260711-192.png','./icons/hodnotitel-shield-20260711-512.png','./icons/hodnotitel-shield-20260711-maskable-512.png','./vendor/jszip.min.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hodnotitel-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return response;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;})));
});
