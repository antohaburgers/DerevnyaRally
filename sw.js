// Change VERSION and script URL versions together for each release.
const VERSION='0.19';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./index.html", "./game.js?v=019", "./run-state.js?v=019", "./mechanical.js?v=019", "./pickups.js?v=019", "./event-audio.js?v=019", "./music.js?v=019", "./environment.js?v=019", "./scenery.js?v=019", "./animals.js?v=019", "./checkpoints.js?v=019", "./random-seed.js?v=019", "./traffic.js?v=019", "./npc-models.js?v=019", "./colliders.js?v=019", "./biomes.js?v=019", "./props.js?v=019", "./feedback.js?v=019", "./trees.js?v=019", "./road-world.js?v=019", "./visual-car.js?v=019", "./physics.js?v=019", "./gearbox.js?v=019", "./controls.js?v=019", "./cameras.js?v=019", "./obstacles.js?v=019", "./surfaces.js?v=019", "./engine-audio.js?v=019", "./browser-guard.js?v=019", "./pwa.js?v=019", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
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
