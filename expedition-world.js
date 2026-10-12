import {ExpeditionMap} from './expedition-map.js?v=061';
import {SURFACE_CONFIG,SURFACE_SETTINGS} from './surfaces.js?v=048';

// Adapter for the ORIGINAL game's height / surface / section interfaces.
// Terrain triangles and tyre contacts share the same global two-metre lattice.
export const EXPEDITION_WORLD_CONFIG={grid:2,detailGrid:.5,chunkSize:128,radius:2,maxChunks:25};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class ExpeditionWorld {
 constructor(seed,environment){this.environment=environment;this.openWorld=true;this.circular=false;this.finiteRace=false;this.offroadMode=true;this.reset(seed);}
 reset(seed){this.map=new ExpeditionMap(seed,{plannerOnly:true});this.seed=this.map.seed;this.offset=[0,0];this.revision=(this.revision||0)+1;this.nextId=0;this.sections=[];this.sectionCache=new Map();this.heightCache=new Map();this.detailCache=new Map();this.fineCache=new Map();this.cacheCenter=null;this.destroyed=new Set();this.update(this.map.start.x,this.map.start.z);}
 get config(){return this.map.config;}get start(){return this.map.start;}get goal(){return this.map.goal;}
 get roads(){return this.map.roads;}get landmarks(){return this.map.landmarks;}
 vertex(gx,gz){const cx=Math.floor(gx/64),cz=Math.floor(gz/64),key=cx+':'+cz;let grid=this.heightCache.get(key);if(!grid){grid=new Map();this.heightCache.set(key,grid);}const id=gx+':'+gz;if(!grid.has(id))grid.set(id,this.map.terrainHeight(gx*2,gz*2));return grid.get(id);}
 detailedCell(gx,gz){const key=gx+':'+gz;if(!this.detailCache.has(key))this.detailCache.set(key,this.map.terrain.detailedCell(gx,gz));return this.detailCache.get(key);}
 fineVertex(hx,hz){const key=hx+':'+hz;if(this.fineCache.has(key))return this.fineCache.get(key);const gx=Math.floor(hx/4),gz=Math.floor(hz/4),u=(hx%4+4)%4/4,v=(hz%4+4)%4/4;let h;
  // Stitch refined patches to coarse neighbours on the common two-metre edges.
  if(!u&&!v)h=this.vertex(gx,gz);
  else if(!u&&(!this.detailedCell(gx-1,gz)||!this.detailedCell(gx,gz)))h=this.vertex(gx,gz)*(1-v)+this.vertex(gx,gz+1)*v;
  else if(!v&&(!this.detailedCell(gx,gz-1)||!this.detailedCell(gx,gz)))h=this.vertex(gx,gz)*(1-u)+this.vertex(gx+1,gz)*u;
  else h=this.map.terrainHeight(hx*.5,hz*.5);
  this.fineCache.set(key,h);return h;
 }
 height(x,z){const coarseX=Math.floor(x/2),coarseZ=Math.floor(z/2),fine=this.detailedCell(coarseX,coarseZ),step=fine?.5:2,gx=Math.floor(x/step),gz=Math.floor(z/step),u=x/step-gx,v=z/step-gz,at=fine?(x,z)=>this.fineVertex(x,z):(x,z)=>this.vertex(x,z),a=at(gx,gz),b=at(gx+1,gz),c=at(gx,gz+1),d=at(gx+1,gz+1);return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
 normal(x,z){const h=.12,a=this.height(x-h,z)-this.height(x+h,z),b=this.height(x,z-h)-this.height(x,z+h),L=Math.hypot(a,2*h,b);return[a/L,2*h/L,b/L];}
 surface(x,z){const raw=this.map.surfaceAt(x,z),c={...SURFACE_CONFIG[raw.surfaceType]},wetness=this.environment?.wetness||0;
  // The rendered water has a constant level; depth is measured from the tyre bed.
  const waterDepth=raw.waterDepth>0?Math.max(0,3-this.height(x,z)):0;
  let mudDepth=raw.mudDepth*(1+wetness*.25);
  if(raw.surfaceType==='MUD'||raw.surfaceType==='PEAT'){c.longitudinalGrip*=1-SURFACE_SETTINGS.mudGripLoss*Math.min(.9,mudDepth);c.lateralGrip*=1-.45*Math.min(.9,mudDepth);c.rollingResistance+=SURFACE_SETTINGS.mudResistance*mudDepth;c.sinkAmount=Math.min(.15,c.sinkAmount*mudDepth);}
  if(waterDepth)c.rollingResistance+=waterDepth*SURFACE_SETTINGS.waterResistance;
  return {...raw,...c,mudDepth,waterDepth,wetness,sectionId:this.tileKey(x,z),sectionType:'EXPEDITION',offroadFactor:raw.onRoad?0:.35};
 }
 tileKey(x,z){return Math.floor(x/128)+':'+Math.floor(z/128);}
 makeSection(tile){const {key,x0,z0,size}=tile,center={x:x0+64,z:z0+64},road=this.map.roadAt(center.x,center.z);
  const p={x:road?.x??center.x,z:road?.z??center.z,yaw:road?.yaw??Math.PI,width:road?.road.width??6};p.y=this.height(p.x,p.z);
  const section={id:key,openTile:tile,type:'EXPEDITION',mode:'EXPEDITION',surface:'DIRT',length:128,startDistance:2700-p.z,exitDistance:2828-p.z,width:p.width,entryTransform:{x:x0,z:z0,y:0,yaw:0},nodes:[{...p,u:0,s:2700-p.z},{...p,u:1,s:2828-p.z}],routePoint:p,biomeProfile:{type:tile.biome,previous:tile.biome,start:0},localFeatures:[],obstacles:[],decorations:[],visualDecor:[],pickups:[],farmerEvents:[],animalEvents:[],decorationRevision:0};
  let state=(this.seed^Math.imul(tile.cx,2654435761)^Math.imul(tile.cz,1597334677))>>>0;const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const put=(kind,x,z,extra={},visual=false)=>{if(x<x0||x>=x0+size||z<z0||z>=z0+size)return;const id=key+':'+kind+':'+x.toFixed(2)+':'+z.toFixed(2);(visual?section.visualDecor:section.decorations).push({id,kind,x,z,y:this.height(x,z),rotation:r()*Math.PI*2,broken:this.destroyed.has(id),...extra});};
  // Same tree, grass, hay, house, fence and scenery recipes as buildChunk().
  for(let i=0;i<95;i++){const x=x0+r()*size,z=z0+r()*size,biome=this.map.biomeAt(x,z),near=this.map.roadAt(x,z);if(!this.map.bounds(x,z)||this.map.riverDepth(x,z)>0)continue;
   if(this.landmarks.some(p=>Math.hypot(p.x-x,p.z-z)<(p.inForest?5:65)))continue;
   const route=this.map.routeProfile(near);const density=biome==='FOREST'?.88:biome==='BOG'?.30:.09;
   if(near&&near.distance<route.width/2+(route.cleared?2.4:.7))continue;
   if(r()<density)put('tree',x,z,{scale:3.3+r()*4.3,radius:.13+r()*.22,category:r()<.3?'SMALL':'MEDIUM',variant:Math.floor(r()*3)});
   else if(biome==='FIELD'&&r()<.14)put('hay',x,z,{width:1.9,height:1.5,depth:1.7,variant:r()<.3?'square':'round'});
   else if(r()<.4)put('scrub',x,z,{scale:.6+r(),variant:0},true);
  }
  for(let i=0;i<85;i++){const x=x0+r()*size,z=z0+r()*size,near=this.map.roadAt(x,z);if(this.map.riverDepth(x,z)>0)continue;if(near&&near.distance<this.map.routeProfile(near).width/2&&this.map.routeProfile(near).cleared)continue;put('grass',x,z,{scale:.8+r(),variant:this.map.biomeAt(x,z)==='FIELD'?1:0},true);}
  for(const item of this.landmarks){if(item.inForest)continue;if(Math.hypot(item.x-center.x,item.z-center.z)>200)continue;
   const village=['village','delivery','depot'].includes(item.kind),count=village?8:2;
   for(let i=0;i<count;i++){const side=i%2?1:-1,x=item.x+side*(26+Math.floor(i/4)*28),z=item.z+(Math.floor(i/2)-1.5)*30;
    const path=this.map.roadAt(x,z);if(path&&path.distance<path.road.width/2+6)continue;
    put('house',x,z,{width:7,height:3,depth:8,variant:i%2,side,rotation:0});
    put('fence',x-side*7,z,{width:12,height:1.2,depth:.2,rotation:0});
    put('pole',x-side*10,z+8,{},true);
   }
   put('sign',item.x+8,item.z,{text:item.label,width:4.4,height:.8,rotation:0});
   if(village)put('well',item.x-12,item.z+12,{},true);else put(item.kind==='service'?'canopy':'shed',item.x+15,item.z+13,{},true);
  }
  const river=this.map.river(1200);
  for(let z=Math.floor((river.center-river.halfWidth)/12)*12;z<river.center+river.halfWidth;z+=12)for(const side of [-1,1])put('fence',1200+side*3.7,z,{width:12,height:1.2,depth:.2,rotation:0});
  return section;
 }
 update(x,z){const result=this.map.update(x,z),wanted=new Set(result.active.map(t=>t.key));let changed=false;
  for(const [key,s] of this.sectionCache)if(!wanted.has(key)){for(const d of [...s.decorations,...s.visualDecor])if(d.broken)this.destroyed.add(d.id);this.sectionCache.delete(key);changed=true;}
  for(const tile of result.active)if(!this.sectionCache.has(tile.key)){this.sectionCache.set(tile.key,this.makeSection(tile));changed=true;}
  this.sections=result.active.map(t=>this.sectionCache.get(t.key));this.current=this.sectionCache.get(this.tileKey(x,z))||this.sections[0];
  if(changed){this.revision++;this.nextId++;}
  // Keep contacts at chunk edges and camera queries, discard remote sampled grids.
  const cx=Math.floor(x/128),cz=Math.floor(z/128),center=cx+':'+cz;
  if(this.cacheCenter!==center){this.cacheCenter=center;
   for(const key of this.heightCache.keys()){const [a,b]=key.split(':').map(Number);if(Math.abs(a-cx)>3||Math.abs(b-cz)>3)this.heightCache.delete(key);}
   for(const cache of [this.detailCache,this.fineCache])for(const key of cache.keys()){const [a,b]=key.split(':').map(Number),scale=cache===this.fineCache?.5:2;if(Math.abs(a*scale/128-cx)>4||Math.abs(b*scale/128-cz)>4)cache.delete(key);}
   this.map.terrain.prune(x,z);
  }
  return this.locate(x,z);
 }
 locate(x,z){const road=this.map.roadAt(x,z),p={x:road?.x??x,z:road?.z??z,yaw:road?.yaw??Math.PI,width:road?.road.width??6};return {...p,y:this.height(p.x,p.z),s:2700-z,u:.5,lateral:road?.lateral??0,distance:road?.distance??Infinity,section:this.sectionCache.get(this.tileKey(x,z))||this.current};}
 point(section,u=.5){const p=section?.recoveryPoint||section?.routePoint||{...this.start,yaw:Math.PI,width:7};return {...p,y:this.height(p.x,p.z),section,u,s:2700-p.z};}
 localHeight(){return 0;}submergedRockHeight(){return 0;}
 atDistance(s){return this.locate(this.start.x,2700-s);}
 // Exact same winding and lattice interpolation as height(). No separate road decal height.
 terrainTriangles(section,triangle){const {x0,z0,size}=section.openTile,points=new Map(),pt=(x,z)=>{const key=x+':'+z;if(points.has(key))return points.get(key);const p=[x-x0,this.height(x,z),z-z0],road=this.map.roadAt(x,z),route=this.map.routeProfile(road);p.uv=[z%4096,road?.lateral??0,road?road.distance/(route.width/2||1):2,this.map.biomeAt(x,z)==='FIELD'?1:0];points.set(key,p);return p;};
  for(let z=z0;z<z0+size;z+=2)for(let x=x0;x<x0+size;x+=2){const step=this.detailedCell(x/2,z/2)?.5:2;
   for(let dz=0;dz<2;dz+=step)for(let dx=0;dx<2;dx+=step){const px=x+dx,pz=z+dz,a=pt(px,pz),b=pt(px+step,pz),c=pt(px,pz+step),d=pt(px+step,pz+step),raw=this.map.surfaceAt(px+step/2,pz+step/2),key=raw.roadType==='bridge'&&raw.onRoad?'WOOD':raw.obstacle?.startsWith('LOG')?'WOOD':raw.surfaceType;
    triangle(key,a,b,c);triangle(key,b,d,c);
    if(raw.waterDepth>0){const water=p=>{const q=[p[0],3.02,p[2]];q.uv=p.uv;return q;};triangle('WATER_TOP',water(a),water(b),water(c));triangle('WATER_TOP',water(b),water(d),water(c));}
   }
  }
 }
}
