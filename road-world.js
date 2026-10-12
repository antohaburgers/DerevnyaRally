import {populateFarmers} from './farmers.js?v=028';
import {populateScenery} from './scenery.js?v=028';
import {populateAnimals} from './animals.js?v=028';
import {populatePickups} from './pickups.js?v=028';
import {BiomeStream,biomeWeights,populateVillage,populateField} from './biomes.js?v=028';
import {OBSTACLE_CONFIG,HILL_CONFIG,obstacleWeight,hillElevation} from './obstacles.js?v=042';
import {SURFACE_CONFIG,SURFACE_SETTINGS} from './surfaces.js?v=048';
export const ROAD_CONFIG={activeSections:9,behind:2,ahead:6,lengths:[40,54,68],widths:[6.4,7.2,8.0],corridor:48,treeLimit:38,step:2,maxHeadingOffset:1.10,maxCurve:.32,seed:731024};
export const SECTION_TYPES=['CHESS_AXLE','MOUNTAIN_PASS','PEAT_BOG','ROCK_CRAWL','CROSS_AXLE','ROCK_STEPS','SIDE_SLOPE','RUT_MAZE','EROSION_GULLY','DEEP_MUD','RUT_GAUNTLET','FOREST_FORD','FALLEN_LOGS','MUD_CLIMB','TIGHT_TURNS','FAST_STRAIGHT','SHORT_STRAIGHT','FAST_CURVE','FAST_S_CURVE','JUMP','EARTH_JUMP','BLIND_CREST','DOUBLE_WAVE','FAST_HILL','BRAKING_ZONE','CHICANE','HAIRPIN','TECH_S_CURVE','APEX_TURN','RUTS','TECHNICAL_HILL','STEEP_DESCENT','ROCK_SECTION','LOG_CROSSING','BUMP_CHAIN','WASHOUT','EXIT'];
export const RALLY_CONFIG={fastLengthScale:1.2,jumpHeight:.55,jumpWidth:5.5};
export const JUMP_TYPES=['JUMP','EARTH_JUMP','BLIND_CREST','DOUBLE_WAVE'];
export const FAST_TYPES=['FAST_STRAIGHT','SHORT_STRAIGHT','FAST_CURVE','FAST_S_CURVE',...JUMP_TYPES,'FAST_HILL','EXIT'];
// Separate technical route plans for Endless Off-road. Standard rally remains unchanged.
export const OFFROAD_GROUPS=[
 ['TIGHT_TURNS','DEEP_MUD','RUT_GAUNTLET','EXIT'],
 ['TECH_S_CURVE','MUD_CLIMB','FOREST_FORD','EXIT'],
 ['TIGHT_TURNS','FALLEN_LOGS','DEEP_MUD','EXIT'],
 ['RUT_GAUNTLET','STEEP_DESCENT','FOREST_FORD','EXIT'],
 ['TIGHT_TURNS','MUD_CLIMB','FALLEN_LOGS','EXIT'],
 ['TECH_S_CURVE','FOREST_FORD','RUT_GAUNTLET','DEEP_MUD','EXIT'],
 ['SHORT_STRAIGHT','CROSS_AXLE','RUT_MAZE','EXIT'],
 ['TECH_S_CURVE','ROCK_STEPS','MUD_CLIMB','EXIT'],
 ['SHORT_STRAIGHT','SIDE_SLOPE','FOREST_FORD','EXIT'],
 ['CROSS_AXLE','EROSION_GULLY','ROCK_STEPS','EXIT'],
 ['RUT_MAZE','SIDE_SLOPE','FALLEN_LOGS','EXIT'],
 ['TECH_S_CURVE','EROSION_GULLY','DEEP_MUD','EXIT'],
 ['ROCK_CRAWL','CROSS_AXLE','SIDE_SLOPE','EXIT'],
 ['TECH_S_CURVE','ROCK_CRAWL','EROSION_GULLY','EXIT'],
 ['SIDE_SLOPE','ROCK_CRAWL','RUT_MAZE','EXIT'],
 ['EROSION_GULLY','ROCK_STEPS','ROCK_CRAWL','EXIT'],
 ['ROCK_CRAWL','FOREST_FORD','CROSS_AXLE','EXIT'],
 ['EROSION_GULLY','SIDE_SLOPE','MUD_CLIMB','EXIT'],
 ['SIDE_SLOPE','CROSS_AXLE','FOREST_FORD','EXIT'],
 ['MUD_CLIMB','EROSION_GULLY','SIDE_SLOPE','EXIT'],
 ['ROCK_CRAWL','SIDE_SLOPE','EROSION_GULLY','EXIT'],
 ['CROSS_AXLE','MUD_CLIMB','FOREST_FORD','EXIT'],
 ['SIDE_SLOPE','EROSION_GULLY','ROCK_STEPS','EXIT'],
 ['TIGHT_TURNS','CHESS_AXLE','SIDE_SLOPE','EXIT'],
 ['TECH_S_CURVE','MOUNTAIN_PASS','CHESS_AXLE','EXIT'],
 ['PEAT_BOG','CROSS_AXLE','FOREST_FORD','EXIT'],
 ['ROCK_CRAWL','MOUNTAIN_PASS','EXIT'],
 ['SIDE_SLOPE','PEAT_BOG','EROSION_GULLY','EXIT'],
 ['CHESS_AXLE','MOUNTAIN_PASS','PEAT_BOG','EXIT'],
 ['MUD_CLIMB','PEAT_BOG','SIDE_SLOPE','EXIT'],
 ['PEAT_BOG','SIDE_SLOPE','CHESS_AXLE','EXIT'],
 ['MOUNTAIN_PASS','PEAT_BOG','EROSION_GULLY','EXIT'],
 ['FOREST_FORD','PEAT_BOG','ROCK_STEPS','EXIT'],
 ['CROSS_AXLE','PEAT_BOG','MUD_CLIMB','EXIT'],
 ['ROCK_CRAWL','EROSION_GULLY','PEAT_BOG','EXIT']
];
// Layered terrain recipes: two different threats can occupy one single section.
const OFFROAD_COMBOS={
 PEAT_BOG:[['BANK','WASHOUT'],['BANK','CHESS'],['HILL','WASHOUT'],['BANK','WASHOUT','CHESS'],['ROCKS','WASHOUT'],['HILL','BANK'],['CHESS','ROCKS']],
 CHESS_AXLE:[['BANK','PEAT'],['HILL','PEAT'],['WASHOUT','ROCKS'],['BANK','WASHOUT'],['PEAT','RUTS']],
 MOUNTAIN_PASS:[['BANK','PEAT'],['ROCKS','RUTS'],['WASHOUT','PEAT'],['BANK','WASHOUT'],['PEAT','CHESS']],
 SIDE_SLOPE:[['PEAT','ROCKS'],['CHESS','PEAT'],['RUTS','ROCKS'],['CHESS','RUTS']],
 EROSION_GULLY:[['BANK','PEAT'],['ROCKS','RUTS'],['HILL','CHESS'],['PEAT','ROCKS']],
 MUD_CLIMB:[['PEAT','ROCKS'],['CHESS','BANK'],['RUTS','PEAT'],['ROCKS','CHESS']],
 ROCK_CRAWL:[['WASHOUT','PEAT'],['BANK','RUTS'],['CHESS','PEAT'],['WASHOUT','RUTS']],
 ROCK_STEPS:[['WASHOUT','PEAT'],['CHESS','RUTS'],['BANK','WASHOUT']],
 RUT_MAZE:[['BANK','PEAT'],['ROCKS','CHESS'],['PEAT','WASHOUT']],
 DEEP_MUD:[['BANK','WASHOUT'],['CHESS','RUTS'],['PEAT','ROCKS']],
 RUT_GAUNTLET:[['WASHOUT','PEAT'],['BANK','CHESS'],['ROCKS','PEAT']],
 FOREST_FORD:[['BANK','RUTS'],['ROCKS','RUTS'],['BANK','WASHOUT']],
 TIGHT_TURNS:[['PEAT','WASHOUT'],['BANK','ROCKS']],
 FALLEN_LOGS:[['PEAT','BANK'],['WASHOUT','RUTS']]
};
export const RALLY_GROUPS=[
 ['FAST_CURVE','SHORT_STRAIGHT','FAST_S_CURVE','JUMP','FAST_CURVE','BRAKING_ZONE','TECH_S_CURVE','APEX_TURN','EXIT'],
 ['FAST_S_CURVE','FAST_HILL','FAST_CURVE','EARTH_JUMP','BRAKING_ZONE','HAIRPIN','RUTS','TECHNICAL_HILL','EXIT'],
 ['FAST_CURVE','DOUBLE_WAVE','FAST_S_CURVE','SHORT_STRAIGHT','FAST_CURVE','BRAKING_ZONE','CHICANE','ROCK_SECTION','TECH_S_CURVE','EXIT'],
 ['FAST_S_CURVE','FAST_HILL','BLIND_CREST','FAST_CURVE','BRAKING_ZONE','STEEP_DESCENT','APEX_TURN','CHICANE','EXIT'],
 ['FAST_CURVE','FAST_STRAIGHT','FAST_S_CURVE','JUMP','FAST_CURVE','BRAKING_ZONE','CHICANE','TECH_S_CURVE','EXIT']
];
export const SECTION_LENGTHS={CHESS_AXLE:[88,102,118],MOUNTAIN_PASS:[148,164,180],PEAT_BOG:[120,145,170],ROCK_CRAWL:[118,137,156],CROSS_AXLE:[84,96,108],ROCK_STEPS:[76,88,102],SIDE_SLOPE:[105,125,140],RUT_MAZE:[135,156,178],EROSION_GULLY:[77,90,105],DEEP_MUD:[80,95,110],RUT_GAUNTLET:[140,165,190],FOREST_FORD:[65,78,92],FALLEN_LOGS:[60,72,85],MUD_CLIMB:[92,110,128],TIGHT_TURNS:[76,92,108],FAST_STRAIGHT:[200,260,320],SHORT_STRAIGHT:[35,45,55],FAST_CURVE:[110,140,170],FAST_S_CURVE:[140,170,200],JUMP:[100,110,120],EARTH_JUMP:[115,125,135],BLIND_CREST:[120,135,150],DOUBLE_WAVE:[125,140,155],FAST_HILL:[100,130,160],BRAKING_ZONE:[110,125,140],CHICANE:[48,56,64],HAIRPIN:[40,44,48],TECH_S_CURVE:[65,80,95],APEX_TURN:[55,65,75],RUTS:[48,60,72],TECHNICAL_HILL:[50,60,70],STEEP_DESCENT:[55,65,75],ROCK_SECTION:[45,55,65],LOG_CROSSING:[65,75,85],BUMP_CHAIN:[70,80,90],WASHOUT:[65,75,85],EXIT:[75,90,105]};
export const SPECIAL_TYPES=['EARTH_JUMP','BLIND_CREST','DOUBLE_WAVE','LOG_CROSSING','BUMP_CHAIN','WASHOUT'];
export function jumpElevation(type,d,length){const center=length*.38;if(type==='JUMP')return .55*Math.exp(-(((d-center)/5.5)**2));if(type==='EARTH_JUMP')return 1.05*Math.exp(-(((d-center)/6.0)**2));if(type==='BLIND_CREST')return 1.85*Math.exp(-(((d-center)/10.5)**2));if(type==='DOUBLE_WAVE')return .48*Math.exp(-(((d-center+5)/5.0)**2))+.84*Math.exp(-(((d-center-9)/5.3)**2));return 0;}
export function asphaltBlend(section,u){return Math.min(1,u*section.length/6,(1-u)*section.length/6);}
export function envelope(u){return smooth(u/.16)*smooth((1-u)/.16);}
// Stone bed is sampled identically by wheel physics and the rendered terrain.
// Deterministic harmonics avoid hundreds of separate rock objects.
export function mountainPassElevation(section,distance){
 const pass=section.mountainPass;
 return pass?hillElevation(distance,pass.up)+hillElevation(distance,pass.down):0;
}
export function rockyRoadHeight(section,u,lateral){
 const field=section.rockField;if(!field)return 0;
 const d=u*section.length,p=field.phase;
 const fade=smooth((u-.095)/.105)*smooth((.915-u)/.105);
 const a=Math.sin(d*.82+lateral*2.05+p),b=Math.sin(d*1.43-lateral*1.58+p*1.7);
 const c=Math.cos(d*.45+lateral*2.7-p*.63),crown=Math.max(0,Math.sin(d*.58+lateral*.55+p*.37));
 const edge=smooth((section.width*.5+3.3-Math.abs(lateral))/2.3);return fade*edge*field.amplitude*(.47*a+.30*b+.17*c+.29*crown);
}

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
// Wheel material and road texture share one resolution of overlapping obstacles.
// Stone peaks prevail over muddy decals, while the raised peat escape line stays dry.
export function contactFeature(section,u,lateral,onRoad=true){
 let chosen=null,bestScore=.12;
 for(const o of section.localFeatures){
  if(!o.surfaceType||(!onRoad&&o.shape!=='river'))continue;
  const weight=obstacleWeight(o,u,lateral,section.length);
  if(weight<=.12)continue;
  let score=weight*(o.surfaceType==='ROCK'?1.55+Math.max(0,o.height||0)*.4:
                        o.surfaceType==='WATER'?1.35:
                        o.surfaceType==='SOFT_DIRT'?.85:1);
  if(section.type==='PEAT_BOG'&&o.kind==='SOFT_PATCH'&&o.shape==='long_rut'&&Math.abs(o.lateral)>2)score+=2;
  if(score>bestScore){bestScore=score;chosen=o;}
 }
 return chosen;
}
export class RoadWorld{
 constructor(seed=ROAD_CONFIG.seed,environment=null){this.environment=environment;this.offroadMode=false;this.reset(seed);}
 random(){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return this.rng/4294967296;}
 reset(seed=this.seed){this.seed=Number(seed)>>>0;this.rng=this.seed;this.biomes=new BiomeStream(this.seed);this.sections=[];this.queue=[];this.lastGroup=-1;this.bins=new Map();this.binsDirty=true;this.nextId=0;this.distance=0;this.offset=[0,0];this.revision=(this.revision||0)+1;this.nextPickupS=120;this.nextEventS=75;this.nextComboS=220;this.nextSpecialS=700;this.lastSpecial=null;this.current=null;for(let i=0;i<ROAD_CONFIG.activeSections;i++)this.append();this.current=this.sections[0];}
 choose(){if(this.offroadMode){if(this.nextId<2)return ['SHORT_STRAIGHT','TECH_S_CURVE'][this.nextId];if(this.nextId===2)return 'ROCK_CRAWL';if(!this.queue.length){let group=Math.floor(this.random()*OFFROAD_GROUPS.length);if(group===this.lastGroup)group=(group+1)%OFFROAD_GROUPS.length;this.lastGroup=group;this.queue=OFFROAD_GROUPS[group].slice();}return this.queue.shift();}if(this.nextId<4)return ['SHORT_STRAIGHT','FAST_CURVE','FAST_S_CURVE','JUMP'][this.nextId];const progress=this.sections.at(-1)?.exitDistance||0;if(progress>=this.nextSpecialS&&(!this.queue.length||(FAST_TYPES.includes(this.queue[0])&&this.queue[0]!=='EXIT'))){let kind=SPECIAL_TYPES[Math.floor(this.random()*SPECIAL_TYPES.length)];if(kind===this.lastSpecial)kind=SPECIAL_TYPES[(SPECIAL_TYPES.indexOf(kind)+1)%SPECIAL_TYPES.length];this.lastSpecial=kind;this.queue.unshift(JUMP_TYPES.includes(kind)?'SHORT_STRAIGHT':'BRAKING_ZONE',kind,'EXIT');this.nextSpecialS=progress+OBSTACLE_CONFIG.specialSpacing[0]+this.random()*(OBSTACLE_CONFIG.specialSpacing[1]-OBSTACLE_CONFIG.specialSpacing[0]);}if(!this.queue.length){let group=Math.floor(this.random()*RALLY_GROUPS.length);if(group===this.lastGroup)group=(group+1)%RALLY_GROUPS.length;this.lastGroup=group;this.queue=RALLY_GROUPS[group].slice();}return this.queue.shift();}
 append(){const previous=this.sections.at(-1),entry=previous?{...previous.exitTransform}:{x:0,y:0,z:40,yaw:Math.PI,width:7.2},type=this.choose(),length=SECTION_LENGTHS[type][Math.floor(this.random()*3)]*(FAST_TYPES.includes(type)?RALLY_CONFIG.fastLengthScale:1),exitWidth=this.offroadMode?5.5+this.random()*1.1:FAST_TYPES.includes(type)?9.0+this.random()*1.5:type==='BRAKING_ZONE'?6.5:6.4+this.random()*.8,difficulty=this.offroadMode?1+Math.floor(this.random()*2):Math.floor(this.random()*3),template=Math.floor(this.random()*3),sign=this.random()<.5?-1:1;let turn=0;
 if(['FAST_CURVE','FAST_HILL','STEEP_DESCENT','EXIT','MUD_CLIMB','FOREST_FORD','DEEP_MUD','TIGHT_TURNS'].includes(type))turn=sign*(.30+this.random()*.35);if(type==='BRAKING_ZONE'&&['HAIRPIN','APEX_TURN'].includes(this.queue[0]))turn=sign*.98-(entry.yaw-Math.PI);if(['HAIRPIN','APEX_TURN'].includes(type))turn=-2*(entry.yaw-Math.PI);if(Math.abs(entry.yaw-Math.PI)>.65&&type!=='HAIRPIN')turn=-(entry.yaw-Math.PI);turn=clamp(entry.yaw+turn,Math.PI-ROAD_CONFIG.maxHeadingOffset,Math.PI+ROAD_CONFIG.maxHeadingOffset)-entry.yaw;
 // Every heading remains forward in Z, including rare tight hairpin bends.
 const id=this.nextId++,startDistance=previous?previous.startDistance+previous.length:0,section={id,type,biomeProfile:this.offroadMode?{type:'FOREST',previous:'FOREST',start:0,id:0,name:''}:this.biomes.sample(startDistance),localFeatures:[],hill:null,decorationRevision:0,mode:FAST_TYPES.includes(type)?'FAST':'TECH',length,width:entry.width,entryTransform:entry,startDistance,difficulty,template,surface:'DIRT',obstacles:[],nodes:[],decorations:[]};const step=type==='MOUNTAIN_PASS'?.55:type==='CHESS_AXLE'?.68:type==='PEAT_BOG'?.85:type==='ROCK_CRAWL'?.72:['RUT_GAUNTLET','RUT_MAZE','FOREST_FORD'].includes(type)?.75:['CROSS_AXLE','ROCK_STEPS','EROSION_GULLY','ROCK_SECTION','CHICANE','RUTS','FALLEN_LOGS'].includes(type)?.55:1.5;
 if(['FAST_HILL','TECHNICAL_HILL','STEEP_DESCENT'].includes(type)){const extreme=type!=='FAST_HILL'&&this.random()<HILL_CONFIG.extremeChance,angle=type==='FAST_HILL'?HILL_CONFIG.light[difficulty]:type==='TECHNICAL_HILL'?(extreme?HILL_CONFIG.extreme[difficulty]:HILL_CONFIG.hard[difficulty]):extreme?HILL_CONFIG.extremeDescent:HILL_CONFIG.descent[difficulty],span=type==='FAST_HILL'?81:extreme?16:27,ramp=type==='FAST_HILL'?6:4;section.hill={category:extreme?'EXTREME':type==='FAST_HILL'?'LIGHT':'HARD',angle,span,ramp,start:length*(type==='FAST_HILL'?.30:.40),exitRamp:type==='FAST_HILL'?55:ramp,sign:type==='STEEP_DESCENT'?-1:type==='FAST_HILL'?sign:1};section.crestSafe=true;}
 if(this.offroadMode&&type==='MUD_CLIMB')section.hill={category:'HARD',angle:[14,16,18][difficulty],span:39,ramp:8,start:length*.31,exitRamp:8,sign:1};
 if(this.offroadMode&&type==='ROCK_CRAWL'){
  const grade=[17,19,22][difficulty];
  section.hill={category:'ROCK_CRAWL',angle:grade,span:Math.min(75,length*.58),ramp:13,exitRamp:15,start:length*.18,sign:1};
  section.rockField={phase:this.random()*6.28,amplitude:.41+Math.min(.16,startDistance/5000*.16)+this.random()*.07};
 }
 if(this.offroadMode&&type==='ROCK_STEPS')section.rockField={phase:this.random()*6.28,amplitude:.32+this.random()*.075};
 if(this.offroadMode&&type==='MOUNTAIN_PASS'){
  // Equal ascent and descent slopes, short summit, physical ridge under the chassis.
  const span=44+this.random()*5,angle=16+this.random()*5,start=length*.14;
  section.mountainPass={
   up:{category:'PASS_ASCENT',angle,span,ramp:10,exitRamp:9,start,sign:1},
   down:{category:'PASS_DESCENT',angle,span,ramp:9,exitRamp:10,start:start+span+4,sign:-1},
   crestDistance:start+span+2
  };
  section.rockField={phase:this.random()*6.28,amplitude:.12+this.random()*.055};
  section.crestSafe=true;
 }
 // Some deep diagonal sections are uphill rather than isolated flat challenges.
 if(this.offroadMode&&['CROSS_AXLE','EROSION_GULLY'].includes(type)&&this.random()<.60){
  const grade=type==='CROSS_AXLE'?12+this.random()*5:9+this.random()*5;
  section.hill={category:'DIAGONAL_CLIMB',angle:grade,span:Math.min(56,length*.64),ramp:10,exitRamp:13,start:length*.17,sign:1};
 }
 if(this.offroadMode&&type==='ROCK_CRAWL'&&this.random()<.52)section.rockBankSide=this.random()<.5?-1:1;
 if(JUMP_TYPES.includes(type))section.crestSafe=true;section.asphalt=(!this.offroadMode&&!['CHICANE','RUTS','ROCK_SECTION','LOG_CROSSING','WASHOUT','TECHNICAL_HILL',...JUMP_TYPES].includes(type)&&(section.biomeProfile.type==='VILLAGE'||startDistance%1500>1125));section.surface=this.offroadMode&&type==='PEAT_BOG'?'PEAT':this.offroadMode&&['ROCK_CRAWL','ROCK_STEPS'].includes(type)?'ROCK':this.offroadMode&&['CHESS_AXLE','CROSS_AXLE','EROSION_GULLY','SIDE_SLOPE','MOUNTAIN_PASS'].includes(type)?'DIRT':this.offroadMode&&!['SHORT_STRAIGHT','EXIT'].includes(type)?'SOFT_DIRT':section.asphalt?'ASPHALT':'DIRT';this.populateEvents(section);
 if(type==='LOG_CROSSING')for(let i=0;i<5;i++)section.localFeatures.push({kind:'LOG_MEDIUM',u:.38+i*.05,lateral:0,...OBSTACLE_CONFIG.types.LOG_MEDIUM,radius:2.3});
 if(type==='BUMP_CHAIN')for(let i=0;i<4;i++)section.localFeatures.push({kind:'BUMP',u:.30+i*.12,lateral:i%2?.8:-.8,...OBSTACLE_CONFIG.types.BUMP,radius:2});
 if(type==='WASHOUT')for(let i=0;i<4;i++)section.localFeatures.push({kind:'DITCH',u:.32+i*.10,lateral:i%2?1.7:-1.7,...OBSTACLE_CONFIG.types.DITCH});
 // Built into the heightfield: mud, deep ruts, fords and drive-over log barriers.
 if(this.offroadMode){
  const add=(kind,u,lateral,shape={})=>section.localFeatures.push({kind,...OBSTACLE_CONFIG.types[kind],u,lateral,ragged:kind.includes('MUD')||kind==='PUDDLE',phase:this.random()*6.28,...shape});
  // Heightfield obstacles: independent wheel loads and usable terrain bypasses.
  // The first kilometres remain gentler; shape severity grows without impossible walls.
  const challenge=Math.max(0,Math.min(1,(startDistance-250)/3800));
  if(type==='ROCK_CRAWL'||type==='ROCK_STEPS'){
   // Long rocky mountainside, not two isolated stone bumps.
   const crawl=type==='ROCK_CRAWL',layers=crawl?7:5;
   for(let i=0;i<layers;i++){
    const u=.20+i*(crawl?.103:.135)+(this.random()-.5)*.025,side=i%2?-1:1;
    add('ROCK_STEP',u,side*(crawl?.34:.38),{
     shape:'ledge',height:(crawl?.39:.36)+.11*challenge+this.random()*.075,
     radius:crawl?2.03:1.83,longRadius:1.35+this.random()*.43
    });
   }
   for(let i=0;i<(crawl?9:6);i++){
    const u=.19+i*(crawl?.074:.105)+(this.random()-.5)*.025,side=i%2?-1:1;
    add('ROCK_CRAWL_BOULDER',u,side*(.82+this.random()*1.13),{
     height:.31+.18*challenge+this.random()*.15,radius:.72+this.random()*.33,
     longRadius:.83+this.random()*.40
    });
   }
  }
  if(type==='CHESS_AXLE'){
   // Seven alternating pairs, one tyre climbing while the diagonal opposite is sunk.
   const side=this.random()<.5?-1:1;
   for(let i=0;i<7;i++){
    const u=.19+i*.101,dir=i%2?-side:side,offset=2.24/length;
    const peak=.36+.10*challenge+this.random()*.085;
    add('CHESS_LIFT',u,dir*.88,{height:peak,radius:.98,longRadius:1.65});
    add('CHESS_HOLE',u+offset,-dir*.88,{
     height:-peak*(1.0+this.random()*.15),radius:1.06,longRadius:1.88,mudDepth:.76+.13*challenge
    });
   }
  }
  if(type==='MOUNTAIN_PASS'){
   // Raised summit and offset rocks create an actual high-center clearance challenge.
   const u=section.mountainPass.crestDistance/length;
   add('ROCK_STEP',u,0,{shape:'ledge',height:.38+.07*challenge,
    radius:2.45,longRadius:.82});
   for(const [at,side] of [[.33,-1],[.50,1],[.68,-1]]){
    add('ROCK_CRAWL_BOULDER',at,side*(.93+this.random()*.50),
     {height:.22+this.random()*.12,radius:.72,longRadius:.85});
   }
   for(const [at,side] of [[.72,1],[.82,-1]])
    add('DIAGONAL_GULLY',at,side*.25,{height:-.24-.08*challenge,
     radius:section.width/2-.1,longRadius:2.10,skew:side*1.15,mudDepth:.64});
  }
  if(type==='PEAT_BOG'){
   section.peatDrySide=this.random()<.5?-1:1;
   for(const u of [.21,.34,.47,.60,.73,.84]){
    const side=this.random()<.5?-1:1;
    add('PEAT_POOL',u,side*(.35+this.random()*.66),{
     height:-.15-.13*challenge-this.random()*.06,
     radius:2.0+this.random()*.65,longRadius:5.1+this.random()*2.9,
     peatDepth:.72+.22*challenge
    });
   }
   for(const side of [-1,1])add('MUD_STRIP',.5,side*.95,{
    shape:'long_rut',startU:.14,endU:.88,pathShift:.08*side,
    radius:.47,longRadius:1,peatDepth:.70,mudDepth:.55,height:-.23-.08*challenge
   });
   // A firmer raised escape line at one verge; placed last to override soft pools.
   add('SOFT_PATCH',.51,section.peatDrySide*2.55,{
    shape:'long_rut',startU:.17,endU:.86,radius:.73,
    longRadius:1,height:.12,surfaceType:'SOFT_DIRT'
   });
  }
  if(type==='CROSS_AXLE'){
   // Raised wheel and diagonally opposite wheel sunk in mud, offset by wheelbase.
   for(const [u,side] of [[.27,1],[.52,-1],[.77,1]]){
    const wheelbase=2.24/length,peak=.43+.14*challenge+this.random()*.07;
    add('CROSS_AXLE',u,side*.87,{height:peak,radius:1.05,longRadius:2.35,surfaceType:'ROCK'});
    add('DIAGONAL_GULLY',u+wheelbase,-side*.72,{
     height:-peak*(.92+this.random()*.12),radius:2.55,longRadius:2.0,skew:side*1.04,mudDepth:.80+.12*challenge
    });
    add('MUD_MEDIUM',u+.5*wheelbase,-side*.82,{radius:1.12,longRadius:2.6,mudDepth:.78,height:-.055});
   }
  }
  if(type==='SIDE_SLOPE'){
   add('SIDE_BANK',.5,0,{shape:'bank',height:sign*(.52+.20*challenge+this.random()*.06),radius:section.width/2+1.1,startU:.16,endU:.85});
   // A sidehill with two oblique muddy washouts: the driver must read the camber.
   for(const [u,side] of [[.40,sign],[.70,-sign]]){
    add('DIAGONAL_GULLY',u,0,{height:-.36-.14*challenge,radius:section.width/2+.25,
     longRadius:2.55,skew:side*1.15,mudDepth:.73+.11*challenge});
    add('GULLY_LIP',u-.031,side*.80,{height:.19+.07*challenge,radius:2.55,longRadius:1.5,skew:side*1.15});
   }
   for(const side of [-1,1])add('SOFT_PATCH',.52,side*.9,{shape:'long_rut',startU:.32,endU:.73,
    radius:.44,longRadius:1,height:-.09-.045*challenge,pathWander:.12,pathPhase:this.random()*6.28});
  }
  if(type==='MUD_CLIMB'){
   // True climbing diagonals: uphill traction varies across the four contact patches.
   const side=this.random()<.5?-1:1;
   for(const [u,flip] of [[.46,1],[.72,-1]]){
    add('DIAGONAL_GULLY',u,side*flip*.22,{height:-.44-.13*challenge,
     radius:section.width/2+.15,longRadius:2.45,skew:side*flip*1.18,mudDepth:.83});
    add('GULLY_LIP',u-.032,-side*flip*.85,{height:.20+.08*challenge,
     radius:2.3,longRadius:1.45,skew:side*flip*1.18});
   }
   if(this.random()<.7)add('SIDE_BANK',.50,0,{shape:'bank',height:side*(.33+.09*challenge),
    radius:section.width/2+1,startU:.26,endU:.86});
  }
  if(type==='ROCK_CRAWL'&&section.rockBankSide){
   add('SIDE_BANK',.5,0,{shape:'bank',height:section.rockBankSide*(.35+.10*challenge),
    radius:section.width/2+1.0,startU:.32,endU:.78});
   add('DIAGONAL_GULLY',.62,section.rockBankSide*.35,{height:-.27-.09*challenge,
    radius:section.width/2+.05,longRadius:2.4,skew:section.rockBankSide*1.04,mudDepth:.64});
  }
  if(type==='RUT_MAZE'){
   // Shifting mud ruts deeper than before, with raised lips and angled washouts.
   for(const [startU,endU,shift] of [[.10,.39,-.62],[.37,.68,.72],[.66,.91,-.45]]){
    const track={shape:'long_rut',startU,endU,pathShift:shift,pathWander:.22+this.random()*.17,pathPhase:this.random()*6.28,longRadius:1};
    for(const side of [-1,1])add('MUD_STRIP',.5,side*.88,{...track,radius:.50+.06*this.random(),
     mudDepth:.70+.22*challenge,height:-.35-.15*challenge});
   }
   for(const [u,side] of [[.40,1],[.69,-1]]){
    add('DIAGONAL_GULLY',u,0,{height:-.33-.17*challenge,radius:3.35,longRadius:2.35,skew:side*1.20,mudDepth:.84});
    add('GULLY_LIP',u-.027,side*.72,{height:.19+.09*challenge,radius:2.2,longRadius:1.55,skew:side*1.20});
   }
  }
  if(type==='EROSION_GULLY'){
   // Real diagonal trenches with soft mud beds and opposed high erosion lips.
   for(const [u,side] of [[.28,1],[.52,-1],[.76,1]]){
    const depth=.59+.23*challenge+this.random()*.085,skew=side*(1.15+this.random()*.4);
    add('DIAGONAL_GULLY',u,0,{
     height:-depth,radius:section.width/2+.8,longRadius:2.55+this.random()*.45,skew,
     mudDepth:.82+.15*challenge
    });
    add('GULLY_LIP',u-.048,side*.75,{
     height:.28+.12*challenge+this.random()*.055,radius:3.05,longRadius:1.5,skew
    });
    add('MUD_MEDIUM',u+.025,-side*.85,{radius:1.42,longRadius:2.55,mudDepth:.86,height:-.085});
   }
  }
  if(type==='DEEP_MUD')for(const u of [.24,.38,.54,.70,.82])add('MUD_MEDIUM',u,this.random()-.5,{radius:2.0,longRadius:6.0,mudDepth:.8+this.random()*.15,height:-.10});
  if(type==='RUT_GAUNTLET'||type==='MUD_CLIMB'&&this.random()<.58){
   const hill=type==='MUD_CLIMB',depth=(hill?.23:.34)+this.random()*(hill?.08:.11);
   const startU=hill?.29:.055,endU=hill?.89:.96;
   // Keep both wheel grooves parallel while offsetting their centerline on some sections.
   const pathShift=this.random()<.73?(this.random()<.5?-1:1)*(.38+this.random()*.57):0;
   const pathWander=.12+this.random()*.14,pathPhase=this.random()*6.28;
   const track={shape:'long_rut',startU,endU,longRadius:1,pathShift,pathWander,pathPhase};
   for(const side of [-1,1])add('MUD_STRIP',.52,side*.91,{...track,radius:hill?.43:.48,mudDepth:hill?.52:.82,height:-depth});
   add('SOFT_PATCH',.52,0,{...track,radius:.32,height:hill?.055:.075});
  }
  if(type==='FOREST_FORD'){
   const deep=this.random()<.35,depth=deep?.68+this.random()*.12:.43+this.random()*.14;
   section.deepFord=deep;
   // Riverbed always exists: on selected crossings 4–6 uneven boulders hide beneath the water.
   section.fordRocks=this.random()<.70;
   section.fordVariant=section.fordRocks?'ROCKY':'MUDDY';
   add('PUDDLE',.52,0,{shape:'river',radius:section.width/2+11,longRadius:6.8+this.random()*1.9,
    waterDepth:depth,height:-depth*.82});
   if(section.fordRocks){
    const count=4+Math.floor(this.random()*3),stepU=.125/(count-1);
    for(let i=0;i<count;i++){
     const side=i%2?-1:1,u=.46+i*stepU+(this.random()-.5)*.013;
     add('ROCK_CRAWL_BOULDER',u,side*(.72+this.random()*1.05),{
      radius:.64+this.random()*.26,longRadius:.78+this.random()*.36,
      height:.16+this.random()*.19,underwater:true,surfaceType:null
     });
    }
   }
   // The muddy exit lip can be more challenging than the water itself.
   if(this.random()<.68){
    add('MUD_MEDIUM',.68,(this.random()-.5)*1.2,{radius:1.45,longRadius:2.4,mudDepth:.72,height:-.16});
    add('GULLY_LIP',.68,(this.random()<.5?-1:1)*1.13,{height:.17,radius:2.0,longRadius:1.0,skew:.6});
   }
  }
  if(type==='FALLEN_LOGS')for(const u of [.40,.57,.76])add('LOG_LARGE',u,(this.random()-.5)*.45,{radius:section.width/2+.6,longRadius:.55,height:.31+this.random()*.11});
  if(type==='MUD_CLIMB')for(const u of [.35,.50,.64,.78])add('MUD_MEDIUM',u,(this.random()-.5)*.7,{radius:1.65,longRadius:4,mudDepth:.41,height:-.050});
  if(type==='TIGHT_TURNS')for(const u of [.32,.72])add('SOFT_PATCH',u,(this.random()-.5)*1.8,{radius:1.55,longRadius:3});
  // Different obstacles share the SAME section and elevation: a peat bog can be
  // a hillside and contain a deep cross-axle rut; rock climbs can be wet and off-camber.
  // The start is calmer, combinations become frequent after the first half-kilometre.
  const recipes=OFFROAD_COMBOS[type],progress=clamp((startDistance-260)/1850,0,1);
  const probability=.40+.51*progress;
  if(recipes&&this.random()<probability){
   const selected=recipes[Math.floor(this.random()*recipes.length)];
   // Most difficult recipes may combine THREE effects; all have a workable line.
   section.comboLayers=selected.slice();
   const comboSign=this.random()<.5?-1:1,bankWidth=section.width/2+1.15;
   for(const layer of selected){
    if(layer==='BANK'){
     // Slow, sustained sidehill; cap the bank if the base section already has one.
     const hasBank=section.localFeatures.some(o=>o.shape==='bank');
     const bankHeight=(hasBank?.24:.38)+challenge*.10;
     add('SIDE_BANK',.50,0,{shape:'bank',height:comboSign*bankHeight,
      radius:bankWidth,startU:.24,endU:.80});
    }else if(layer==='WASHOUT'){
     const u=.35+this.random()*.32;
     add('DIAGONAL_GULLY',u,0,{height:-.34-.12*challenge,
      radius:bankWidth,longRadius:2.15+this.random()*.45,
      skew:comboSign*(1.1+this.random()*.22),mudDepth:.80});
     add('GULLY_LIP',u-.028,comboSign*.76,{height:.17+.06*challenge,
      radius:2.25,longRadius:1.4,skew:comboSign*1.16});
    }else if(layer==='CHESS'){
     const u=.37+this.random()*.16,side=comboSign;
     for(const [at,dir] of [[u,side],[u+.15,-side]]){
      add('CHESS_LIFT',at,dir*.86,{height:.29+.07*challenge,radius:.86,longRadius:1.55});
      add('CHESS_HOLE',at+2.24/length,-dir*.86,
       {height:-.33-.09*challenge,radius:.97,longRadius:1.68,mudDepth:.80});
     }
    }else if(layer==='HILL'){
     // Only add a second ascent if this section has no existing grade.
     if(!section.hill&&!section.mountainPass)section.hill={
      category:'MIXED_CLIMB',angle:9+this.random()*5,
      span:Math.min(49,length*.54),ramp:11,exitRamp:13,start:length*.21,sign:1};
    }else if(layer==='PEAT'){
     // Wet pockets on soil or mountain rock, NOT the river's open-water surface.
     for(const [at,side] of [[.39,comboSign],[.67,-comboSign]])
      add('PEAT_POOL',at,side*.63,{height:-.12-.05*challenge,
       radius:1.55+this.random()*.27,longRadius:3.0+this.random()*.9,peatDepth:.77});
    }else if(layer==='ROCKS'){
     for(const [at,side] of [[.38,comboSign],[.61,-comboSign]])
      add('ROCK_CRAWL_BOULDER',at,side*(.98+this.random()*.4),
       {height:.28+.07*challenge,radius:.78,longRadius:.92});
    }else if(layer==='RUTS'){
     for(const side of [-1,1])add('MUD_STRIP',.5,side*.90,{
      shape:'long_rut',startU:.26,endU:.77,radius:.41,longRadius:1,
      height:-.24-.06*challenge,mudDepth:.67,
      pathWander:.17,pathPhase:this.random()*6.28});
    }
   }
   // The firmer shoulder is still available on bogs: move it to the end of the
   // material priority list so newly added soft features cannot erase the bypass.
   if(type==='PEAT_BOG'){
    const dry=section.localFeatures.find(o=>o.kind==='SOFT_PATCH'&&o.shape==='long_rut'&&Math.abs(o.lateral)>2);
    if(dry){section.localFeatures.splice(section.localFeatures.indexOf(dry),1);section.localFeatures.push(dry);}
   }
  }
 }
 const count=Math.ceil(length/step),samples=new Set(Array.from({length:count+1},(_,i)=>i*length/count));for(const o of section.localFeatures){if(o.shape==='long_rut'||o.shape==='river'||o.shape==='bank')continue;for(let d=-o.longRadius*OBSTACLE_CONFIG.detailRadius;d<=o.longRadius*OBSTACLE_CONFIG.detailRadius;d+=(o.kind==='PEAT_POOL'?1.15:o.shape==='log'?OBSTACLE_CONFIG.logSamplingStep:['ROCK_STEP','ROCK_CRAWL_BOULDER','CROSS_AXLE'].includes(o.kind)?.55:['DIAGONAL_GULLY','GULLY_LIP'].includes(o.kind)?.56:o.surfaceType&&o.surfaceType!=='ROCK'?OBSTACLE_CONFIG.surfaceSamplingStep:OBSTACLE_CONFIG.samplingStep))samples.add(clamp(o.u*length+d,0,length));}const distances=[...samples].sort((a,b)=>a-b).filter((d,i,all)=>!i||d-all[i-1]>.005);let x=entry.x,z=entry.z,lastDistance=0;
 const heading=u=>entry.yaw+turn*smooth(u)+(['FAST_S_CURVE','TECH_S_CURVE','TIGHT_TURNS'].includes(type)?sign*Math.min(type==='TIGHT_TURNS'?.86:type==='TECH_S_CURVE'?.65:.38,1.38-Math.abs(entry.yaw-Math.PI))*Math.sin(2*Math.PI*u)**3:0);
 for(const distance of distances){const u=distance/length,yaw=heading(u);if(distance){const angle=heading((distance+lastDistance)/(2*length));x+=Math.sin(angle)*(distance-lastDistance);z+=Math.cos(angle)*(distance-lastDistance);}const env=Math.sin(Math.PI*u)**2,jump=jumpElevation(type,distance,length)*envelope(u),wave=type==='FAST_STRAIGHT'&&id>=4?.10*Math.sin(distance/9)**2*envelope(u):0,y=entry.y+(section.hill?hillElevation(distance,section.hill):0)+.08*env+jump+wave+mountainPassElevation(section,distance);section.nodes.push({x,y,z,yaw,width:entry.width+(exitWidth-entry.width)*smooth(u),u,s:startDistance+distance});lastDistance=distance;}
 const actualCount=section.nodes.length-1;
 if(type==='CHICANE')for(const [u,lateral] of [[.32,-2.1],[.65,2.1]])section.obstacles.push({u,lateral,height:.85,radius:1.55,kind:'boulder'});
 if(type==='ROCK_SECTION')for(const [u,lateral] of [[.30,-1.1],[.46,.9],[.64,-.2]])section.obstacles.push({u,lateral,height:.43,radius:.85,kind:'rock'});
 const end=section.nodes.at(-1);section.exitTransform={x:end.x,y:end.y,z:end.z,yaw:end.yaw,width:exitWidth};section.exitDistance=startDistance+length;section.startHeight=entry.y;section.endHeight=section.exitTransform.y;section.entryDirection=entry.yaw;section.exitDirection=end.yaw;
 for(let i=0;i<Math.min(72,Math.max(32,Math.round(length/5)));i++){const node=section.nodes[1+Math.floor(this.random()*(actualCount-1))],side=i%2?-1:1,category=['SMALL','MEDIUM','LARGE'][Math.floor(this.random()*3)],radius={SMALL:.12,MEDIUM:.25,LARGE:.46}[category],offset=side*(node.width/2+(category==='LARGE'?5:2.5)+(this.random()<.12?this.random()*2:3+this.random()*24)),scale=category==='SMALL'?2.8+this.random()*1.2:category==='MEDIUM'?3.7+this.random()*1.5:5+this.random()*1.4,variant=Math.floor(this.random()*3);const weights=biomeWeights(section.biomeProfile,node.s);if(this.random()>weights.FOREST*.96+weights.FIELD*.06+weights.VILLAGE*.14)continue;section.decorations.push({kind:'tree',category,radius,broken:false,u:node.u,x:node.x+Math.cos(node.yaw)*offset,z:node.z-Math.sin(node.yaw)*offset,y:node.y+.025*Math.max(0,Math.abs(offset)-node.width/2),scale,rotation:this.random()*6.28,variant});}
 for(let i=0;i<7;i++){const node=section.nodes[Math.floor(this.random()*actualCount)],side=i%2?-1:1,offset=side*(node.width/2+1+this.random()*4);section.decorations.push({kind:i%3?'bush':'stone',x:node.x+Math.cos(node.yaw)*offset,z:node.z-Math.sin(node.yaw)*offset,y:node.y,scale:.35+this.random()*.55,rotation:this.random()*6.28});}
 populateVillage(this,section);this.sections.push(section);this.binsDirty=true;populateField(this,section);this.populateParking(section);populatePickups(this,section);populateAnimals(this,section);this.binsDirty=true;for(const existing of this.sections){const before=existing.decorations.length;existing.decorations=existing.decorations.filter(d=>{if(d.kind!=='tree'||d.broken)return true;if(existing.decorations.some(o=>['house','hay','parked'].includes(o.kind)&&Math.abs((d.x-o.x)*Math.cos(o.rotation)-(d.z-o.z)*Math.sin(o.rotation))<o.width/2+1&&Math.abs((d.x-o.x)*Math.sin(o.rotation)+(d.z-o.z)*Math.cos(o.rotation))<o.depth/2+1))return false;const p=this.locate(d.x,d.z);return Math.abs(p.lateral)>p.width/2+(d.category==='LARGE'?4:2);});if(existing!==section&&existing.decorations.length!==before){existing.decorationRevision++;this.revision++;}}populateScenery(this,section);populateFarmers(this,section);return section;}
 populateEvents(section){
 const {startDistance:start,length,type}=section,end=start+length;
 const wet=section.biomeProfile.type!=='FOREST';
 const minimum=this.sections.at(-1)?.crestSafe?OBSTACLE_CONFIG.clearLanding:OBSTACLE_CONFIG.minimumStart;
 const safe=['FAST_STRAIGHT','FAST_CURVE','FAST_S_CURVE','EXIT','BRAKING_ZONE','TECH_S_CURVE','APEX_TURN'].includes(type);
 while(this.nextEventS<end-14){const distance=Math.max(this.nextEventS,start+minimum);this.nextEventS=distance+(OBSTACLE_CONFIG.localSpacing[0]+this.random()*(OBSTACLE_CONFIG.localSpacing[1]-OBSTACLE_CONFIG.localSpacing[0]))*(wet?.78:1);if(!safe)continue;
 const combo=distance>=this.nextComboS;if(combo)this.nextComboS=distance+OBSTACLE_CONFIG.comboSpacing[0]+this.random()*(OBSTACLE_CONFIG.comboSpacing[1]-OBSTACLE_CONFIG.comboSpacing[0]);
 const choices=section.asphalt?['PUDDLE','POTHOLE','PIT','PUDDLE','POTHOLE']:['MUD_PATCH','MUD_MEDIUM','MUD_STRIP','PUDDLE','PIT','POTHOLE','ROCK','SHORT_RUT','DITCH','BUMP','SOFT_PATCH','LOG_SMALL','LOG_MEDIUM','LOG_LARGE'];
 let kind=section.asphalt?choices[Math.floor(this.random()*choices.length)]:type==='APEX_TURN'?'MUD_MEDIUM':wet&&this.random()<.55?['PUDDLE','MUD_PATCH','MUD_STRIP'][Math.floor(this.random()*3)]:choices[Math.floor(this.random()*choices.length)];const raining=this.environment?.rainIntensity||0;if(raining>.03&&kind!=='PUDDLE'&&this.random()<raining*.045)kind='PUDDLE';const count=combo?3:1,side=this.random()<.5?-1:1;
 for(let i=0;i<count;i++){const at=Math.min(end-14,distance+i*5.5),spec=OBSTACLE_CONFIG.types[kind],feature={kind,...spec,u:(at-start)/length,lateral:side*(.65+this.random()*1.1),ragged:!!spec.surfaceType,phase:this.random()*6.28};
 if(kind==='PUDDLE'){feature.radius=.65+this.random()*1.15;feature.longRadius=1+this.random()*1.6;feature.radius=Math.min(feature.radius*(1+raining*.40),section.width*.31);feature.longRadius*=1+raining*.45;feature.lateral=Math.sign(feature.lateral)*Math.min(Math.abs(feature.lateral),Math.max(.2,section.width/2-feature.radius-.35));feature.waterDepth=[.045,.12,.24][Math.floor(this.random()*3)];feature.height=-feature.waterDepth;}
 section.localFeatures.push(feature);if(kind==='PUDDLE'&&raining>.03&&this.random()<raining*.85&&section.localFeatures.length<OBSTACLE_CONFIG.maxFeatures){section.localFeatures.push({...feature,u:Math.min((end-14-start)/length,feature.u+4.5/length),lateral:-feature.lateral*.7,phase:feature.phase+1.7,radius:feature.radius*.80,longRadius:feature.longRadius*.75,waterDepth:Math.min(.16,feature.waterDepth),height:-Math.min(.16,feature.waterDepth)});if(this.random()<raining*.22&&section.localFeatures.length<OBSTACLE_CONFIG.maxFeatures)section.localFeatures.push({...feature,u:Math.min((end-14-start)/length,feature.u+8/length),radius:feature.radius*.50,longRadius:feature.longRadius*.60,lateral:feature.lateral*.85,phase:feature.phase+3.1,waterDepth:.06,height:-.06});}}
 }
 }
 populateParking(section){
 const biome=section.biomeProfile.type;if(biome==='FOREST'||section.crestSafe||section.id<4||this.random()>(biome==='VILLAGE'?.27:.18))return;
 const u=.35+this.random()*.3,p=this.point(section,u),side=this.random()<.5?-1:1,lateral=side*(section.width/2+3.7),npcType=biome==='FIELD'?'TRACTOR':this.random()<.55?'NIVA':'KOPEIKA',width=npcType==='TRACTOR'?2.05:npcType==='NIVA'?1.75:1.64,depth=npcType==='TRACTOR'?3.65:npcType==='NIVA'?3.8:4.05;
 const x=p.x+Math.cos(p.yaw)*lateral,z=p.z-Math.sin(p.yaw)*lateral;
 if(section.decorations.some(d=>Math.hypot(x-d.x,z-d.z)<5))return;
 section.decorations.push({kind:'parked',npcType,colorIndex:Math.floor(this.random()*4),x,z,y:this.height(x,z),rotation:p.yaw+(side<0?Math.PI:0),width,depth,height:npcType==='TRACTOR'?2.7:1.8,broken:false});
 }
 indexSegments(){this.bins.clear();for(const section of this.sections)for(let i=0;i<section.nodes.length-1;i++){const a=section.nodes[i],b=section.nodes[i+1],entry={section,i,a,b};for(let cell=Math.floor((b.z-52)/12);cell<=Math.floor((a.z+52)/12);cell++){if(!this.bins.has(cell))this.bins.set(cell,[]);this.bins.get(cell).push(entry);}}this.zMin=Math.min(...this.bins.keys());this.zMax=Math.max(...this.bins.keys());this.binsDirty=false;}
 locate(x,z){if(this.binsDirty)this.indexSegments();let best=null,distance=Infinity;const candidates=this.bins.get(Math.floor(z/12))||(this.finiteRace?this.bins.get(clamp(Math.floor(z/12),this.zMin,this.zMax)):null)||[...this.bins.values()].flat();for(const {section,i,a,b} of candidates){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),cx=a.x+dx*t,cz=a.z+dz*t,d=(x-cx)**2+(z-cz)**2;if(d<distance){distance=d;const yaw=a.yaw+(b.yaw-a.yaw)*t;best={section,t,index:i,x:cx,z:cz,y:a.y+(b.y-a.y)*t,yaw,width:a.width+(b.width-a.width)*t,u:a.u+(b.u-a.u)*t,s:a.s+(b.s-a.s)*t,lateral:(x-cx)*Math.cos(yaw)-(z-cz)*Math.sin(yaw)};}}return best;}
 update(x,z){const point=this.locate(x,z);this.current=point.section;this.distance=Math.max(this.distance,point.s-18);while(this.sections.at(-1).id<this.current.id+ROAD_CONFIG.ahead)this.append();while(this.sections.length>ROAD_CONFIG.activeSections&&this.sections[0].id<this.current.id-ROAD_CONFIG.behind)this.sections.shift(),this.binsDirty=true;return point;}
 submergedRockHeight(section,u,lateral){
  if(!section.fordRocks)return 0;
  let total=0;
  for(const feature of section.localFeatures)if(feature.underwater)
   total+=feature.height*obstacleWeight(feature,u,lateral,section.length);
  return total*envelope(u);
 }
 localHeight(section,u,lateral){let h=0;for(const o of section.obstacles)h+=o.height*obstacleWeight(o,u,lateral,section.length);for(const o of section.localFeatures)h+=o.height*obstacleWeight(o,u,lateral,section.length);if(section.type==='RUTS')h-=.115*envelope(u)*(Math.exp(-((((lateral-.84)/.40)**2)))+Math.exp(-((((lateral+.84)/.40)**2))));return h*envelope(u)+rockyRoadHeight(section,u,lateral);}
 height(x,z){const p=this.locate(x,z),outside=Math.max(0,Math.abs(p.lateral)-p.width/2);return p.y+this.localHeight(p.section,p.u,p.lateral)+.025*outside+.12*Math.sin(p.lateral*.2)**2*smooth(outside/5);}
 normal(x,z){const h=.08,a=this.height(x-h,z)-this.height(x+h,z),b=this.height(x,z-h)-this.height(x,z+h),length=Math.hypot(a,2*h,b);return[a/length,2*h/length,b/length];}
 surface(x,z){return this.surfaceAt(this.locate(x,z));}
 surfaceAt(p){const env=Math.sin(Math.PI*p.u)**2,edge=Math.abs(p.lateral),onRoad=edge<p.width/2;let surfaceType=onRoad?(p.section.surface||'DIRT'):'GRASS',mudDepth=0,waterDepth=0,peatDepth=onRoad&&p.section.type==='PEAT_BOG'?.32*envelope(p.u):0;
 const obstacle=contactFeature(p.section,p.u,p.lateral,onRoad);
 if(obstacle){
  const weight=obstacleWeight(obstacle,p.u,p.lateral,p.section.length);
  surfaceType=obstacle.surfaceType;
  mudDepth=(obstacle.mudDepth||0)*weight;
  waterDepth=(obstacle.waterDepth||0)*weight;
  peatDepth=Math.max(peatDepth,(obstacle.peatDepth||0)*weight);
 }
 if(onRoad&&['ROCK_SECTION','CHICANE'].includes(p.section.type))surfaceType='ROCK';const c={...SURFACE_CONFIG[surfaceType]};if(surfaceType==='ASPHALT'){const blend=asphaltBlend(p.section,p.u);for(const key of Object.keys(c))c[key]=SURFACE_CONFIG.DIRT[key]+(c[key]-SURFACE_CONFIG.DIRT[key])*blend;}if(surfaceType==='MUD'){c.longitudinalGrip*=1-SURFACE_SETTINGS.mudGripLoss*mudDepth;c.lateralGrip*=1-.45*mudDepth;c.rollingResistance+=SURFACE_SETTINGS.mudResistance*mudDepth;c.sinkAmount=Math.min(.10,c.sinkAmount*mudDepth);}if(surfaceType==='PEAT'){
  peatDepth=Math.max(peatDepth,.30*envelope(p.u));
  c.longitudinalGrip*=Math.max(.55,1-.40*peatDepth);
  c.lateralGrip*=Math.max(.50,1-.37*peatDepth);
  c.rollingResistance+=peatDepth*.07;
  c.sinkAmount=Math.min(SURFACE_SETTINGS.maxVisualSink,c.sinkAmount*(.5+peatDepth));
 }else peatDepth=0;
 if(surfaceType==='WATER'){
  c.rollingResistance+=waterDepth*SURFACE_SETTINGS.waterResistance;
  // Silty submerged ground: deep offroad fords feel close to mud, without changing rally puddles.
  if(this.offroadMode&&waterDepth>.08){
   c.longitudinalGrip*=Math.max(.36,1-waterDepth*1.03);
   c.lateralGrip*=Math.max(.40,1-waterDepth*.84);
   c.rollingResistance+=waterDepth*.14;
   c.slipResistance=2.0;
   c.effectMultiplier*=1.18;
  }
 }const offroadFactor=onRoad?0:smooth((edge-p.width/2)/SURFACE_SETTINGS.offroadShoulderBlend);const result={surfaceType,mudDepth,waterDepth,peatDepth,offroadFactor,...c};return this.environment?this.environment.surface(result):result;}
 visualMaterial(section,u,lateral){
  const width=section.nodes[Math.min(section.nodes.length-1,Math.floor(u*(section.nodes.length-1)))].width;
  const selected=contactFeature(section,u,lateral,Math.abs(lateral)<width/2);
  if(selected)return selected.surfaceType==='ROCK'?'HAZARD_ROCK':selected.surfaceType;
  for(const o of section.localFeatures){
   if(o.shape==='bank'||o.surfaceType)continue;
   if(obstacleWeight(o,u,lateral,section.length)>.15)
    return o.kind.startsWith('LOG_')?'WOOD':['PIT','POTHOLE','SHORT_RUT','DITCH'].includes(o.kind)?'PIT':o.kind==='BUMP'?'EARTH_BUMP':'DIRT';
  }
  return this.surfaceAt({section,u,lateral,width}).surfaceType;
 }
 point(section=this.current,u=.15){u=clamp(u,0,1);let lo=0,hi=section.nodes.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(section.nodes[mid].u<=u)lo=mid;else hi=mid;}const a=section.nodes[lo],b=section.nodes[hi],t=(u-a.u)/(b.u-a.u);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,yaw:a.yaw+(b.yaw-a.yaw)*t,width:a.width+(b.width-a.width)*t};}

 shift(dx,dz){for(const s of this.sections){for(const n of s.nodes){n.x-=dx;n.z-=dz;}for(const tr of [s.entryTransform,s.exitTransform,...s.decorations,...(s.visualDecor||[])]){tr.x-=dx;tr.z-=dz;}}this.offset[0]+=dx;this.offset[1]+=dz;this.revision++;this.binsDirty=true;}
}
