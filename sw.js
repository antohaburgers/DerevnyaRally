// Online code is network-first so future script-only changes need no service-worker release.
const VERSION='0.61-forest-tuning-navigation';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./animals.js?v=028", "./apple-touch-icon.png", "./assets/liveries/anime.svg", "./assets/liveries/beer.svg", "./assets/liveries/cyber.svg", "./assets/liveries/expedition.svg", "./assets/liveries/mud.svg", "./assets/liveries/night.svg", "./assets/liveries/schnauzer.svg", "./assets/liveries/soviet.svg", "./assets/liveries/tractor.svg", "./assets/liveries/wolf.svg", "./biomes.js?v=028", "./browser-guard.js?v=047", "./cameras.js?v=028", "./checkpoints.js?v=028", "./circuit-world.js?v=028", "./colliders.js?v=028", "./controls.js?v=028", "./engine-audio.js?v=037", "./environment.js?v=028", "./event-audio.js?v=055", "./expedition-map.js?v=061", "./expedition-session.js?v=061", "./expedition-systems.js?v=060", "./expedition-terrain.js?v=061", "./expedition-world.js?v=061", "./farmers.js?v=028", "./feedback.js?v=028", "./feedback.js?v=056", "./game.js?v=061", "./garage.js?v=055", "./gearbox.js?v=037", "./icon-192.png", "./icon-512.png", "./index.html", "./livery-renderer.js?v=033", "./livery-system.js?v=033", "./manifest.webmanifest", "./mechanical.js?v=056", "./music.js?v=028", "./npc-models.js?v=028", "./obstacles.js?v=042", "./performance.js?v=028", "./physics.js?v=028", "./physics.js?v=055", "./physics.js?v=061", "./pickups.js?v=028", "./props.js?v=028", "./pwa.js?v=061", "./qol-controls.js?v=055", "./race-decor.js?v=028", "./race-labels.js?v=028", "./race.js?v=059", "./random-seed.js?v=028", "./road-world.js?v=028", "./road-world.js?v=055", "./run-state.js?v=028", "./run-state.js?v=060", "./scenery.js?v=028", "./sprint-world.js?v=028", "./surfaces.js?v=028", "./surfaces.js?v=048", "./traffic.js?v=028", "./trees.js?v=028", "./visual-car.js?v=028"];
const ROOT=new URL('./',self.location.href);
const SHELL=new URL('./index.html',ROOT).href;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.all(ASSETS.map(async asset=>{try{await cache.add(asset);}catch(error){console.warn("PWA optional asset skipped:",asset);}}));await self.skipWaiting();})());
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
