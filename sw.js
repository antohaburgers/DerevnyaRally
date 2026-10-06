// Change VERSION and script URL versions together for each release.
const VERSION='0.18';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./index.html", "./game.js?v=018", "./run-state.js?v=018", "./pickups.js?v=018", "./event-audio.js?v=018", "./music.js?v=018", "./environment.js?v=018", "./scenery.js?v=018", "./animals.js?v=018", "./checkpoints.js?v=018", "./random-seed.js?v=018", "./traffic.js?v=018", "./npc-models.js?v=018", "./colliders.js?v=018", "./biomes.js?v=018", "./props.js?v=018", "./feedback.js?v=018", "./trees.js?v=018", "./road-world.js?v=018", "./visual-car.js?v=018", "./physics.js?v=018", "./gearbox.js?v=018", "./controls.js?v=018", "./cameras.js?v=018", "./obstacles.js?v=018", "./surfaces.js?v=018", "./engine-audio.js?v=018", "./browser-guard.js?v=018", "./pwa.js?v=018", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
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
