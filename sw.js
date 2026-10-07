// Change VERSION and script URL versions together for each release.
const VERSION='0.27';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./flat-arena.js?v=027","./race-labels.js?v=027","./figure-eight.js?v=027","./qol-controls.js?v=027","./performance.js?v=027","./index.html", "./game.js?v=027", "./run-state.js?v=027", "./mechanical.js?v=027", "./pickups.js?v=027", "./event-audio.js?v=027", "./music.js?v=027", "./environment.js?v=027", "./scenery.js?v=027", "./animals.js?v=027", "./farmers.js?v=027", "./circuit-world.js?v=027", "./race.js?v=027", "./race-decor.js?v=027", "./sprint-world.js?v=027", "./checkpoints.js?v=027", "./random-seed.js?v=027", "./traffic.js?v=027", "./npc-models.js?v=027", "./colliders.js?v=027", "./biomes.js?v=027", "./props.js?v=027", "./feedback.js?v=027", "./trees.js?v=027", "./road-world.js?v=027", "./visual-car.js?v=027", "./physics.js?v=027", "./gearbox.js?v=027", "./controls.js?v=027", "./cameras.js?v=027", "./obstacles.js?v=027", "./surfaces.js?v=027", "./engine-audio.js?v=027", "./browser-guard.js?v=027", "./pwa.js?v=027", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
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
