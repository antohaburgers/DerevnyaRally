import {STOCK_BUILD,suspensionConfig} from './garage.js?v=055';
import {CAR_CONFIG,rotate} from './physics.js?v=061';
import {orientation} from './run-state.js?v=060';
const NAMES={tires:'ГРЯЗЕВЫЕ ШИНЫ',winch:'ЛЕБЁДКА',suspension:'УСИЛЕННАЯ ПОДВЕСКА',snorkel:'ШНОРКЕЛЬ',rearLock:'ЗАДНЯЯ БЛОКИРОВКА',frontLock:'ПЕРЕДНЯЯ БЛОКИРОВКА'};
export class ExpeditionSession {
 constructor(world,run,body,actors){this.world=world;this.run=run;this.body=body;this.actors=actors;this.found=new Set();this.cargo={crates:12,condition:100,mass:0};this.winchUses=0;this.serviceTimes=new Map();this.complete=false;this.celebrants=[];this.mapOpen=false;this.mapElapsed=0;this.checkpoint={...world.start,yaw:world.map.roadAt(world.start.x,world.start.z)?.yaw||Math.PI};this.celebrationTime=0;this.wasPulling=false;body.state.rearLockInstalled=false;body.state.frontLockInstalled=false;body.state.rearLocked=body.state.frontLocked=false;body.state.pendingRear=body.state.pendingFront=null;}
 install(upgrade){const build=this.run.garageBuild;if(upgrade==='rearLock')this.body.state.rearLockInstalled=true;if(upgrade==='frontLock')this.body.state.frontLockInstalled=true;if(upgrade==='tires')build.tires='offroad';else if(upgrade==='suspension')build.suspension='trophy';else build[upgrade]=true;
  this.body.c=suspensionConfig({...CAR_CONFIG,mapLimit:Infinity},build);this.body.state.offroadTires=build.tires==='offroad';this.run.mechanical.build=build;this.run.expedition.build=build;this.run.expedition.apply();this.run.applyEngine(this.body);this.found.add(upgrade);this.world.map.collected.add(upgrade);this.run.notify('НАЙДЕНО: '+NAMES[upgrade],4);this.run.feedback.emit('REPAIR_PICKUP',{amount:0});
 }
 tick(dt){if(this.complete)return;const b=this.body,r=this.run,w=this.world,x=b.p[0],z=b.p[2],speed=Math.abs(b.state.vehicleSpeed||0),s=w.surface(x,z);
  if(orientation(b.q)==='NORMAL'&&speed<45&&s.waterDepth<.03&&s.mudDepth<.15&&b.wheels.every(t=>t.contact&&!t.detached)&&w.map.roadAt(x,z)?.distance<2)this.checkpoint={x,z,yaw:Math.atan2(...[rotate(b.q,[0,0,1])[0],rotate(b.q,[0,0,1])[2]])};
  const pulling=r.expedition.winch.pulling;if(pulling&&!this.wasPulling)this.winchUses++;this.wasPulling=pulling;
  for(const p of w.landmarks){const d=Math.hypot(x-p.x,z-p.z);if(d>18||speed>8)continue;
   if(p.upgrade&&!this.found.has(p.upgrade))this.install(p.upgrade);
   if(p.kind==='service'&&(this.serviceTimes.get(p.id)??-100)<r.time-30){r.hp=100;r.fuel=100;r.mechanical.repair();r.expedition.repair();r.applyEngine(b);this.serviceTimes.set(p.id,r.time);r.notify('ОБСЛУЖИВАНИЕ: РЕМОНТ И ПОЛНЫЙ БАК',3);}
   if(p.kind==='delivery'&&speed<2&&this.cargo.crates>0)this.deliver();
  }
  this.updateActors(dt);
 }
 updateActors(dt){const w=this.world,b=this.body,p=w.locate(b.p[0],b.p[2]);
  // Original NPC models, pools and collision handlers; expedition chooses XY positions.
  const villages=w.landmarks.filter(l=>['village','delivery','depot'].includes(l.kind)&&Math.hypot(l.x-b.p[0],l.z-b.p[2])<100);
  for(const [i,a] of this.actors.farmers.pool.entries()){if(a.hit)continue;const l=villages[0];if(!l){a.active=false;continue;}const x=l.x-10+i*6,z=l.z+10,section=w.sectionCache.get(w.tileKey(x,z));if(!section)continue;
   if(!a.active||a.expeditionId!==l.id+i)Object.assign(a,{active:true,expeditionId:l.id+i,key:'exp-farmer:'+l.id+i,x,z,y:w.height(x,z),rotation:Math.PI,age:0,phase:i*2,running:false,crossing:false,hit:false,width:.65,depth:.7,height:1.75});a.s=p.s;a.sectionId=section.id;
  }
  for(const [i,a] of this.actors.animals.pool.entries()){const l=villages[0];if(!l||i>=5){a.active=false;continue;}const x=l.x+(i<2?-18:16)+(i%2)*3,z=l.z+24,section=w.sectionCache.get(w.tileKey(x,z));if(!section)continue;
   if(!a.active||a.expeditionId!==l.id+i)Object.assign(a,{active:true,expeditionId:l.id+i,key:'exp-animal:'+l.id+i,type:i<2?'COW':'CHICKEN',x,z,y:w.height(x,z),rotation:i,age:0,phase:i,standing:true,side:1,width:i<2?.82:.42,depth:i<2?2.35:.6,height:i<2?1.65:.55});a.s=p.s;a.sectionId=section.id;
  }
 }
 deliver(){this.complete=true;this.completionTime=this.run.time;const {body:b,run:r,world:w}=this;w.map.delivered=true;w.map.collected.add('goal');r.ended=true;b.v=[0,0,0];b.omega=[0,0,0];b.wheels.forEach(t=>t.omega=0);b.state.vehicleSpeed=0;r.applyEngine(b);r.feedback.emit('EXPEDITION_DELIVERED');
  for(let i=0;i<8;i++){const angle=i*Math.PI/4,x=w.goal.x+Math.sin(angle)*13,z=w.goal.z+Math.cos(angle)*13;this.celebrants.push({x,z,homeX:x,homeZ:z,y:w.height(x,z),rotation:angle+Math.PI,phase:i,age:0,active:true,scale:1,color:i%2?[.58,.40,.27]:[.34,.46,.53]});}
 }
 celebrate(dt){if(!this.complete)return;this.celebrationTime+=dt;for(const a of this.celebrants){a.age+=dt;const t=Math.min(1,this.celebrationTime/3),dx=this.body.p[0]-a.homeX,dz=this.body.p[2]-a.homeZ;a.x=a.homeX+dx*t*.50;a.z=a.homeZ+dz*t*.50;a.y=this.world.height(a.x,a.z)+Math.max(0,Math.sin(a.age*5+a.phase))*.38;}}
 navigation(yaw){
  const x=this.body.p[0],z=this.body.p[2];let nearest=null,best=Infinity;
  for(const p of this.world.landmarks){if(p.upgrade&&this.found.has(p.upgrade))continue;if(!p.upgrade&&p.kind!=='service'&&p.kind!=='delivery')continue;
   const dx=p.x-x,dz=p.z-z,d=Math.hypot(dx,dz),angle=Math.atan2(Math.sin(Math.atan2(dx,dz)-yaw),Math.cos(Math.atan2(dx,dz)-yaw));
   if(Math.abs(angle)>.36&&d>20)continue;if(d<best){best=d;nearest={point:p,distance:d};}
  }
  return nearest?`${nearest.point.upgrade?NAMES[nearest.point.upgrade]:nearest.point.label} · ${Math.round(nearest.distance)} М`:'';
 }
 rescueTarget(){const p=this.checkpoint;return {section:{recoveryPoint:p},u:0};}
 get summary(){const r=this.run;return `ТЮНИНГ ${this.found.size}/6 · ПОВРЕЖДЕНИЯ ${r.stats.collisions+r.stats.hardLandings} · ПЕРЕВОРОТЫ ${r.stats.rollovers} · ЛЕБЁДКА ${this.winchUses} · ГРУЗ ${this.cargo.crates} ЯЩ. / ${this.cargo.condition}%`;}
}

// Manually opened map uses a cached cartographic background.
const mapBackgrounds=new WeakMap();
const MARKERS={tires:'1 MT',winch:'2 ЛБ',suspension:'3 ПД',snorkel:'4 ШН'};
export function drawExpeditionMap(canvas,session,{mini=false}={}){
 const ctx=canvas.getContext('2d'),m=session.world.map,W=canvas.width,H=canvas.height;
 const px=z=>(3000-z)/6000*W,py=x=>(x+1500)/3000*H;
 let cached=mapBackgrounds.get(canvas);
 if(!cached||cached.map!==m){const image=document.createElement('canvas');image.width=W;image.height=H;const c=image.getContext('2d');c.fillStyle='#111e1a';c.fillRect(0,0,W,H);
  for(let x=-1500;x<1500;x+=128)for(let z=-3000;z<3000;z+=128){const biome=m.biomeAt(x+64,z+64);c.fillStyle={FOREST:'#355141',FIELD:'#7a8154',BOG:'#485747',VILLAGE:'#807359',RIVER:'#416f82'}[biome];c.fillRect(px(z+128),py(x),128/6000*W+1,128/3000*H+1);}
  c.strokeStyle='#5993ac';c.lineWidth=H*.025;c.beginPath();for(let x=-1500;x<=1500;x+=30){const z=m.river(x).center;if(x===-1500)c.moveTo(px(z),py(x));else c.lineTo(px(z),py(x));}c.stroke();
  const colors={TRACK:'#e6d8ae',FOREST:'#a7bd7b',RUTS:'#b48b65',BOG:'#977353',ROCKS:'#bdc4c1',GULLY:'#668557'};
  for(const road of m.roads)for(let i=1;i<road.path.length;i++){const p=road.path[i-1],q=road.path[i],profile=m.routeProfile({road,distanceAlong:(p.s+q.s)/2});c.strokeStyle=road.surface==='bridge'?'#f9d567':road.surface==='ford'?'#c4edf8':colors[profile.stage];c.lineWidth=mini?1.5:2.5;c.setLineDash(profile.cleared?[]:[3,3]);c.beginPath();c.moveTo(px(p.z),py(p.x));c.lineTo(px(q.z),py(q.x));c.stroke();}c.setLineDash([]);
  cached={map:m,image};mapBackgrounds.set(canvas,cached);
 }
 ctx.drawImage(cached.image,0,0);ctx.font='bold '+(mini?21:18)+'px sans-serif';ctx.lineWidth=mini?4:3;ctx.strokeStyle='#102018';
 for(const p of m.landmarks){if(mini&&!p.upgrade&&p.kind!=='delivery'&&p.kind!=='depot')continue;const x=px(p.z),y=py(p.x);ctx.fillStyle=p.upgrade?(session.found.has(p.upgrade)?'#65e8a4':'#ffe16c'):p.kind==='delivery'?'#ffad68':'#eff7dd';ctx.beginPath();ctx.arc(x,y,mini?7:6,0,Math.PI*2);ctx.fill();
  const label=mini?(p.upgrade?MARKERS[p.upgrade]:p.kind==='delivery'?'🍺':'СТАРТ'):(p.upgrade?NAMES[p.upgrade]:p.label),textX=Math.min(W-(mini?74:220),Math.max(8,x+8)),textY=Math.max(22,y-10);ctx.strokeText(label,textX,textY);ctx.fillText(label,textX,textY);
 }
 const b=session.body,x=px(b.p[2]),y=py(b.p[0]),front=rotate(b.q,[0,0,1]);ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(front[0],-front[2]));ctx.fillStyle='#fff';ctx.strokeStyle='#132';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-8,-7);ctx.lineTo(-5,0);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 if(!mini){ctx.fillStyle='#ddd';ctx.fillText('СЕВЕР ←   ·   SEED '+m.seed,12,H-12);}
}
