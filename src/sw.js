const APP_VERSION='1.3.1';
const CACHE=`hodnotitel-${APP_VERSION}`;
const CORE=['./','./index.html','./app.js','./access-bootstrap.js','./manifest.webmanifest','./assets/ghrab-logo.png','./icons/icon-192.png','./icons/icon-512.png','./vendor/jszip.min.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hodnotitel-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{ if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return; event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return r}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html')))); });
