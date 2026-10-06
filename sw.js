// Change VERSION and script URL versions together for each release.
const VERSION='0.17';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./index.html", "./game.js?v=017", "./run-state.js?v=017", "./pickups.js?v=017", "./event-audio.js?v=017", "./music.js?v=017", "./environment.js?v=017", "./animals.js?v=017", "./checkpoints.js?v=017", "./random-seed.js?v=017", "./traffic.js?v=017", "./npc-models.js?v=017", "./colliders.js?v=017", "./biomes.js?v=017", "./props.js?v=017", "./feedback.js?v=017", "./trees.js?v=017", "./road-world.js?v=017", "./visual-car.js?v=017", "./physics.js?v=017", "./gearbox.js?v=017", "./controls.js?v=017", "./cameras.js?v=017", "./obstacles.js?v=017", "./surfaces.js?v=017", "./engine-audio.js?v=017", "./browser-guard.js?v=017", "./pwa.js?v=017", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
const ROOT=new URL('./',self.location.href);
const SHELL=new URL('./index.html',ROOT).href;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
 // No skipWaiting: new builds activate after old game tabs close.
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 // Optional MP3 files never block installation; cache successful full responses only.
 if(/\.mp3$/i.test(url.pathname)){event.respondWith(caches.open(CACHE).then(async cache=>{try{const response=await fetch(request);if(response.status===200&&!request.headers?.get('range'))await cache.put(request,response.clone());return response;}catch{return(await cache.match(request))||new Response('',{status:404});}}));return;}
 if(request.mode==='navigate'){
  // Serve a consistent cached build; sw.js controls build upgrades.
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(SHELL))||fetch(request)));
  return;
 }
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});
