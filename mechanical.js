import {rotate} from './physics.js?v=055';
export const MECHANICAL_CONFIG={minMechanicalDamage:10,failureChance:[.025,.065,.12],wheelDetachChance:[.006,.012,.03],damageBands:[20,35],maxDetachedWheels:1,wheelLife:4,debrisPool:4,landingMinDamage:20,randomFailureSpacing:100,randomFailureChance:1/165,randomFailureWeights:{FRONT_DRIVE_FAILURE:.40,REAR_DRIVE_FAILURE:.40,WHEEL_DETACHED:.20},bodyPartMinDamage:12,partLife:11,partPool:6,lockWarningWear:60,lockDangerWear:82,lockSurpriseChancePerSecond:.000022};
const eligible=new Set(['TREE_HIT','HOUSE_HIT','TRAFFIC_HIT','COW_HIT','ROLLOVER_IMPACT','HARD_LANDING']);
export class MechanicalDamage{
 constructor(feedback){this.feedback=feedback;this.body=null;this.debris=Array.from({length:MECHANICAL_CONFIG.debrisPool},()=>({active:false}));this.partDebris=Array.from({length:MECHANICAL_CONFIG.partPool},()=>({active:false}));this.reset();}
 reset(seed=1){this.seed=seed>>>0;this.distanceSeed=(seed^0x68bc21eb)>>>0;this.frontDriveActive=true;this.rearDriveActive=true;this.detachedWheel=null;this.nextRandomFailureDistance=MECHANICAL_CONFIG.randomFailureSpacing;this.lastRandomFailureRoll=null;this.randomChecks=0;this.lastFailure='—';this.lastImpactDamage=0;this.debris.forEach(d=>d.active=false);this.partDebris.forEach(d=>d.active=false);
 this.parts={frontBumper:true,rearBumper:true,fogLeft:true,fogRight:true};
 this.lockWear={front:0,center:0,rear:0};this.lockFaults={front:null,center:null,rear:null};
 this.warned={front:0,center:0,rear:0};this.lockDamageCount=0;this.apply();}
 bind(body,seed){this.body=body;if(seed!==undefined){this.seed=seed>>>0;this.distanceSeed=(seed^0x68bc21eb)>>>0;}this.apply();}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 apply(){if(!this.body)return;Object.assign(this.body.state,{frontDriveActive:this.frontDriveActive,rearDriveActive:this.rearDriveActive,detachedWheel:this.detachedWheel,lockWear:this.lockWear,lockFaults:this.lockFaults,bodyParts:this.parts});for(const w of this.body.wheels){w.detached=w.id===this.detachedWheel;if(w.detached){w.contact=false;w.load=w.longForce=w.sideForce=w.omega=w.driveTorque=w.brakeApplied=0;}}}
 impact(type,damage,event={}){this.lastImpactDamage=damage;const partLost=this.damageBodyParts(type,damage,event);this.shockLocks(type,damage,event);if(!this.body||!eligible.has(type)||damage<MECHANICAL_CONFIG.minMechanicalDamage||(type==='HARD_LANDING'&&damage<MECHANICAL_CONFIG.landingMinDamage))return partLost;const band=damage>=MECHANICAL_CONFIG.damageBands[1]?2:damage>=MECHANICAL_CONFIG.damageBands[0]?1:0,roll=this.random();if(roll>=MECHANICAL_CONFIG.failureChance[band])return partLost;
 const wheelAvailable=this.body.wheels.filter(w=>w.detached).length<MECHANICAL_CONFIG.maxDetachedWheels;
 if(wheelAvailable&&roll<MECHANICAL_CONFIG.wheelDetachChance[band])return this.fail('WHEEL_DETACHED',this.chooseWheel(type,event),event);
 // Keep one working axle: a mechanical event should leave a way to reach repair.
 if(this.frontDriveActive&&this.rearDriveActive)return this.fail(this.random()<.5?'FRONT_DRIVE_FAILURE':'REAR_DRIVE_FAILURE',null,event)||partLost;return partLost;}
 distanceRandom(){this.distanceSeed=(Math.imul(this.distanceSeed,1664525)+1013904223)>>>0;return this.distanceSeed/4294967296;}

 damageBodyParts(type,damage,event={}){
  if(!this.body||!eligible.has(type)||damage<MECHANICAL_CONFIG.bodyPartMinDamage)return false;
  const pos=event.position||this.body.p,q=this.body.q;
  const local=rotate([-q[0],-q[1],-q[2],q[3]],pos.map((x,i)=>x-this.body.p[i]));
  const front=local[2]>-.35,side=local[0]>=0?'fogRight':'fogLeft',bumper=front?'frontBumper':'rearBumper';
  const impact=Math.max(0,event.impulse||0),build=this.build||{};
  const chance=Math.min(.94,Math.max(0,(damage-12)*.012+impact/460000));
  let changed=false;
  if(this.parts[bumper]&&this.random()<chance)changed=this.detachPart(bumper,event)||changed;
  if(front&&build.fogLights&&this.parts[side]){
   const lightChance=Math.min(.94,Math.max(0,(damage-8)*.018+impact/380000));
   if(this.random()<lightChance)changed=this.detachPart(side,event)||changed;
  }
  return changed;
 }
 detachPart(part,event={}){
  if(!this.body||!this.parts[part])return false;
  this.parts[part]=false;
  const front=part!=='rearBumper',x=part==='fogLeft'?-.48:part==='fogRight'?.48:0;
  const z=part==='rearBumper'?-1.91:part==='frontBumper'?2.0:(this.build?.frontBumper?2.19:2.09);
  const pos=this.body.point([x,part.startsWith('fog')?.77:.66,z]);
  const q=this.body.q,out=rotate(q,[x*3+(this.random()-.5)*2,1.8+this.random()*1.4,front?2.8:-2.8]);
  const d=this.partDebris.find(p=>!p.active)||this.partDebris.reduce((a,b)=>a.age>b.age?a:b);
  Object.assign(d,{active:true,part,p:pos,v:this.body.v.map((v,i)=>v*.6+out[i]),
   yaw:Math.atan2(rotate(q,[0,0,1])[0],rotate(q,[0,0,1])[2]),
   angle:0,spin:(this.random()<.5?-1:1)*(4+this.random()*9),age:0});
  this.feedback.emit(part.startsWith('fog')?'FOG_LIGHT_BROKEN':'BUMPER_DETACHED',
   {part,position:pos.slice(),impulse:event.impulse||0});
  this.apply();return true;
 }
 failLock(lock,event={}){
  if(!this.body||this.lockFaults[lock]||!['front','rear','center'].includes(lock))return false;if(this.body.state.arcadeDrive&&lock==='rear')return false;
  const s=this.body.state,engaged=!!s[lock+'Locked'],jam=engaged&&this.random()<.27;
  this.lockFaults[lock]=jam?'JAMMED':'OPEN';this.lockWear[lock]=100;
  s[lock+'Locked']=jam;
  s['pending'+lock[0].toUpperCase()+lock.slice(1)]=null;
  this.lockDamageCount++;this.lastFailure=lock.toUpperCase()+'_LOCK_'+this.lockFaults[lock];
  this.feedback.emit(jam?'LOCK_JAMMED':'LOCK_FAILURE',
   {lock,mode:this.lockFaults[lock],position:this.body.p.slice(),randomFailure:!!event.randomFailure,impulse:event.impulse||0});
  this.apply();return true;
 }
 shockLocks(type,damage,event={}){
  if(!this.body||!eligible.has(type)||damage<31)return;
  const s=this.body.state;
  for(const lock of ['front','rear','center']){
   if(s.arcadeDrive&&lock==='rear')continue;if(this.lockFaults[lock]||!s[lock+'Locked'])continue;
   const chance=Math.min(.075,.004+(damage-31)*.0007+this.lockWear[lock]*.00025);
   if(this.random()<chance){this.failLock(lock,event);break;}
  }
 }
 stressLocks(dt){
  if(!this.body||this.body.state.runEnded||!this.body.state.engineRunning)return;
  const s=this.body.state,w=this.body.wheels;
  const omega=(i,j)=>Math.abs((w[i]?.omega||0)-(w[j]?.omega||0));
  const active=w.filter(a=>a.contact&&a.load>70&&!a.detached);
  const slip=active.length?Math.min(2,Math.max(...active.map(a=>Math.abs(a.wheelSlip||a.slipRatio||0)))):0;
  const solid=active.length?active.reduce((n,a)=>n+(a.mu||.8),0)/active.length:0;
  const throttle=Math.max(0,Math.min(1,s.throttle||0)),steer=Math.abs(s.steeringInput||this.body.steer||0),speed=s.vehicleSpeed||0;
  const turn=solid>1&&speed>7?Math.min(1.7,steer*speed/15):0;
  for(const lock of ['front','rear','center']){
   if(s.arcadeDrive&&lock==='rear')continue;if(this.lockFaults[lock]||!s[lock+'Locked'])continue;
   const diff=lock==='front'?omega(0,1):lock==='rear'?omega(2,3):
     Math.abs(((w[0]?.omega||0)+(w[1]?.omega||0)-(w[2]?.omega||0)-(w[3]?.omega||0))*.5);
   const stress=throttle*(.23+.70*slip)+Math.min(2.1,diff/11)*.44+
     (lock==='front'?turn*.9:lock==='rear'?turn*.48:turn*.72);
   const rate=.006+Math.pow(stress,1.8)*.16;
   const wear=this.lockWear[lock]=Math.min(100,this.lockWear[lock]+dt*rate);
   const stage=wear>=MECHANICAL_CONFIG.lockDangerWear?2:wear>=MECHANICAL_CONFIG.lockWarningWear?1:0;
   if(stage>this.warned[lock]){
    this.warned[lock]=stage;
    this.feedback.emit(stage===2?'LOCK_CRITICAL':'LOCK_WARNING',{lock,wear,position:this.body.p.slice()});
   }
   if(wear>=100){this.failLock(lock);continue;}
   const chance=wear>72?dt*(.0002+Math.pow((wear-72)/28,2)*.028):0;
   const surprise=stress>1.1?dt*MECHANICAL_CONFIG.lockSurpriseChancePerSecond:0;
   if(this.random()<chance+surprise)this.failLock(lock,{randomFailure:wear<=72});
  }
 }
 checkDistance(distance){while(distance>=this.nextRandomFailureDistance){this.nextRandomFailureDistance+=MECHANICAL_CONFIG.randomFailureSpacing;this.randomChecks++;const roll=this.lastRandomFailureRoll=this.distanceRandom();if(roll>=MECHANICAL_CONFIG.randomFailureChance||!this.body)continue;const choices=[];if(this.frontDriveActive&&this.rearDriveActive)choices.push('FRONT_DRIVE_FAILURE','REAR_DRIVE_FAILURE');if(!this.detachedWheel)choices.push('WHEEL_DETACHED');if(!choices.length)continue;const total=choices.reduce((n,t)=>n+MECHANICAL_CONFIG.randomFailureWeights[t],0);let pick=this.distanceRandom()*total,type=choices.at(-1);for(const t of choices){pick-=MECHANICAL_CONFIG.randomFailureWeights[t];if(pick<0){type=t;break;}}const alive=this.body.wheels.filter(w=>!w.detached),id=type==='WHEEL_DETACHED'?alive[Math.min(alive.length-1,Math.floor(this.distanceRandom()*alive.length))].id:null;this.fail(type,id,{randomFailure:true});}}
 chooseWheel(type,event){const wheels=this.body.wheels.filter(w=>!w.detached);let weights;if(type==='HARD_LANDING')weights=wheels.map(w=>Math.max(100,w.load||w.contactForce||0));else if(event.position){const q=this.body.q,p=rotate([-q[0],-q[1],-q[2],q[3]],event.position.map((v,i)=>v-this.body.p[i]));weights=wheels.map(w=>1+(Math.sign(w.x)===Math.sign(p[0])?Math.abs(p[0])*3:0)+(Math.sign(w.z)===Math.sign(p[2])?Math.abs(p[2])*3:0));}else weights=wheels.map(()=>1);let r=this.random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<wheels.length;i++){r-=weights[i];if(r<=0)return wheels[i].id;}return wheels.at(-1).id;}
 fail(type,wheelId=null,event={}){if(!this.body)return false;if(type==='FRONT_DRIVE_FAILURE'){if(!this.frontDriveActive||!this.rearDriveActive)return false;this.frontDriveActive=false;}else if(type==='REAR_DRIVE_FAILURE'){if(!this.rearDriveActive||!this.frontDriveActive)return false;this.rearDriveActive=false;}else if(type==='WHEEL_DETACHED'){if(this.detachedWheel||!this.body.wheels.some(w=>w.id===wheelId))return false;const w=this.body.wheels.find(w=>w.id===wheelId),d=this.debris.find(d=>!d.active)||this.debris[0],out=rotate(this.body.q,[Math.sign(w.x)*3,2,0]);Object.assign(d,{active:true,p:w.position.slice(),v:this.body.v.map((v,i)=>v+out[i]),angle:w.angle,spin:w.omega||12,yaw:Math.atan2(rotate(this.body.q,[0,0,1])[0],rotate(this.body.q,[0,0,1])[2]),age:0});this.detachedWheel=wheelId;}else return false;this.lastFailure=type;this.apply();this.feedback.emit(type,{wheel:wheelId,position:event.position||this.body.p.slice(),impulse:event.impulse||0,randomFailure:!!event.randomFailure});return true;}
 repair(){this.frontDriveActive=this.rearDriveActive=true;this.detachedWheel=null;
 this.debris.forEach(d=>d.active=false);this.partDebris.forEach(d=>d.active=false);
 for(const key of Object.keys(this.parts))this.parts[key]=true;
 for(const key of ['front','center','rear']){this.lockWear[key]=0;this.lockFaults[key]=null;this.warned[key]=0;}
 this.apply();}
 tick(dt){this.stressLocks(dt);for(const d of this.debris){if(!d.active)continue;d.age+=dt;if(d.age>=MECHANICAL_CONFIG.wheelLife){d.active=false;continue;}d.v[1]-=9.81*dt;for(let i=0;i<3;i++)d.p[i]+=d.v[i]*dt;const ground=this.body.terrain.height(d.p[0],d.p[2])+.44;if(d.p[1]<ground){d.p[1]=ground;if(d.v[1]<0)d.v[1]*=-.30;d.v[0]*=Math.exp(-dt*2);d.v[2]*=Math.exp(-dt*2);}d.angle+=d.spin*dt;}
 for(const d of this.partDebris){if(!d.active)continue;d.age+=dt;if(d.age>MECHANICAL_CONFIG.partLife){d.active=false;continue;}
  d.v[1]-=9.81*dt;for(let i=0;i<3;i++)d.p[i]+=d.v[i]*dt;
  const ground=(this.body?.terrain.height(d.p[0],d.p[2])??0)+.065;
  if(d.p[1]<ground){d.p[1]=ground;d.v[1]=Math.max(0,-d.v[1]*.2);d.v[0]*=Math.exp(-4*dt);d.v[2]*=Math.exp(-4*dt);}
  d.angle+=d.spin*dt;d.spin*=Math.exp(-dt*.8);
 }
 }
 shift(dx,dz){for(const pool of [this.debris,this.partDebris])for(const d of pool)if(d.active){d.p[0]-=dx;d.p[2]-=dz;}}
 get indicators(){
  const failed=['front','center','rear'].filter(k=>this.lockFaults[k]).map(k=>k[0].toUpperCase()+' LOCK '+(this.lockFaults[k]==='JAMMED'?'ЗАКЛИНИЛА':'✕'));
  const worn=['front','center','rear'].filter(k=>!this.lockFaults[k]&&this.lockWear[k]>=60).map(k=>k[0].toUpperCase()+' LOCK '+Math.round(100-this.lockWear[k])+'%');
  const parts=Object.entries(this.parts).filter(([key,ok])=>!ok&&(key==='frontBumper'||key==='rearBumper'||this.build?.fogLights)).map(([k])=>k==='frontBumper'?'ПЕРЕД БАМПЕР ✕':k==='rearBumper'?'ЗАД БАМПЕР ✕':k==='fogLeft'?'ТУМАНКА Л ✕':'ТУМАНКА П ✕');
  return[!this.frontDriveActive?'F DRIVE ✕':'',!this.rearDriveActive?'R DRIVE ✕':'',this.detachedWheel?this.detachedWheel+' ✕':'',...failed,...worn,...parts].filter(Boolean).join(' · ');
 }
}
