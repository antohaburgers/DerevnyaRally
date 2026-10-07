// Relative URLs preserve /repository/ deployment on GitHub Pages.
if('serviceWorker' in navigator && window.isSecureContext){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
   .then(registration=>registration.update())
   .catch(error=>console.warn('Офлайн-режим пока недоступен:',error.message));
 });
}
