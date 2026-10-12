import {rotate} from './physics.js?v=055';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const EXPEDITION_CONFIG={
 winchRange:23,winchMinimum:2.1,winchSpeed:1.45,winchMaxPull:7600,winchSnapForce:9800,winchHeatRate:.24,winchCoolRate:.10,
 pressureMin:.8,pressureMax:2.2,pressureStep:.2,deepFordIntake:.49,snorkelIntake:.87,
 grimeRate:.034,scarDamage:14
};
export const TYRE_PRESSURES=Object.freeze({road:2.2,trail:1.5,soft:.8});
// Extra systems all run on existing 4 tyre contact patches + existing rigid chassis.
export class ExpeditionSystems{
 constructor(feedback){this.feedback=feedback;this.reset();}
 reset(build={}){
  this.build=build||{};this.pressure=TYRE_PRESSURES[this.build.tyrePressure]??1.5;
  this.tyres=Array.from({length:4},()=>({punctured:false,unseated:false,wear:0}));
  this.winch={tree:null,length:0,pulling:false,heat:0,broken:false,load:0};
  this.engine={stalled:false,wetTime:0,restartCooldown:0};
  this.grime=0;this.scratches=0;this.damageMarks=0;
  this.lastPuncture=0;this.lastBead=0;this.lastWater=0;
 }
 bind(body,world){this.body=body;this.world=world;this.apply();}
 apply(){
  if(!this.body)return;
  const s=this.body.state;
  s.tyrePressure=this.pressure;s.tyreFailures=this.tyres;
  s.engineFlooded=this.engine.stalled;
  s.winch=this.winch.tree&&!this.winch.broken?{
   anchor:[this.winch.tree.x,(this.winch.tree.y??this.body.terrain.height(this.winch.tree.x,this.winch.tree.z))+1.15,this.winch.tree.z],
   length:this.winch.length,pulling:this.winch.pulling,force:EXPEDITION_CONFIG.winchMaxPull}:null;
 }
 setPressure(delta){
  const next=clamp(Math.round((this.pressure+delta)*10)/10,EXPEDITION_CONFIG.pressureMin,EXPEDITION_CONFIG.pressureMax);
  if(next===this.pressure)return false;
  this.pressure=next;this.apply();this.feedback?.emit('TYRE_PRESSURE',{pressure:next});return true;
 }
 toggleWinch(){
  if(!this.body||!this.world||!this.build?.winch)return false;
  if(this.winch.tree){this.release();this.feedback?.emit('WINCH_RELEASED');return true;}
  if(this.winch.broken){this.feedback?.emit('WINCH_BROKEN');return false;}
  const front=rotate(this.body.q,[0,0,1]),point=this.body.point([0,.73,2.0]);
  let candidate=null,best=EXPEDITION_CONFIG.winchRange;
  for(const section of this.world.sections)for(const tree of section.decorations||[]){
   if(tree.kind!=='tree'||tree.broken)continue;
   const dx=tree.x-point[0],dz=tree.z-point[2],distance=Math.hypot(dx,dz);
   if(distance<EXPEDITION_CONFIG.winchMinimum||distance>best||dx*front[0]+dz*front[2]<distance*.08)continue;
   best=distance;candidate=tree;
  }
  if(!candidate){this.feedback?.emit('WINCH_NO_ANCHOR');return false;}
  this.winch.tree=candidate;this.winch.length=best+.1;this.winch.pulling=false;this.winch.load=0;
  this.apply();this.feedback?.emit('WINCH_ATTACHED',{distance:best});return true;
 }
 release(){this.winch.tree=null;this.winch.pulling=false;this.winch.load=0;this.apply();}
 setPulling(v){this.winch.pulling=!!v&&!!this.winch.tree&&!this.winch.broken&&this.winch.heat<1;this.apply();}
 restart(){
  if(!this.body||!this.engine.stalled||this.engine.restartCooldown>0||this.lastWater>.22)return false;
  this.engine.stalled=false;this.engine.wetTime=0;this.engine.restartCooldown=4;
  this.apply();this.feedback?.emit('ENGINE_RESTARTED');return true;
 }
 hit(type,damage,event={}){
  this.scratches=clamp(this.scratches+Math.max(0,damage)*.003,0,1);
  if(damage>=EXPEDITION_CONFIG.scarDamage)this.damageMarks=Math.min(8,this.damageMarks+1);
  if(damage<18||!this.body)return;
  const q=this.body.q,p=this.body.p,origin=event.position||p;
  const local=rotate([-q[0],-q[1],-q[2],q[3]],origin.map((n,i)=>n-p[i]));
  let chosen=(local[2]>=0?0:2)+(local[0]>=0?1:0);
  if(this.tyres[chosen].punctured||this.tyres[chosen].unseated)return;
  // Only meaningful wheel-side impacts risk a puncture. A heavy hit should be more dangerous.
  const lateral=Math.abs(local[0]),chance=clamp((damage-17)*.0055,0,.27)*(lateral>.5?1:.4);
  if(this.random()<chance)this.puncture(chosen,'IMPACT');
 }
 random(){this.seed=(Math.imul(this.seed??41,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 puncture(index,reason='PUNCTURE'){
  if(!this.tyres[index]||this.tyres[index].punctured)return false;
  this.tyres[index].punctured=true;this.tyres[index].unseated=reason==='BEAD';
  this.feedback?.emit(reason==='BEAD'?'TYRE_UNSEATED':'TYRE_PUNCTURE',{wheel:['FL','FR','RL','RR'][index]});
  this.apply();return true;
 }
 tick(dt,body){
  if(!body)return;this.body=body;
  this.engine.restartCooldown=Math.max(0,this.engine.restartCooldown-dt);
  const s=body.state,w=body.wheels;
  const wet=Math.max(0,...w.map(x=>x.waterDepth||0));
  this.lastWater=wet;
  const threshold=this.build?.snorkel?EXPEDITION_CONFIG.snorkelIntake:EXPEDITION_CONFIG.deepFordIntake;
  if(wet>threshold&&Math.abs(s.vehicleSpeed||0)<55){
   this.engine.wetTime+=dt*(.8+(wet-threshold)*2);
   if(this.engine.wetTime>1.35&&!this.engine.stalled){
    this.engine.stalled=true;this.feedback?.emit('ENGINE_FLOODED',{depth:wet});
   }
  }else this.engine.wetTime=Math.max(0,this.engine.wetTime-dt*1.4);
  const winch=this.winch;
  winch.heat=Math.max(0,winch.heat-dt*EXPEDITION_CONFIG.winchCoolRate);
  if(winch.tree?.broken){this.release();this.feedback?.emit('WINCH_RELEASED');}
  if(winch.tree&&winch.pulling){
   if(winch.heat>=1){winch.pulling=false;this.feedback?.emit('WINCH_OVERHEATED');}
   else{
    winch.length=Math.max(1.2,winch.length-EXPEDITION_CONFIG.winchSpeed*dt);
    winch.heat=Math.min(1.02,winch.heat+dt*(EXPEDITION_CONFIG.winchHeatRate+.14*Math.min(1,(s.winchLoad||0)/EXPEDITION_CONFIG.winchMaxPull)));
    if((s.winchLoad||0)>EXPEDITION_CONFIG.winchSnapForce&&this.random()<dt*.9){
     winch.broken=true;this.release();this.feedback?.emit('WINCH_SNAPPED');
    }
   }
  }
  // Pressure adds grip off road, but overly soft tyres can unseat under fast lateral load.
  const speed=Math.abs(s.vehicleSpeed||0);
  for(let i=0;i<4;i++){
   const tyre=this.tyres[i],wheel=w[i];if(!wheel||tyre.punctured||wheel.detached||!wheel.contact)continue;
   const slip=Math.abs(wheel.slipRatio||0),turn=Math.abs(s.steeringInput||0);
   if(this.pressure<=1.05&&speed>48&&turn>.38&&wheel.load>1300){
    tyre.wear+=dt*(speed-42)*.020*turn*(1+slip);
    if(tyre.wear>2.3){this.puncture(i,'BEAD');continue;}
   }else tyre.wear=Math.max(0,tyre.wear-dt*.5);
   if(speed>60&&['ROCK','HAZARD_ROCK'].includes(wheel.surfaceType)&&wheel.load>11000){
    tyre.wear+=dt*.3;
    if(tyre.wear>4.5)this.puncture(i,'PUNCTURE');
   }
  }
  const dirty=w.reduce((v,x)=>v+(['MUD','PEAT','SOFT_DIRT'].includes(x.surfaceType)&&x.contact?1:0),0)/4;
  this.grime=Math.min(1,this.grime+dt*EXPEDITION_CONFIG.grimeRate*dirty*(.6+Math.min(speed,60)/40));
  this.apply();
 }
 wash(){this.grime=0;this.scratches=0;this.damageMarks=0;this.feedback?.emit('CAR_WASHED');}
 repair(){for(const t of this.tyres){t.punctured=false;t.unseated=false;t.wear=0;}
  this.winch.broken=false;this.winch.heat=0;this.winch.pulling=false;this.release();
  this.engine.stalled=false;this.engine.wetTime=0;this.engine.restartCooldown=0;
  this.scratches=0;this.damageMarks=0;this.apply();
 }
 shift(dx,dz){/* Tree object is shifted by RoadWorld.shift(), no duplicate coordinates. */ }
 get diagnostics(){const bad=this.tyres.map((t,i)=>t.punctured?['FL','FR','RL','RR'][i]+(t.unseated?' РАЗБОРТ':' ПРОКОЛ'):null).filter(Boolean);
  if(this.engine.stalled)bad.push('МОТОР ЗАГЛОХ');
  if(this.winch.broken)bad.push('ТРОС ОБОРВАН');
  return bad.join(' · ');
 }
}
