import {resolveBox} from './colliders.js?v=018';
export const NPC_CONFIG={NIVA:{width:1.75,depth:3.8,height:1.8,speed:[50,75]},KOPEIKA:{width:1.64,depth:4.05,height:1.5,speed:[60,85]},TRACTOR:{width:2.05,depth:3.65,height:2.7,speed:[25,40]}};
export const TRAFFIC_CONFIG={maxNPC:3,minSpawn:170,maxSpawn:330,despawnBehind:55,crashLife:2.7,spacing:65,firstDistance:220};
const allowed=new Set(['FAST_STRAIGHT','SHORT_STRAIGHT','FAST_CURVE','FAST_S_CURVE','EXIT','BRAKING_ZONE']);
export function trafficSafe(section){return allowed.has(section.type)&&section.mode==='FAST'&&!section.crestSafe&&Math.min(...section.nodes.map(n=>n.width))>=7.1&&section.nodes.every((n,i)=>!i||Math.abs(n.yaw-section.nodes[i-1].yaw)/Math.max(.01,n.s-section.nodes[i-1].s)<.018);}
export function roadPose(world,s,lateral){const section=world.sections.find(q=>s>=q.startDistance&&s<=q.exitDistance);if(!section)return null;const u=(s-section.startDistance)/section.length,p=world.point(section,u),i=Math.min(section.nodes.length-1,Math.floor(u*(section.nodes.length-1))),width=section.nodes[i].width,offset=lateral??Math.min(2.2,Math.max(1.8,width*.24)),x=p.x+Math.cos(p.yaw)*offset,z=p.z-Math.sin(p.yaw)*offset;
 return{x,z,y:p.y+world.localHeight(section,u,offset),rotation:p.yaw+Math.PI,lateral:offset,section};}
export class Traffic{
 constructor(world,feedback){this.world=world;this.feedback=feedback;this.pool=Array.from({length:TRAFFIC_CONFIG.maxNPC},()=>({active:false}));this.clear();}
 random(){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return this.rng/4294967296;}
 clear(){this.pool.forEach(n=>n.active=false);this.rng=(this.world.seed^0x51a3b9)>>>0;this.time=0;this.cooldown=4;this.lastHit='—';this.spawnState='СТАРТ';}
 get active(){return this.pool.filter(n=>n.active);}
 spawn(playerS){const free=this.pool.find(n=>!n.active);if(!free){this.spawnState='POOL FULL';return false;}
 // Require a continuous visible, wide, easy road from the player to the spawn.
 const max=Math.min(TRAFFIC_CONFIG.maxSpawn,this.world.sections.at(-1).exitDistance-playerS-30);
 for(let distance=max;distance>=TRAFFIC_CONFIG.minSpawn;distance-=20){const s=playerS+distance,pose=roadPose(this.world,s);if(!pose||pose.section.id<4||pose.section.crestSafe||this.world.sections.some(q=>q.exitDistance>playerS+8&&q.startDistance<s&&!trafficSafe(q)))continue;
 if(this.world.sections.some(q=>q.crestSafe&&q.exitDistance>playerS-40&&q.exitDistance<s))continue;
 if(pose.section.localFeatures.some(o=>Math.abs(s-pose.section.startDistance-o.u*pose.section.length)<Math.max(10,o.longRadius+5)&&Math.abs(pose.lateral-o.lateral)<o.radius+1.1))continue;
 if(this.active.some(n=>Math.abs(n.s-s)<TRAFFIC_CONFIG.spacing))continue;
 const biome=pose.section.biomeProfile.type,r=this.random(),npcType=r<(pose.section.asphalt?.08:.25)?'TRACTOR':r<.6?'NIVA':'KOPEIKA',cfg=NPC_CONFIG[npcType],speed=(cfg.speed[0]+this.random()*(cfg.speed[1]-cfg.speed[0]))/3.6*(biome==='VILLAGE'?.8:1);
 Object.assign(free,{...cfg,active:true,crashed:false,age:0,s,speed,npcType,colorIndex:Math.floor(this.random()*4),wheelAngle:0,...pose});this.spawnState='SPAWN '+npcType;return true;}
 this.spawnState='WAIT · ОБЗОР / TECH';return false;}
 tick(dt,body){this.time+=dt;const player=this.world.locate(body.p[0],body.p[2]),biome=player.section.biomeProfile.type;this.cooldown-=dt;
 if(this.cooldown<=0&&player.s>TRAFFIC_CONFIG.firstDistance){const success=this.spawn(player.s);this.cooldown=success?(biome==='FOREST'?20:biome==='FIELD'?12:8)*(player.section.asphalt?.7:1)*( .85+this.random()*.3):1.8;}
 for(const n of this.pool){if(!n.active)continue;if(n.crashed){n.age+=dt;n.x+=n.vx*dt;n.z+=n.vz*dt;n.rotation+=n.spin*dt;n.vx*=Math.exp(-2*dt);n.vz*=Math.exp(-2*dt);if(n.age>TRAFFIC_CONFIG.crashLife)n.active=false;continue;}
 n.s-=n.speed*dt;const pose=roadPose(this.world,n.s);if(!pose||n.s<player.s-TRAFFIC_CONFIG.despawnBehind){n.active=false;continue;}Object.assign(n,pose);n.wheelAngle+=n.speed*dt/(n.npcType==='TRACTOR'?.65:.40);
 const velocity=[Math.sin(n.rotation)*n.speed,Math.cos(n.rotation)*n.speed],hit=resolveBox(body,n,velocity,.76);if(hit&&hit.closing>.3){n.crashed=true;n.age=0;n.vx=body.v[0]*.25;n.vz=body.v[2]*.25;n.spin=(hit.normal[0]*Math.cos(n.rotation)-hit.normal[1]*Math.sin(n.rotation))*1.7;this.lastHit=n.npcType;this.feedback.emit('trafficHit',{npcType:n.npcType,impulse:hit.impulse,position:[n.x,n.y,n.z]});}}
 }
 shift(dx,dz){for(const n of this.pool)if(n.active){n.x-=dx;n.z-=dz;}}
 debug(playerS){return `NPC ${this.active.length}/${TRAFFIC_CONFIG.maxNPC} · ${this.spawnState} · ${this.active.map(n=>`${n.npcType} ${(n.speed*3.6).toFixed(0)}км/ч L${n.lateral.toFixed(1)} D${Math.round(n.s-playerS)}м${n.crashed?' HIT':''}`).join(' / ')}`;}
}
