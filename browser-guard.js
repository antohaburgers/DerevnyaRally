// The game owns page gestures; each control still owns its own PointerEvent.
(()=>{
 const stop=e=>{if(e.cancelable)e.preventDefault();};
 for(const name of ['touchmove','gesturestart','gesturechange','gestureend','wheel'])document.addEventListener(name,stop,{passive:false});
 for(const name of ['contextmenu','selectstart','dragstart','dblclick'])document.addEventListener(name,stop);
 // Release physics inputs when navigation interrupts an in-progress touch.
 window.addEventListener('pagehide',()=>window.dispatchEvent(new Event('blur')));
})();
