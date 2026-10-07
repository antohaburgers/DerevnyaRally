import {RoadWorld,ROAD_CONFIG,jumpElevation,envelope} from './road-world.js?v=022';
import {populateVillage,populateField,BiomeStream,BIOME_CONFIG} from './biomes.js?v=022';
import {populateScenery} from './scenery.js?v=022';
import {populatePickups} from './pickups.js?v=022';
import {populateAnimals} from './animals.js?v=022';
import {populateFarmers} from './farmers.js?v=022';
const TAU=Math.PI*2,mod=(a,b)=>(a%b+b)%b;
export const CIRCUIT_CONFIG={laps:3,minLength:1500,maxLength:2000,checkpointSpacing:80,startLine:115,gridGap:10,gridFront:90,roadWidth:9.4,visibleDistance:550};
// The periodic skeleton is built first. Arc-length resampling prevents a speed-dependent seam.
export function makeSkeleton(seed){let rng=seed>>>0;const r=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;},target=1650+r()*250,phase=r()*TAU,rotation=r()*TAU,amplitudes=[.07+r()*.025,.035+r()*.025,.017+r()*.014],raw=[];let length=0;
 for(let i=0;i<=2048;i++){const t=i/2048*TAU,radius=1+amplitudes[0]*Math.sin(3*t+phase)+amplitudes[1]*Math.sin(5*t-phase)+amplitudes[2]*Math.sin(8*t+phase*.5),x=radius*Math.cos(t+rotation),z=radius*Math.sin(t+rotation);if(i)length+=Math.hypot(x-raw[i-1].x,z-raw[i-1].z);raw.push({x,z,s:length});}
 const scale=target/length,origin={...raw[0]};for(const p of raw){p.x=(p.x-origin.x)*scale;p.z=(p.z-origin.z)*scale;p.s*=scale;}raw.at(-1).x=raw[0].x;raw.at(-1).z=raw[0].z;const total=raw.at(-1).s;
 const sample=s=>{s=mod(s,total);let lo=0,hi=raw.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(raw[m].s<=s)lo=m;else hi=m;}const a=raw[lo],b=raw[hi],u=(s-a.s)/(b.s-a.s);return{x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u};};
 const point=s=>{const p=sample(s),a=sample(s-.5),b=sample(s+.5),yaw=Math.atan2(b.x-a.x,b.z-a.z),t=mod(s,total)/total*TAU;return{...p,y:1.6*Math.sin(t*2)+.7*Math.sin(t*5+phase)-.7*Math.sin(phase),yaw};};return{length:total,point};}
export function buildCircuit(world,seed){
 if(!world.atDistance)installCircuitSupport(world.constructor);const skeleton=makeSkeleton(seed);world.reset(seed);while(world.sections.at(-1).exitDistance<skeleton.length)world.append();const sections=world.sections,oldTotal=sections.at(-1).exitDistance,factor=skeleton.length/oldTotal;
 world.circular=true;world.circuitLength=skeleton.length;world.skeleton=skeleton;world.offset=[0,0];world.nextPickupS=150;world.biomes=new BiomeStream(seed);
 for(const s of sections){s.startDistance*=factor;s.length*=factor;s.exitDistance=s.startDistance+s.length;s.biomeProfile=world.biomes.sample(s.startDistance);const f=s.startDistance/skeleton.length;const type=f<.32?'FOREST':f<.56?'FIELD':f<.72?'VILLAGE':f<.91?'FIELD':'FOREST';s.biomeProfile={...s.biomeProfile,type,previous:f<.32?'FOREST':f<.56?'FOREST':f<.72?'FIELD':f<.91?'VILLAGE':'FIELD',start:skeleton.length*(f<.32?0:f<.56?.32:f<.72?.56:f<.91?.72:.91),id:f<.32?0:f<.56?1:f<.72?2:f<.91?3:4,name:BIOME_CONFIG.names[seed%BIOME_CONFIG.names.length],length:s.length};s.hill=null;s.obstacles=[];s.decorations=[];s.visualDecor=[];s.pickups=[];s.animalEvents=[];s.farmerEvents=[];s.nodes=[];s.decorationRevision++;if(s.startDistance<180||s===sections.at(-1)){s.type=s.id===0?'START_FINISH':'EXIT';s.mode='FAST';s.localFeatures=[];s.crestSafe=false;}s.width=CIRCUIT_CONFIG.roadWidth;s.asphalt=s.biomeProfile.type==='VILLAGE'||s.startDistance%skeleton.length>skeleton.length*.78;s.surface=s.asphalt?'ASPHALT':'DIRT';
 // Keep terrain features local; no height offset accumulates around the loop.
 for(let i=0,n=Math.ceil(s.length/1.5);i<=n;i++){const u=i/n,at=s.startDistance+s.length*u,p=skeleton.point(at),jump=jumpElevation(s.type,u*s.length,s.length)*envelope(u),hill=(s.type==='TECHNICAL_HILL'?Math.min(5,s.length*.08):s.type==='STEEP_DESCENT'?-Math.min(4,s.length*.065):s.type==='FAST_HILL'?2:0)*Math.sin(Math.PI*u)**4;s.nodes.push({...p,y:p.y+jump+hill,width:CIRCUIT_CONFIG.roadWidth,u,s:at});}
 s.entryTransform={...s.nodes[0]};s.exitTransform={...s.nodes.at(-1)};s.startHeight=s.nodes[0].y;s.endHeight=s.nodes.at(-1).y;s.entryDirection=s.nodes[0].yaw;s.exitDirection=s.nodes.at(-1).yaw;
 }
 // Exact shared endpoint, width and tangent. Angles remain unwrapped within a section.
 for(let k=0;k<sections.length;k++){const s=sections[k];for(let i=1;i<s.nodes.length;i++){let a=s.nodes[i].yaw,b=s.nodes[i-1].yaw;while(a-b>Math.PI)a-=TAU;while(a-b<-Math.PI)a+=TAU;s.nodes[i].yaw=a;}s.exitTransform={...s.nodes.at(-1)};}
 const first=sections[0].nodes[0],last=sections.at(-1).nodes.at(-1);Object.assign(last,{x:first.x,y:first.y,z:first.z,width:first.width});sections.at(-1).exitTransform={...last};
 world.binsDirty=true;world.indexSegments();
 for(const s of sections){populateVillage(world,s);populateField(world,s);world.populateParking(s);populateScenery(world,s);populatePickups(world,s);populateAnimals(world,s);populateFarmers(world,s);
 // Three forest layers include cheap distant silhouettes; only nearby trunks collide.
 const r=()=>world.random();for(let i=0;i<Math.ceil(s.length/5);i++){const u=r(),p=world.point(s,u),side=r()<.5?-1:1,lateral=side*(s.width/2+4+r()*25);if(r()>(s.biomeProfile.type==='FOREST'?.9:s.biomeProfile.type==='FIELD'?.055:.13))continue;s.decorations.push({kind:'tree',category:i%5===0?'LARGE':'MEDIUM',radius:i%5===0?.46:.25,broken:false,u,x:p.x+Math.cos(p.yaw)*lateral,z:p.z-Math.sin(p.yaw)*lateral,y:p.y,scale:3.7+r()*2,rotation:r()*TAU,variant:i%3});}
 if(s.startDistance<180||s.exitDistance>skeleton.length-70){s.animalEvents=[];s.farmerEvents=[];s.pickups=[];s.localFeatures=[];s.decorations=s.decorations.filter(d=>d.kind!=='parked');}
 }
 for(const s of sections)s.decorations=s.decorations.filter(d=>{if(d.kind!=='tree')return true;const p=world.locate(d.x,d.z);return Math.abs(p.lateral)>p.width/2+3;});world.current=sections[0];world.revision++;world.binsDirty=true;return world;
}
export function installCircuitSupport(RoadClass=RoadWorld){const original={reset:RoadClass.prototype.reset,update:RoadClass.prototype.update,index:RoadClass.prototype.indexSegments,locate:RoadClass.prototype.locate};
 RoadClass.prototype.reset=function(seed){this.circular=false;original.reset.call(this,seed);};
 RoadClass.prototype.indexSegments=function(){if(!this.circular)return original.index.call(this);this.bins.clear();for(const section of this.sections)for(let i=0;i<section.nodes.length-1;i++){const a=section.nodes[i],b=section.nodes[i+1],entry={section,i,a,b};for(let x=Math.floor(Math.min(a.x,b.x)/8)-1;x<=Math.floor(Math.max(a.x,b.x)/8)+1;x++)for(let z=Math.floor(Math.min(a.z,b.z)/8)-1;z<=Math.floor(Math.max(a.z,b.z)/8)+1;z++){const key=x+','+z;if(!this.bins.has(key))this.bins.set(key,[]);this.bins.get(key).push(entry);}}this.binsDirty=false;};
 RoadClass.prototype.locate=function(x,z){if(!this.circular)return original.locate.call(this,x,z);if(this.binsDirty)this.indexSegments();let candidates=this.bins.get(Math.floor(x/8)+','+Math.floor(z/8));if(!candidates)candidates=this.sections.flatMap(section=>section.nodes.slice(0,-1).map((a,i)=>({section,i,a,b:section.nodes[i+1]})));let best=null,dist=Infinity;for(const {section,i,a,b} of candidates){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),cx=a.x+dx*t,cz=a.z+dz*t,d=(x-cx)**2+(z-cz)**2;if(d<dist){dist=d;const yaw=a.yaw+(b.yaw-a.yaw)*t;best={section,index:i,t,x:cx,z:cz,y:a.y+(b.y-a.y)*t,yaw,width:a.width+(b.width-a.width)*t,u:a.u+(b.u-a.u)*t,s:a.s+(b.s-a.s)*t,lateral:(x-cx)*Math.cos(yaw)-(z-cz)*Math.sin(yaw)};}}return best;};
 RoadClass.prototype.update=function(x,z){if(!this.circular)return original.update.call(this,x,z);const p=this.locate(x,z);this.current=p.section;return p;};
 RoadClass.prototype.atDistance=function(s){if(this.circular)s=mod(s,this.circuitLength);const section=this.sections.find(q=>s>=q.startDistance&&s<=q.exitDistance)||this.sections.at(-1),u=Math.max(0,Math.min(1,(s-section.startDistance)/section.length));return{...this.point(section,u),section,u,s};};
}
installCircuitSupport();
