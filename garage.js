import {LIVERY_ASSETS} from './livery-system.js?v=033';
// Persistent cosmetic and performance loadout. Wheel radius is intentionally unchanged.
export const GARAGE_KEY='niva3d.garageBuild.v1';
export const PAINTS={murena:[.20,.32,.30],white:[.86,.87,.80],black:[.12,.15,.16],blue:[.15,.33,.63],red:[.70,.17,.15],silver:[.59,.63,.64],sand:[.67,.59,.43],yellow:[.85,.63,.18]};
export const STOCK_BUILD=Object.freeze({tires:'stock',engine:'stock',arches:false,rack:false,frontBumper:false,rearBumper:false,fogLights:false,snorkel:false,color:'murena',livery:'none',suspension:'stock',springTune:'standard'});
// Height and damping presets are deliberately independent; existing saves remain compatible.
export const SUSPENSION_KITS=Object.freeze({
 stock:{label:'СТОК',lift:0,extraCompression:0,extraDroop:0},
 trophy:{label:'ТРОФИ +40',lift:.04,extraCompression:.015,extraDroop:.035},
 extreme:{label:'ЭКСТРИМ +60',lift:.06,extraCompression:.025,extraDroop:.060}
});
export const SPRING_TUNES=Object.freeze({
 soft:{label:'МЯГКАЯ',spring:.86,damper:.82,antiRoll:.60,compression:.012,droop:.022},
 standard:{label:'СТАНДАРТ',spring:1,damper:1,antiRoll:1,compression:0,droop:0},
 hard:{label:'ЖЁСТКАЯ',spring:1.25,damper:1.22,antiRoll:1.48,compression:-.010,droop:-.013}
});
// Maps the user's garage build to true SI physical spring / damper / travel settings.
// COM in the vehicle body stays unchanged, hence it rises in world coordinates with lift.
export function suspensionConfig(base,build){
 const kit=SUSPENSION_KITS[build?.suspension]||SUSPENSION_KITS.stock;
 const tune=SPRING_TUNES[build?.springTune]||SPRING_TUNES.standard;
 if(kit.lift===0&&tune.spring===1)return base; // Preserve exact v0.44 stock physics.
 const frontSpring=base.springRate.front*tune.spring,rearSpring=base.springRate.rear*tune.spring;
 const preload=axle=>base.mass*base.gravity/4*(1/(base.springRate[axle]*tune.spring)-1/base.springRate[axle]);
 const travel={};
 for(const axle of ['front','rear']){
  const original=base.suspensionTravel[axle];
  travel[axle]={
   rest:original.rest+kit.lift+preload(axle),
   compression:Math.max(.08,original.compression+kit.extraCompression+tune.compression),
   droop:Math.max(.07,original.droop+kit.extraDroop+tune.droop)
  };
 }
 return {...base,
  springRate:{front:frontSpring,rear:rearSpring},
  damping:{front:base.damping.front*tune.damper,rear:base.damping.rear*tune.damper},
  antiRoll:{front:base.antiRoll.front*tune.antiRoll,rear:base.antiRoll.rear*tune.antiRoll},
  suspensionTravel:travel,
  bumpStop:base.bumpStop*(tune.spring===1?1:tune.spring>1?1.10:.90)
 };
}
const booleanKeys=['arches','rack','frontBumper','rearBumper','fogLights','snorkel'];
export function normalizeBuild(value){
 const b={...STOCK_BUILD},v=value&&typeof value==='object'?value:{};
 if(v.tires==='offroad')b.tires='offroad';
 if(v.engine==='turbo')b.engine='turbo';
 if(Object.hasOwn(SUSPENSION_KITS,v.suspension))b.suspension=v.suspension;
 if(Object.hasOwn(SPRING_TUNES,v.springTune))b.springTune=v.springTune;
 if(Object.prototype.hasOwnProperty.call(PAINTS,v.color))b.color=v.color;
 if(v.livery==='none'||Object.prototype.hasOwnProperty.call(LIVERY_ASSETS,v.livery))b.livery=v.livery;
 for(const key of booleanKeys)b[key]=v[key]===true;
 return b;
}
export function loadBuild(storage){try{return normalizeBuild(JSON.parse(storage?.getItem(GARAGE_KEY)));}catch{return normalizeBuild();}}
export function saveBuild(storage,value){const b=normalizeBuild(value);try{storage?.setItem(GARAGE_KEY,JSON.stringify(b));}catch{}return b;}
export function tireSurface(surface,b){
 if(b?.tires!=='offroad')return surface;
 const values={ASPHALT:[.92,.96,1.1],DIRT:[1.13,1.10,.99],SOFT_DIRT:[1.22,1.15,.88],MUD:[1.30,1.22,.82],WATER:[1.26,1.17,.85],GRASS:[1.12,1.11,.97],ROCK:[1.08,1.08,.94]};
 const m=values[surface.surfaceType]||[1,1,1];
 return{...surface,longitudinalGrip:surface.longitudinalGrip*m[0],lateralGrip:surface.lateralGrip*m[1],rollingResistance:surface.rollingResistance*m[2]};
}
export function boostLevel(state){
 if(!state?.turboInstalled||state.engineRunning===false)return 0;
 const rev=Math.max(0,Math.min(1,((state.currentRPM||850)-1300)/2800));
 const throttle=Math.max(0,Math.min(1,state.throttle||0));
 return Math.round(rev*throttle*650)/1000;
}
