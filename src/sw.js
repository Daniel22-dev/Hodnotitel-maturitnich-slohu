const GHRAB_SW_CONTRACT='ghrab-service-worker-v1';
const APP_VERSION = '__APP_VERSION__';
const CACHE = "ghrab-essay-evaluator-v__APP_VERSION__";
const CACHE_PREFIXES=["ghrab-essay-evaluator-v","hodnotitel-"];

const CORE = [
"./",
"./index.html",
"./app.js",
"./access-gate.css",
"./manifest.webmanifest",
"./access/access-gate.css",
"./access/error-reporter.css",
"./manual/index.html",
"./manual/manual.js",
"./assets/brand/school-logo.png",
"./icons/hodnotitel-shield-20260711-32.png",
"./icons/hodnotitel-shield-20260711-180.png",
"./icons/hodnotitel-shield-20260711-192.png",
"./icons/hodnotitel-shield-20260711-512.png",
"./icons/hodnotitel-shield-20260711-maskable-512.png",
"./vendor/jszip.min.js",
"./config/brand-manifest.json",
"./config/platform-manifest.json"
];

self.addEventListener('message',event=>{if(['GHRAB_SKIP_WAITING','SKIP_WAITING'].includes(event.data?.type))self.skipWaiting()});

self.addEventListener('install', (event) => {
event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(CORE);
})());
});

self.addEventListener('activate', (event) => {
event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys
    .filter((key) => CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)) && key !== CACHE)
    .map((key) => caches.delete(key)));
  await self.clients.claim();
})());
});

async function networkFirst(request, fallbackUrl = '') {
const cache = await caches.open(CACHE);
try {
  const response = await fetch(request, { cache: 'no-store' });
  if (!response || !response.ok) throw new Error(`HTTP ${response?.status || 0}`);
  await cache.put(request, response.clone());
  return response;
} catch (error) {
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  if (fallbackUrl) {
    const fallback = await cache.match(fallbackUrl, { ignoreSearch: true });
    if (fallback) return fallback;
  }
  throw error;
}
}

async function cacheFirst(request){
const cache=await caches.open(CACHE),cached=await cache.match(request);
if(cached)return cached;
const response=await fetch(request);
if(response?.ok&&response.status!==206){try{await cache.put(request,response.clone())}catch{}}
return response;
}
const normalizedAssetPath=value=>String(value||'').replace(/^\.\//,'');
const CACHEABLE_STATIC_PATHS=new Set(CORE.map(normalizedAssetPath));
function isCacheableStaticRequest(url,scopePath){
const relative=url.pathname.slice(scopePath.length);
return CACHEABLE_STATIC_PATHS.has(relative)||(typeof GHRAB_PLATFORM_P3_ASSETS!=='undefined'&&Array.isArray(GHRAB_PLATFORM_P3_ASSETS)&&GHRAB_PLATFORM_P3_ASSETS.some(asset=>normalizedAssetPath(asset)===relative));
}

function isSecurityCriticalRequest(url, scopePath){const relative=url.pathname.slice(scopePath.length); return relative === 'access-bootstrap.js'||relative === 'access/deployment-config.js'||relative === 'access/deployment-baked.js'||relative === 'access/suite-session-cleanup.js'||relative === 'access/reporter-bootstrap.js'||relative === 'access/error-reporter.js'||relative === 'access/error-reporter-adapter.js'||relative === 'manual/manual-access-bootstrap.js'||relative === 'ghrab/ghrab-platform.js'||relative === 'ghrab-platform.consumer.json'||relative === 'config/deployment.json'||relative === 'release-integrity.json'||relative === 'release-integrity.sig';}
async function networkOnlyNoStore(request){return fetch(request,{cache: 'no-store', credentials: 'same-origin'});}  function isRuntimeBypassRequest(url, scopePath){const relative=url.pathname.slice(scopePath.length); return relative === 'runtime-config.js'||relative === 'config/deployment.school-server-p0.json'||relative === 'config/deployment.school-server.example.json'||/^(?:api|auth|session|health)(?:\/|$)/.test(relative);}
self.addEventListener('fetch', (event) => {
const request = event.request;
if (request.method !== 'GET') return;
const url = new URL(request.url);
if (url.origin !== self.location.origin) return;
const scopePath = new URL('./', self.location.href).pathname;
if (!url.pathname.startsWith(scopePath) || request.cache === 'no-store') return;

if (isSecurityCriticalRequest(url, scopePath)) {
  event.respondWith(networkOnlyNoStore(request));
  return;
}
if (isRuntimeBypassRequest(url, scopePath)) return;

if (request.mode === 'navigate') {
  const relative=url.pathname.slice(scopePath.length);
  if(!['','index.html','manual/','manual/index.html'].includes(relative)){event.respondWith(networkOnlyNoStore(request));return;}
  const fallback = relative.startsWith('manual/') ? './manual/index.html' : './index.html';
  event.respondWith(networkFirst(request, fallback));
  return;
}
if (url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/build-info.json')) {
  event.respondWith(networkFirst(request));
  return;
}
event.respondWith(isCacheableStaticRequest(url,scopePath)?cacheFirst(request):networkOnlyNoStore(request));
});
