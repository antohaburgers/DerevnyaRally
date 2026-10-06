// Change VERSION and script URL versions together for each release.
const VERSION='0.14';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./index.html", "./game.js?v=014", "./run-state.js?v=014", "./pickups.js?v=014", "./event-audio.js?v=014", "./traffic.js?v=014", "./npc-models.js?v=014", "./colliders.js?v=014", "./biomes.js?v=014", "./props.js?v=014", "./feedback.js?v=014", "./trees.js?v=014", "./road-world.js?v=014", "./visual-car.js?v=014", "./physics.js?v=014", "./gearbox.js?v=014", "./controls.js?v=014", "./cameras.js?v=014", "./obstacles.js?v=014", "./surfaces.js?v=014", "./engine-audio.js?v=014", "./browser-guard.js?v=014", "./pwa.js?v=014", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
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
 if(request.mode==='navigate'){
  // Serve a consistent cached build; sw.js controls build upgrades.
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(SHELL))||fetch(request)));
  return;
 }
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});
