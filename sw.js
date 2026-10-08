// Online code is network-first so future script-only changes need no service-worker release.
const VERSION='0.29-refresh-menu';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./race-labels.js?v=028","./qol-controls.js?v=028","./performance.js?v=028","./index.html", "./game.js?v=029", "./run-state.js?v=028", "./mechanical.js?v=028", "./pickups.js?v=028", "./event-audio.js?v=028", "./music.js?v=028", "./environment.js?v=028", "./scenery.js?v=028", "./animals.js?v=028", "./farmers.js?v=028", "./circuit-world.js?v=028", "./race.js?v=028", "./race-decor.js?v=028", "./sprint-world.js?v=028", "./checkpoints.js?v=028", "./random-seed.js?v=028", "./traffic.js?v=028", "./npc-models.js?v=028", "./colliders.js?v=028", "./biomes.js?v=028", "./props.js?v=028", "./feedback.js?v=028", "./trees.js?v=028", "./road-world.js?v=028", "./visual-car.js?v=028", "./physics.js?v=028", "./gearbox.js?v=028", "./controls.js?v=028", "./cameras.js?v=028", "./obstacles.js?v=028", "./surfaces.js?v=028", "./engine-audio.js?v=028", "./browser-guard.js?v=028", "./pwa.js?v=029", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
const ROOT=new URL('./',self.location.href);
const SHELL=new URL('./index.html',ROOT).href;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);await self.skipWaiting();})());
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
 // Check online for fresh scripts, but retain the cached copy for offline play.
 if(request.mode==='navigate'||/\.js$/i.test(url.pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE),key=request.mode==='navigate'?SHELL:request;
   try{
    const fresh=await fetch(request,{cache:'no-store'});
    if(fresh.ok)await cache.put(key,fresh.clone());
    return fresh;
   }catch{return(await cache.match(key))||Response.error();}
  })());
  return;
 }
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});
