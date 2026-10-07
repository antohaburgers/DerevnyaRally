const clamp=x=>Math.max(-1,Math.min(1,x));
export function bindDynamicSteering(surface,circle,knob,state,enabled=()=>true){
 const reset=()=>{const id=state.id;state.id=null;state.x=state.y=0;circle.hidden=true;knob.style.transform='';if(id!==null)try{surface.releasePointerCapture?.(id);}catch{}};
 const move=e=>{state.x=clamp((e.clientX-state.originX)/state.radius);state.y=0;knob.style.transform=`translate(${state.x*45}px,0px)`;e.preventDefault();};
 surface.addEventListener('pointerdown',e=>{if(!enabled()||e.clientX>=innerWidth/2||state.id!==null||e.button>0)return;state.id=e.pointerId;state.originX=e.clientX;state.originY=e.clientY;state.radius=Math.max(60,Math.min(85,innerWidth*.09));circle.style.left=(e.clientX-74)+'px';circle.style.top=(e.clientY-74)+'px';circle.hidden=false;try{surface.setPointerCapture(e.pointerId);}catch{}move(e);});
 surface.addEventListener('pointermove',e=>{if(e.pointerId===state.id)move(e);});
 const end=e=>{if(e.pointerId===state.id)reset();};for(const t of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(t,end);for(const t of ['pointerup','pointercancel'])globalThis.document?.addEventListener(t,end);reset();return reset;
}
export function deadzone(value,zone){return Math.abs(value)<=zone?0:Math.sign(value)*(Math.abs(value)-zone)/(1-zone);}
export class GamepadInput{
 constructor(action,connected=()=>{},activity=()=>{}){this.activity=activity;this.lastAxes=new Float32Array(4);this.lastTriggers=new Float32Array(2);this.action=action;this.connected=connected;this.buttons=new Uint8Array(17);this.state={steer:0,gas:0,brake:0,handbrake:false,lookX:0,lookY:0};this.index=null;this.resetTime=0;this.rescued=false;this.navTime=0;}
 reset(){Object.assign(this.state,{steer:0,gas:0,brake:0,handbrake:false,lookX:0,lookY:0});this.resetTime=0;this.rescued=false;}
 poll(dt,menu=false){let pad=null;let pads=[];try{pads=globalThis.navigator?.getGamepads?.()||[];}catch{}for(let i=0;i<pads.length;i++)if(pads[i]?.connected!==false&&pads[i]?.mapping==='standard'){pad=pads[i];break;}if(!pad){const wasConnected=this.index!==null;this.index=null;this.reset();this.buttons.fill(0);this.lastAxes.fill(0);this.lastTriggers.fill(0);if(wasConnected)this.activity(false);return;}if(this.index!==pad.index){this.index=pad.index;this.connected();}let fresh=false;for(let i=0;i<4;i++){const value=clamp(deadzone(pad.axes[i]||0,i<2?.10:.12));if(Math.abs(value)>.015&&Math.abs(value-this.lastAxes[i])>.025)fresh=true;this.lastAxes[i]=value;}for(let i=0;i<2;i++){const value=Math.max(0,deadzone(pad.buttons[i?7:6]?.value||0,.03));if(value>0&&Math.abs(value-this.lastTriggers[i])>.015)fresh=true;this.lastTriggers[i]=value;}for(let i=0;i<17;i++)if(pad.buttons[i]?.pressed&&!this.buttons[i])fresh=true;if(fresh)this.activity(true);
 const s=this.state;Object.assign(s,{steer:this.lastAxes[0],gas:this.lastTriggers[1],brake:this.lastTriggers[0],handbrake:!!pad.buttons[0]?.pressed,lookX:this.lastAxes[2],lookY:this.lastAxes[3]});
 const edge=i=>!!pad.buttons[i]?.pressed&&!this.buttons[i];
 if(menu){s.gas=s.brake=s.steer=0;s.handbrake=false;s.lookX=s.lookY=0;if(edge(0))this.action('confirm');if(edge(1))this.action('back');this.navTime=Math.max(0,this.navTime-dt);const axis=pad.axes[1]||0,horizontal=pad.axes[0]||0,dir=pad.buttons[12]?.pressed||axis<-.5?-1:pad.buttons[13]?.pressed||axis>.5?1:pad.buttons[14]?.pressed||horizontal<-.5?-1:pad.buttons[15]?.pressed||horizontal>.5?1:0;if(dir&&this.navTime===0){this.action(dir<0?'previous':'next');this.navTime=.23;}if(!dir)this.navTime=0;}
 else{if(edge(3))this.action('camera');if(edge(9))this.action('menu');if(edge(12))this.action('range');if(edge(14))this.action('center');if(edge(15))this.action('rear');if(pad.buttons[2]?.pressed){this.resetTime+=dt;if(this.resetTime>=.7&&!this.rescued){this.action('rescue');this.rescued=true;}}else{this.resetTime=0;this.rescued=false;}}
 for(let i=0;i<17;i++)this.buttons[i]=pad.buttons[i]?.pressed?1:0;
 }
}
