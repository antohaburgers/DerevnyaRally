// Change VERSION and script URL versions together for each release.
const VERSION='0.26';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./race-labels.js?v=026","./figure-eight.js?v=026","./qol-controls.js?v=026","./performance.js?v=026","./index.html", "./game.js?v=026", "./run-state.js?v=026", "./mechanical.js?v=026", "./pickups.js?v=026", "./event-audio.js?v=026", "./music.js?v=026", "./environment.js?v=026", "./scenery.js?v=026", "./animals.js?v=026", "./farmers.js?v=026", "./circuit-world.js?v=026", "./race.js?v=026", "./race-decor.js?v=026", "./sprint-world.js?v=026", "./checkpoints.js?v=026", "./random-seed.js?v=026", "./traffic.js?v=026", "./npc-models.js?v=026", "./colliders.js?v=026", "./biomes.js?v=026", "./props.js?v=026", "./feedback.js?v=026", "./trees.js?v=026", "./road-world.js?v=026", "./visual-car.js?v=026", "./physics.js?v=026", "./gearbox.js?v=026", "./controls.js?v=026", "./cameras.js?v=026", "./obstacles.js?v=026", "./surfaces.js?v=026", "./engine-audio.js?v=026", "./browser-guard.js?v=026", "./pwa.js?v=026", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
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
