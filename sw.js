// Change VERSION and script URL versions together for each release.
const VERSION='0.12';
const PREFIX='offroad-niva:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=["./index.html", "./game.js?v=012", "./biomes.js?v=012", "./props.js?v=012", "./feedback.js?v=012", "./trees.js?v=012", "./road-world.js?v=012", "./visual-car.js?v=012", "./physics.js?v=012", "./gearbox.js?v=012", "./controls.js?v=012", "./cameras.js?v=012", "./obstacles.js?v=012", "./surfaces.js?v=012", "./engine-audio.js?v=012", "./browser-guard.js?v=012", "./pwa.js?v=012", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
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
