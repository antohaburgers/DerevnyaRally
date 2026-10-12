import {OBSTACLE_CONFIG,obstacleWeight,hillElevation} from './obstacles.js?v=042';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

// Existing offroad obstacle recipes, placed in X/Z rather than a road corridor.
// Only feature descriptors are planned globally. Geometry stays in streamed chunks.
export class ExpeditionTerrain {
 constructor(map){this.map=map;this.routeBins=new Map();this.fieldBins=new Map();this.cells=new Map();this.nextId=0;this.lastCell=null;this.combinedBins=new Map();
  for(const road of map.roads){if(['bridge','ford'].includes(road.surface))continue;
   for(let s=90;s<road.length-60;s+=105){const p=this.roadPoint(road,s),profile=map.routeProfile({...p,road,distanceAlong:s});if(profile.stage==='TRACK'||!this.clear(p.x,p.z))continue;
    this.index(this.recipe(profile.stage,p.x,p.z,p.yaw,road.difficulty/4,random(map.seed^Math.imul(road.id*10000+Math.round(s),2246822519)),'route:'+road.id+':'+s),this.routeBins);
   }
  }
 }
 roadPoint(road,s){let i=1;while(i<road.path.length-1&&road.path[i].s<s)i++;const a=road.path[i-1],b=road.path[i],u=clamp((s-a.s)/(b.s-a.s||1),0,1);return{x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,yaw:Math.atan2(b.x-a.x,b.z-a.z)};}
 clear(x,z){return this.map.bounds(x,z)&&Math.abs(z-this.map.river(x).center)>this.map.river(x).halfWidth+45&&!this.map.landmarks.some(p=>Math.hypot(p.x-x,p.z-z)<(p.inForest?15:90));}
 recipe(stage,x,z,yaw,difficulty,r,owner){const features=[],c=Math.cos(yaw),sn=Math.sin(yaw),strength=.60+difficulty*.65;
  const add=(kind,along,lateral,extra={})=>{const settings=OBSTACLE_CONFIG.types[kind],f={...settings,surfaceType:kind.startsWith('LOG')?'DIRT':settings.surfaceType,kind,x:x+sn*along+c*lateral,z:z+c*along-sn*lateral,yaw,u:0,lateral:0,owner,id:owner+':'+features.length,height:settings.height*strength,...extra};
   if(f.shape==='bank'){f.startU=-.38;f.endU=.38;f.longRadius=14;}
   if(f.shape==='long_rut'){f.startU=-.40;f.endU=.40;}
   // Extra room for blending and exact shared-cell edges.
   f.c=Math.cos(f.yaw);f.sn=Math.sin(f.yaw);f.bound=Math.max(f.radius||1,f.longRadius||1)*(f.shape==='log'?2:3)+3;features.push(f);return f;};
  if(stage==='FOREST'){for(let i=0;i<3;i++)add(i===2?'LOG_LARGE':'LOG_MEDIUM',(i-1)*8,(r()-.5)*2,{radius:2.7,longRadius:.45});add('POTHOLE',4,1.9,{radius:1.5,longRadius:2.2});}
  else if(stage==='RUTS'){for(const side of [-1,1])add('CHESS_HOLE',0,side*.85,{shape:'long_rut',height:-.28*strength,radius:.48,longRadius:18,mudDepth:.52+difficulty*.25,pathWander:.26,pathPhase:r()*6.28});for(let i=0;i<3;i++){add('CHESS_LIFT',(i-1)*7,i%2?.85:-.85);add('CHESS_HOLE',(i-1)*7+2,i%2?-.85:.85);}}
  else if(stage==='BOG'){add('PEAT_POOL',0,0,{radius:6.5,longRadius:14,peatDepth:.58+difficulty*.27,mudDepth:.55+difficulty*.23,height:-.24*strength});for(const side of [-1,1])add('CHESS_HOLE',1,side*.9,{shape:'long_rut',height:-.23*strength,radius:.50,longRadius:20,mudDepth:.65,startU:-.40,endU:.40});add('GULLY_LIP',13,0,{radius:6,height:.19*strength});}
  else if(stage==='ROCKS'){for(let i=0;i<4;i++){add('ROCK_STEP',(i-1.5)*7,i%2?.5:-.5,{radius:2.4,height:(.27+r()*.16)*strength});add('ROCK_CRAWL_BOULDER',(i-1.5)*7+3,(i%2?1:-1)*1.5,{height:(.36+r()*.18)*strength});}}
  else if(stage==='GULLY'){add('DIAGONAL_GULLY',0,0,{radius:8,longRadius:3.2,skew:.9+r()*.4,height:-.64*strength});add('GULLY_LIP',5,0,{radius:7,longRadius:2.1,skew:1.1});add('SIDE_BANK',0,4,{radius:5,height:1.0*strength});}
  else if(stage==='HILL'){features.push({kind:'TECH_HILL',x,z,yaw,owner,id:owner+':hill',c,sn,hill:{start:-26,span:26,ramp:7,exitRamp:7,angle:14+difficulty*10,sign:1},bound:42,radius:18,longRadius:42});add('ROCK_STEP',1,.5,{height:.30*strength});add('DIAGONAL_GULLY',18,-.5,{height:-.40*strength,radius:5});}
  else {add('PIT',0,0,{radius:5,longRadius:7,height:-1.15*strength});add('BUMP',10,3,{radius:4,longRadius:6,height:.65*strength});}
  return features;
 }
 index(features,bins){this.combinedBins.clear();for(const f of features){for(let x=Math.floor((f.x-f.bound)/16);x<=Math.floor((f.x+f.bound)/16);x++)for(let z=Math.floor((f.z-f.bound)/16);z<=Math.floor((f.z+f.bound)/16);z++){const key=x+':'+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(f);}}}
 ensureCell(cx,cz){const key=cx+':'+cz;if(this.cells.has(key))return;const r=random(this.map.seed^Math.imul(cx,2654435761)^Math.imul(cz,1597334677));const x=(cx+.25+r()*.5)*128,z=(cz+.25+r()*.5)*128,difficulty=clamp((2400-z)/5100,0,1);
  let features=[];if(r()<.72&&this.clear(x,z)){const road=this.map.roadAt(x,z);if(!road||road.distance>18){const types=['FOREST','RUTS','BOG','ROCKS','GULLY','HILL','PITS'];features=this.recipe(types[Math.floor(r()*types.length)],x,z,r()*Math.PI*2,difficulty,r,key);}}
  this.cells.set(key,features);this.index(features,this.fieldBins);
 }
 nearby(x,z){const cx=Math.floor(x/128),cz=Math.floor(z/128),tile=cx+':'+cz;if(tile!==this.lastCell){for(let i=cx-1;i<=cx+1;i++)for(let j=cz-1;j<=cz+1;j++)this.ensureCell(i,j);this.lastCell=tile;}
  const key=Math.floor(x/16)+':'+Math.floor(z/16);if(!this.combinedBins.has(key))this.combinedBins.set(key,[...(this.routeBins.get(key)||[]),...(this.fieldBins.get(key)||[])]);return this.combinedBins.get(key);
 }
 weight(f,x,z){const dx=x-f.x,dz=z-f.z,c=f.c,s=f.sn,along=dx*s+dz*c,lateral=dx*c-dz*s;
  if(f.kind==='TECH_HILL'){const up=hillElevation(along,f.hill),down=hillElevation(along,{...f.hill,start:0,sign:-1});return (up+down)*Math.exp(-((lateral/15)**4));}
  if(Math.abs(dx)>f.bound||Math.abs(dz)>f.bound)return 0;
  const weight=obstacleWeight(f,along/50,lateral,50);return f.shape==='bank'?weight*smooth((f.radius*2.5-Math.abs(lateral))/f.radius):weight;
 }
 sample(x,z){let height=0,chosen=null,best=.16;
  for(const f of this.nearby(x,z)){const weight=this.weight(f,x,z);if(f.kind==='TECH_HILL'){height+=weight;continue;}height+=(f.height||0)*weight;
   const score=weight*(f.surfaceType==='ROCK'?1.5:1);if(score>best){best=score;chosen={...f,weight};}
  }
  return {height,feature:chosen};
 }
 detailedCell(gx,gz){const x=gx*2+1,z=gz*2+1;return this.nearby(x,z).some(f=>f.kind!=='TECH_HILL'&&Math.abs(x-f.x)<f.bound&&Math.abs(z-f.z)<f.bound&&Math.abs(this.weight(f,x,z))>.005);}
 prune(x,z){const cx=Math.floor(x/128),cz=Math.floor(z/128),remove=new Set();for(const key of this.cells.keys()){const [a,b]=key.split(':').map(Number);if(Math.abs(a-cx)>3||Math.abs(b-cz)>3){remove.add(key);this.cells.delete(key);}}
  if(remove.size){this.combinedBins.clear();for(const [key,list] of this.fieldBins){const kept=list.filter(f=>!remove.has(f.owner));if(kept.length)this.fieldBins.set(key,kept);else this.fieldBins.delete(key);}this.lastCell=null;}
 }
}
