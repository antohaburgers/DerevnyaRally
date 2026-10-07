// Change VERSION and script URL versions together for each release.
const VERSION='0.25';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./qol-controls.js?v=025","./performance.js?v=025","./index.html", "./game.js?v=025", "./run-state.js?v=025", "./mechanical.js?v=025", "./pickups.js?v=025", "./event-audio.js?v=025", "./music.js?v=025", "./environment.js?v=025", "./scenery.js?v=025", "./animals.js?v=025", "./farmers.js?v=025", "./circuit-world.js?v=025", "./race.js?v=025", "./race-decor.js?v=025", "./sprint-world.js?v=025", "./checkpoints.js?v=025", "./random-seed.js?v=025", "./traffic.js?v=025", "./npc-models.js?v=025", "./colliders.js?v=025", "./biomes.js?v=025", "./props.js?v=025", "./feedback.js?v=025", "./trees.js?v=025", "./road-world.js?v=025", "./visual-car.js?v=025", "./physics.js?v=025", "./gearbox.js?v=025", "./controls.js?v=025", "./cameras.js?v=025", "./obstacles.js?v=025", "./surfaces.js?v=025", "./engine-audio.js?v=025", "./browser-guard.js?v=025", "./pwa.js?v=025", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
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
 if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(request.method==='HEAD'&&/\.mp3$/i.test(url.pathname)){event.respondWith(caches.open(CACHE).then(async cache=>{try{return await fetch(request);}catch{const cached=await cache.match(request.url);return new Response(null,{status:cached?200:404,headers:cached?.headers});}}));return;}
 if(request.method!=='GET')return;
 // Optional MP3 files never block installation; cache successful full responses only.
 if(/\.mp3$/i.test(url.pathname)){event.respondWith(caches.open(CACHE).then(async cache=>{try{const response=await fetch(request);if(response.status===200&&!request.headers?.get('range'))await cache.put(request,response.clone());return response;}catch{return(await cache.match(request))||new Response('',{status:404});}}));return;}
 if(request.mode==='navigate'){
  // Serve a consistent cached build; sw.js controls build upgrades.
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(SHELL))||fetch(request)));
  return;
 }
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});
