export const THROTTLE_CONTROL={minimum:.20};
export function throttleAt(clientY,rect){return THROTTLE_CONTROL.minimum+(1-THROTTLE_CONTROL.minimum)*Math.max(0,Math.min(1,(rect.top+rect.height-clientY)/rect.height));}
export function bindThrottle(button,onChange){
 const state={activeGasPointerId:null,rawGasInput:0,gasTouchY:null,pointerActive:false};
 const set=value=>{state.rawGasInput=value;onChange(value);button.style.setProperty('--throttle',String(value));button.setAttribute('aria-valuenow',String(Math.round(value*100)));const label=button.querySelector?.('.gas-value');if(label)label.textContent=Math.round(value*100)+'%';};
 const reset=()=>{const id=state.activeGasPointerId;state.activeGasPointerId=null;state.pointerActive=false;state.gasTouchY=null;set(0);button.classList.remove('active');if(id!==null)try{button.releasePointerCapture?.(id);}catch{}};
 const move=e=>{state.gasTouchY=e.clientY;set(throttleAt(e.clientY,button.getBoundingClientRect()));e.preventDefault();};
 const end=e=>{if(e.pointerId===state.activeGasPointerId)reset();};
 button.addEventListener('pointerdown',e=>{if(state.activeGasPointerId!==null)return;state.activeGasPointerId=e.pointerId;state.pointerActive=true;try{button.setPointerCapture(e.pointerId);}catch{}button.classList.add('active');move(e);});
 button.addEventListener('pointermove',e=>{if(state.activeGasPointerId===e.pointerId){if(e.buttons===0&&e.pointerType==='mouse')reset();else move(e);}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,end);
 // Global fallback covers a missing capture and release outside the button on Safari.
 for(const target of [globalThis.document,globalThis.window])for(const type of ['pointerup','pointercancel'])target?.addEventListener?.(type,end);
 globalThis.window?.addEventListener?.('blur',reset);globalThis.document?.addEventListener?.('touchcancel',reset);globalThis.document?.addEventListener?.('visibilitychange',reset);
 reset.state=state;return reset;
}
