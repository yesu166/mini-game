const CACHE_NAME='block-bloom-shell-v3';
const SHELL=['/','/index.html','/manifest.webmanifest','/icon.svg'];
const APP_SHELL_PATHS=new Set(['/','/index.html','/sw.js']);
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));
 self.clients.claim();
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 const url=new URL(request.url);
 if(request.mode==='navigate'||APP_SHELL_PATHS.has(url.pathname)){
  event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{
   if(response.ok){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)));
   }
   return response;
  }).catch(()=>caches.match(request).then(cached=>cached||caches.match('/index.html'))));
  return;
 }
 if(url.pathname.startsWith('/assets/')){
  event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
   const cached=await cache.match(request);
   if(cached)return cached;
   const response=await fetch(request);
   if(response.ok)await cache.put(request,response.clone());
   return response;
  }));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
  if(response.ok&&response.type==='basic'){
   const copy=response.clone();
   event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)));
  }
  return response;
 })));
});
