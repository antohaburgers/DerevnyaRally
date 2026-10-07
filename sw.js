// Change VERSION and script URL versions together for each release.
const VERSION='0.22';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./index.html", "./game.js?v=022", "./run-state.js?v=022", "./mechanical.js?v=022", "./pickups.js?v=022", "./event-audio.js?v=022", "./music.js?v=022", "./environment.js?v=022", "./scenery.js?v=022", "./animals.js?v=022", "./farmers.js?v=022", "./circuit-world.js?v=022", "./race.js?v=022", "./race-decor.js?v=022", "./checkpoints.js?v=022", "./random-seed.js?v=022", "./traffic.js?v=022", "./npc-models.js?v=022", "./colliders.js?v=022", "./biomes.js?v=022", "./props.js?v=022", "./feedback.js?v=022", "./trees.js?v=022", "./road-world.js?v=022", "./visual-car.js?v=022", "./physics.js?v=022", "./gearbox.js?v=022", "./controls.js?v=022", "./cameras.js?v=022", "./obstacles.js?v=022", "./surfaces.js?v=022", "./engine-audio.js?v=022", "./browser-guard.js?v=022", "./pwa.js?v=022", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
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
