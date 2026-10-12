import {rotate} from './physics.js?v=061';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const EXPEDITION_CONFIG={
 winchRange:23,winchMinimum:2.1,winchSpeed:1.45,winchMaxPull:10500,winchSnapForce:10100,winchHeatRate:.11,winchCoolRate:.22,
 pressureMin:.8,pressureMax:2.2,pressureStep:.2,deepFordIntake:.49,snorkelIntake:.87,restartDepth:.22,restartDryTime:.65,
 grimeRate:.034,scarDamage:14
};
export const TYRE_PRESSURES=Object.freeze({road:2.2,trail:1.5,soft:.8});
// Extra systems all run on existing 4 tyre contact patches + existing rigid chassis.
export class ExpeditionSystems{
 constructor(feedback){this.feedback=feedback;this.reset();}
 reset(build={}){
  this.build=build||{};this.pressure=TYRE_PRESSURES[this.build.tyrePressure]??2.2;
  this.tyres=Array.from({length:4},()=>({punctured:false,unseated:false,wear:0}));
  this.winch={tree:null,length:0,pulling:false,heat:0,broken:false,load:0,overload:0};
  this.engine={stalled:false,wetTime:0,restartCooldown:0,dryTime:0};
  this.grime=0;this.scratches=0;this.damageMarks=0;
  this.mudZones=[0,0,0];this.lastPuncture=0;this.lastBead=0;this.lastWater=0;
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
  this.winch.tree=candidate;this.winch.length=best+.1;this.winch.pulling=false;this.winch.load=0;this.winch.overload=0;
  this.apply();this.feedback?.emit('WINCH_ATTACHED',{distance:best});return true;
 }
 release(){this.winch.tree=null;this.winch.pulling=false;this.winch.load=0;this.apply();}
 setPulling(v){this.winch.pulling=!!v&&!!this.winch.tree&&!this.winch.broken&&this.winch.heat<1;this.apply();}
 canRestart(){
  if(!this.body||!this.engine.stalled||this.engine.restartCooldown>0||this.body.state.runEnded||this.body.state.fuel===0)return false;
  // Sample current coordinates: an evacuation or winch can move the car since the last wet tick.
  let wet=0;for(const wheel of this.body.wheels){const p=this.body.point?.([wheel.x,this.body.c?.mountHeight||0,wheel.z]);wet=Math.max(wet,p&&this.body.terrain?.surface?this.body.terrain.surface(p[0],p[2]).waterDepth||0:wheel.waterDepth||0);}
  this.lastWater=wet;return wet<=EXPEDITION_CONFIG.restartDepth;
 }
 restart(){
  if(!this.canRestart())return false;
  this.engine.stalled=false;this.engine.wetTime=0;this.engine.dryTime=0;this.engine.restartCooldown=1;
  const s=this.body.state;
  if(Math.abs(s.vehicleSpeed||0)<5){s.currentGear=1;s.shiftRemaining=0;this.body.cooldown=0;this.body.reverseHold=0;s.kickdownHold=s.lugHold=s.rapidDecelHold=0;}
  s.currentRPM=this.body.c?.idleRPM||850;
  s.engineRunning=true;s.enginePowerFactor=s.fuel===0?0:(s.hp<=25?.85:1)*(this.build.engine==='turbo'?1.30:1);
  this.apply();this.feedback?.emit('ENGINE_RESTARTED');return true;
 }
 hit(type,damage,event={}){
  this.scratches=clamp(this.scratches+Math.max(0,damage)*.003,0,1);
  if(damage>=EXPEDITION_CONFIG.scarDamage)this.damageMarks=Math.min(8,this.damageMarks+1);
  if(damage<25||!this.body)return;
  const q=this.body.q,p=this.body.p,origin=event.position||p;
  const local=rotate([-q[0],-q[1],-q[2],q[3]],origin.map((n,i)=>n-p[i]));
  let chosen=(local[2]>=0?0:2)+(local[0]>=0?1:0);
  if(this.tyres[chosen].punctured||this.tyres[chosen].unseated)return;
  // Only meaningful wheel-side impacts risk a puncture. A heavy hit should be more dangerous.
  const lateral=Math.abs(local[0]),chance=clamp((damage-24)*.003,0,.12)*(lateral>.5?1:.4);
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
  const threshold=s.trophyFordAssist?Infinity:(this.build?.snorkel?EXPEDITION_CONFIG.snorkelIntake:EXPEDITION_CONFIG.deepFordIntake);
  if(wet>threshold&&Math.abs(s.vehicleSpeed||0)<55){
   this.engine.wetTime+=dt*(.8+(wet-threshold)*2);
   if(this.engine.wetTime>1.35&&!this.engine.stalled){
    this.engine.stalled=true;this.engine.dryTime=0;this.feedback?.emit('ENGINE_FLOODED',{depth:wet});
   }
  }else this.engine.wetTime=Math.max(0,this.engine.wetTime-dt*1.4);
  this.engine.dryTime=wet<=EXPEDITION_CONFIG.restartDepth?this.engine.dryTime+dt:0;
  if(this.engine.stalled&&this.engine.dryTime>=EXPEDITION_CONFIG.restartDryTime&&(s.throttleInput||s.throttle||0)>.08)this.restart();
  const winch=this.winch;
  winch.heat=Math.max(0,winch.heat-dt*EXPEDITION_CONFIG.winchCoolRate);
  if(winch.tree?.broken){this.release();this.feedback?.emit('WINCH_RELEASED');}
  if(winch.tree&&winch.pulling){
   if(winch.heat>=1){winch.pulling=false;this.feedback?.emit('WINCH_OVERHEATED');}
   else{
    winch.length=Math.max(1.2,winch.length-EXPEDITION_CONFIG.winchSpeed*dt);
    winch.heat=Math.min(1.02,winch.heat+dt*(EXPEDITION_CONFIG.winchHeatRate+.14*Math.min(1,(s.winchLoad||0)/EXPEDITION_CONFIG.winchMaxPull)));
    winch.overload=(s.winchLoad||0)>EXPEDITION_CONFIG.winchSnapForce?winch.overload+dt:Math.max(0,winch.overload-dt*.65);
    if(winch.overload>7){
     winch.broken=true;this.release();this.feedback?.emit('WINCH_SNAPPED');
    }
   }
  }
  // Pressure adds grip off road, but overly soft tyres can unseat under fast lateral load.
  const speed=Math.abs(s.vehicleSpeed||0);
  for(let i=0;i<4;i++){
   const tyre=this.tyres[i],wheel=w[i];if(!wheel||tyre.punctured||wheel.detached||!wheel.contact)continue;
   const slip=Math.abs(wheel.slipRatio||0),turn=Math.abs(s.steeringInput||0);
   if(this.pressure<=.95&&speed>65&&turn>.60&&wheel.load>1700){
    tyre.wear+=dt*(speed-60)*.006*turn*(1+slip);
    if(tyre.wear>5.2){this.puncture(i,'BEAD');continue;}
   }else tyre.wear=Math.max(0,tyre.wear-dt*.5);
   if(speed>75&&['ROCK','HAZARD_ROCK'].includes(wheel.surfaceType)&&wheel.load>14000){
    tyre.wear+=dt*.15;
    if(tyre.wear>8.0)this.puncture(i,'PUNCTURE');
   }
  }
  const dirty=w.reduce((v,x)=>v+(['MUD','PEAT','SOFT_DIRT'].includes(x.surfaceType)&&x.contact?1:0),0)/4;
  const wetWheel=w.reduce((n,x)=>n+(x.contact&&(x.surfaceType==='MUD'||x.surfaceType==='PEAT'||(x.surfaceType==='SOFT_DIRT'&&(x.surface?.wetness||0)>.2))?1:0),0)/4;
  const slip=Math.min(1.6,Math.max(0,...w.map(x=>Math.abs(x.slipRatio||0))));
  const spray=Math.min(2.6,.42+speed/32+slip*.72)*wetWheel;
  this.mudZones[0]=Math.min(1,this.mudZones[0]+dt*.042*(dirty+spray*.85));
  this.mudZones[1]=Math.min(1,this.mudZones[1]+dt*.017*(dirty*.4+spray));
  this.mudZones[2]=Math.min(.88,this.mudZones[2]+dt*.006*(spray+.18*dirty));
  this.grime=Math.max(...this.mudZones);
  this.apply();
 }
 wash(){this.grime=0;this.mudZones.fill(0);this.scratches=0;this.damageMarks=0;this.feedback?.emit('CAR_WASHED');}
 repair(){for(const t of this.tyres){t.punctured=false;t.unseated=false;t.wear=0;}
  this.winch.broken=false;this.winch.heat=0;this.winch.pulling=false;this.winch.overload=0;this.release();
  this.engine.stalled=false;this.engine.wetTime=0;this.engine.dryTime=0;this.engine.restartCooldown=0;
  this.scratches=0;this.damageMarks=0;this.apply();
 }
 shift(dx,dz){/* Tree object is shifted by RoadWorld.shift(), no duplicate coordinates. */ }
 get diagnostics(){const bad=this.tyres.map((t,i)=>t.punctured?['FL','FR','RL','RR'][i]+(t.unseated?' РАЗБОРТ':' ПРОКОЛ'):null).filter(Boolean);
  if(this.engine.stalled)bad.push('МОТОР ЗАГЛОХ');
  if(this.winch.broken)bad.push('ТРОС ОБОРВАН');
  return bad.join(' · ');
 }
}
