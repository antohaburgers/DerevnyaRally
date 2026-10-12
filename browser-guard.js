// The game owns page gestures; each control still owns its own PointerEvent.
(()=>{
 // During driving we suppress page gestures. In the garage, allow native
 // scrolling of the tuning panel, but NEVER gestures on the 3D car canvas.
 const isGarageScrollTarget=target=>{
  const garage=document.querySelector('#garage-screen');
  if(!garage||garage.hidden||!target?.closest)return false;
  return !!target.closest('#garage-screen .garage-panel')
   && !target.closest('#garage-screen .garage-preview');
 };
 const stop=e=>{
  if((e.type==='touchmove'||e.type==='wheel')&&isGarageScrollTarget(e.target))return;
  if(e.cancelable)e.preventDefault();
 };
 for(const name of ['touchmove','gesturestart','gesturechange','gestureend','wheel'])
  document.addEventListener(name,stop,{passive:false});
 for(const name of ['contextmenu','selectstart','dragstart','dblclick'])document.addEventListener(name,stop);
 // Release physics inputs when navigation interrupts an in-progress touch.
 window.addEventListener('pagehide',()=>window.dispatchEvent(new Event('blur')));
})();
