// Updates never touch localStorage, IndexedDB or player records.
// Relative URLs preserve installation at /DerevnyaRally/ on GitHub Pages.
const APP_VERSION='0.35';
const updateButton=document.querySelector('#refresh-game');
const updateStatus=document.querySelector('#update-status');
const appScope=new URL('./',location.href).href;
const setUpdateStatus=message=>{if(updateStatus)updateStatus.textContent=message;};
setUpdateStatus('ВЕРСИЯ '+APP_VERSION);
if('serviceWorker' in navigator&&window.isSecureContext){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
   .then(registration=>registration.update())
   .catch(error=>console.warn('Офлайн-режим пока недоступен:',error.message));
 });
}
async function refreshGame(){
 if(!updateButton||updateButton.disabled)return;
 updateButton.disabled=true;
 setUpdateStatus('ПРОВЕРЯЮ ОБНОВЛЕНИЕ…');
 try{
  if(navigator.onLine===false)throw new Error('НУЖЕН ИНТЕРНЕТ');
  const freshUrl=new URL('./index.html',appScope);
  freshUrl.searchParams.set('refresh',String(Date.now()));
  // Verify an uncached copy exists before touching the offline app cache.
  const response=await fetch(freshUrl.href,{cache:'no-store'});
  if(!response.ok)throw new Error('СЕРВЕР НЕДОСТУПЕН · '+response.status);
  const page=await response.text();
  if(!page.includes('id="refresh-game"')||!page.includes('id="mode-offroad"')||!page.includes('id="mode-asphalt"'))throw new Error('НОВАЯ ВЕРСИЯ ЕЩЁ НЕ ОПУБЛИКОВАНА');
  setUpdateStatus('ОБНОВЛЯЮ ФАЙЛЫ…');
  if('serviceWorker' in navigator){
   const registrations=await navigator.serviceWorker.getRegistrations();
   for(const registration of registrations)if(registration.scope===appScope)await registration.unregister();
  }
  if('caches' in window){
   const keys=await caches.keys();
   const prefix='offroad-niva:'+appScope+':';
   for(const key of keys)if(key.startsWith(prefix))await caches.delete(key);
  }
  // Start the new release. Its PWA script will re-register a fresh offline worker.
  location.replace(freshUrl.href);
 }catch(error){
  setUpdateStatus(error?.message||'НЕ ПОЛУЧИЛОСЬ ОБНОВИТЬ');
  updateButton.disabled=false;
 }
}
updateButton?.addEventListener('click',refreshGame);
