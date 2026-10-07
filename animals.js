import {boxContact,resolveBox} from './colliders.js?v=023';
import {trafficSafe} from './traffic.js?v=023';
export const ANIMAL_CONFIG={maxCows:4,maxChickens:8,spawnRange:[120,300],lifeAfterHit:2.5,maxDebris:12,cowChance:{FIELD:.60,VILLAGE:.56,FOREST:.008},chickenChance:{VILLAGE:.98,FIELD:.14,FOREST:0},standingChance:.48,cowPairChance:.32,chickenGroupChance:.68,cow:{width:.82,depth:2.35,height:1.65,loss:.62},chicken:{width:.42,depth:.60,height:.55}};
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function populateAnimals(world,section){
 section.animalEvents=[];if(section.id<4||!trafficSafe(section))return;
 const r=random(world.seed^Math.imul(section.id+1,0x27d4eb2d)),biome=section.biomeProfile.type;
 for(const type of ['COW','CHICKEN']){
  const chance=(type==='COW'?ANIMAL_CONFIG.cowChance:ANIMAL_CONFIG.chickenChance)[biome]||0;if(r()>chance)continue;
  const side=r()<.5?-1:1,standing=type==='COW'&&r()<ANIMAL_CONFIG.standingChance,standingOnRoad=standing&&r()<.3;
  const count=type==='COW'?(r()<ANIMAL_CONFIG.cowPairChance?2:1):(r()<ANIMAL_CONFIG.chickenGroupChance?2+Math.floor(r()*3):1);
  const baseU=.24+r()*.46;
  for(let member=0;member<count;member++)for(let attempt=0;attempt<4;attempt++){
   const u=Math.min(.80,baseU+member*5.5/section.length+(attempt? (r()-.5)*.18:0)),s=section.startDistance+u*section.length,p=world.point(section,u);
   if(section.localFeatures.some(o=>Math.abs((o.u-u)*section.length)<o.longRadius+(type==='COW'?5:2))||section.obstacles.some(o=>Math.abs((o.u-u)*section.length)<o.radius+5))continue;
   const node=section.nodes[Math.floor(u*(section.nodes.length-1))],offset=side*(standing?(standingOnRoad?node.width*.43:node.width/2+.65):node.width/2+(type==='COW'?1.8:-.4)),x=p.x+Math.cos(p.yaw)*offset,z=p.z-Math.sin(p.yaw)*offset,radius=type==='COW'?1.3:.4;
   if(section.animalEvents.some(a=>Math.abs(a.s-s)<(type==='COW'?3:1.1)))continue;
   if(world.sections.concat(section).some(q=>q.decorations.some(d=>{if(d.broken)return false;const dx=x-d.x,dz=z-d.z,c=Math.cos(d.rotation||0),sn=Math.sin(d.rotation||0),lx=dx*c-dz*sn,lz=dx*sn+dz*c;if(d.kind==='house'||d.kind==='hay'||d.kind==='parked')return Math.abs(lx)<d.width/2+radius&&Math.abs(lz)<d.depth/2+radius;if(d.kind==='fence')return Math.abs(lx)<.12+radius&&Math.abs(lz)<d.width/2+radius;return Math.hypot(dx,dz)<(d.radius||.4)+radius;})))continue;
   section.animalEvents.push({key:section.id+':'+type+':'+member,type,u,s,side,standing,standingOnRoad,delay:member*.8,speed:type==='COW'?.72+r()*.48:3.4+r()*1.4,phase:r()*6.28,activated:false,completed:false});break;
  }
 }
}
export class Animals{
 constructor(world,feedback,traffic){this.world=world;this.feedback=feedback;this.traffic=traffic;this.pool=Array.from({length:ANIMAL_CONFIG.maxCows+ANIMAL_CONFIG.maxChickens},()=>({active:false}));this.debris=Array.from({length:ANIMAL_CONFIG.maxDebris},()=>({active:false}));this.clear();}
 clear(){this.pool.forEach(a=>a.active=false);this.debris.forEach(a=>a.active=false);this.time=0;this.lastMoo=-20;this.lastHit='—';}
 get active(){return this.pool.filter(a=>a.active);}
 activate(playerS){for(const section of this.world.sections)for(const spec of section.animalEvents||[]){if(spec.activated||spec.completed)continue;const ahead=spec.s-playerS;if(ahead<ANIMAL_CONFIG.spawnRange[0]){if(ahead<0)spec.completed=true;continue;}if(ahead>ANIMAL_CONFIG.spawnRange[1])continue;if(this.world.sections.some(s=>s.exitDistance>playerS-40&&s.startDistance<spec.s&&(s.crestSafe||(!trafficSafe(s)&&!['BRAKING_ZONE','EXIT'].includes(s.type)))))continue;const same=this.active.filter(a=>a.type===spec.type).length;if(same>=(spec.type==='COW'?ANIMAL_CONFIG.maxCows:ANIMAL_CONFIG.maxChickens))continue;const slot=this.pool.find(a=>!a.active);if(!slot)continue;const p=this.world.point(section,spec.u),node=section.nodes[Math.floor(spec.u*(section.nodes.length-1))],lateral=spec.side*(spec.standing?(spec.standingOnRoad?node.width*.43:node.width/2+.65):node.width/2+(spec.type==='COW'?1.8:-.4)),x=p.x+Math.cos(p.yaw)*lateral,z=p.z-Math.sin(p.yaw)*lateral;if(this.traffic.active.some(n=>Math.hypot(n.x-x,n.z-z)<9))continue;
 Object.assign(slot,spec,spec.type==='COW'?ANIMAL_CONFIG.cow:ANIMAL_CONFIG.chicken,{active:true,sectionId:section.id,lateral,x,z,y:this.world.height(x,z),rotation:p.yaw+(spec.side>0?-Math.PI/2:Math.PI/2),roadYaw:p.yaw,roadWidth:node.width,age:0});spec.activated=true;}}
 tick(dt,body){this.time+=dt;const player=this.world.locate(body.p[0],body.p[2]);this.activate(player.s);for(const a of this.pool){if(!a.active)continue;const section=this.world.sections.find(s=>s.id===a.sectionId);if(!section||a.s<player.s-55){a.active=false;continue;}a.age+=dt;if(!a.standing&&a.age>=(a.delay||0)&&(a.type==='COW'||a.s-player.s<65)){a.lateral-=a.side*a.speed*dt;const p=this.world.point(section,a.u),wobble=a.type==='CHICKEN'?.14*Math.sin(a.age*8+a.phase):0;a.x=p.x+Math.cos(p.yaw)*a.lateral+Math.sin(p.yaw)*wobble;a.z=p.z-Math.sin(p.yaw)*a.lateral+Math.cos(p.yaw)*wobble;a.y=this.world.height(a.x,a.z);if(a.lateral*a.side<-a.roadWidth/2-3){a.active=false;continue;}}
 if(a.type==='COW'&&Math.hypot(a.x-body.p[0],a.z-body.p[2])<40&&this.time-this.lastMoo>13){this.feedback.emit('COW_MOO',{position:[a.x,a.y,a.z]});this.lastMoo=this.time;}
 if(!boxContact(body,a))continue;if(a.type==='CHICKEN'){this.feedback.burst([a.x,a.y+.4,a.z],body.v,32,'antifreeze');this.feedback.burst([a.x,a.y+.5,a.z],body.v,18,'feather');this.feedback.emit('CHICKEN_HIT',{position:[a.x,a.y,a.z]});a.active=false;this.lastHit='CHICKEN';continue;}
 const velocity=a.standing?[0,0]:[Math.cos(a.roadYaw)*-a.side*a.speed,-Math.sin(a.roadYaw)*-a.side*a.speed],hit=resolveBox(body,a,velocity,ANIMAL_CONFIG.cow.loss);if(!hit||hit.closing<.8)continue;this.feedback.emit('cowHit',{sourceId:'cow:'+a.key,impulse:hit.impulse,position:[a.x,a.y,a.z]});this.lastHit='COW';this.feedback.burst([a.x,a.y+1,a.z],body.v,72,'antifreeze');if(hit.closing>2){this.fragments(a,body);a.active=false;}}
 for(const d of this.debris){if(!d.active)continue;d.age+=dt;if(d.age>=ANIMAL_CONFIG.lifeAfterHit){d.active=false;continue;}d.v[1]-=9.81*dt;for(let i=0;i<3;i++)d.p[i]+=d.v[i]*dt;d.angle+=dt*d.spin;const ground=this.world.height(d.p[0],d.p[2])+.15;if(d.p[1]<ground){d.p[1]=ground;d.v[1]=Math.abs(d.v[1])*.25;d.v[0]*=.96;d.v[2]*=.96;}}}
 fragments(a,body){for(let i=0;i<3;i++){const slot=this.debris.find(d=>!d.active);if(!slot)break;Object.assign(slot,{active:true,age:0,p:[a.x,a.y+.7+i*.25,a.z],v:[body.v[0]*.25+Math.cos(a.rotation)*(i-1)*2,3+i,body.v[2]*.25+Math.sin(a.rotation)*(i-1)*2],angle:0,spin:2+i,size:i===0?[.85,.65,1.4]:i===1?[.48,.45,.65]:[.6,.25,.6],color:i===1?[.19,.16,.13]:[.85,.82,.71]});}}
 shift(dx,dz){for(const a of this.pool)if(a.active){a.x-=dx;a.z-=dz;}for(const d of this.debris)if(d.active){d.p[0]-=dx;d.p[2]-=dz;}}
}
