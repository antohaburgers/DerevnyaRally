// Persistent cosmetic and performance loadout. Wheel radius is intentionally unchanged.
export const GARAGE_KEY='niva3d.garageBuild.v1';
export const PAINTS={murena:[.20,.32,.30],white:[.86,.87,.80],black:[.12,.15,.16],blue:[.15,.33,.63],red:[.70,.17,.15],silver:[.59,.63,.64],sand:[.67,.59,.43],yellow:[.85,.63,.18]};
export const STOCK_BUILD=Object.freeze({tires:'stock',engine:'stock',arches:false,rack:false,frontBumper:false,rearBumper:false,fogLights:false,snorkel:false,color:'murena',livery:'none'});
const booleanKeys=['arches','rack','frontBumper','rearBumper','fogLights','snorkel'];
export function normalizeBuild(value){
 const b={...STOCK_BUILD},v=value&&typeof value==='object'?value:{};
 if(v.tires==='offroad')b.tires='offroad';
 if(v.engine==='turbo')b.engine='turbo';
 if(Object.prototype.hasOwnProperty.call(PAINTS,v.color))b.color=v.color;
 if(['none','beer','anime'].includes(v.livery))b.livery=v.livery;
 for(const key of booleanKeys)b[key]=v[key]===true;
 return b;
}
export function loadBuild(storage){try{return normalizeBuild(JSON.parse(storage?.getItem(GARAGE_KEY)));}catch{return normalizeBuild();}}
export function saveBuild(storage,value){const b=normalizeBuild(value);try{storage?.setItem(GARAGE_KEY,JSON.stringify(b));}catch{}return b;}
export function tireSurface(surface,b){
 if(b?.tires!=='offroad')return surface;
 const values={ASPHALT:[.92,.96,1.1],DIRT:[1.13,1.10,.99],SOFT_DIRT:[1.22,1.15,.88],MUD:[1.30,1.22,.82],WATER:[1.26,1.17,.85],GRASS:[1.12,1.11,.97],ROCK:[1.08,1.08,1]};
 const m=values[surface.surfaceType]||[1,1,1];
 return{...surface,longitudinalGrip:surface.longitudinalGrip*m[0],lateralGrip:surface.lateralGrip*m[1],rollingResistance:surface.rollingResistance*m[2]};
}
export function boostLevel(state){
 if(!state?.turboInstalled||state.engineRunning===false)return 0;
 const rev=Math.max(0,Math.min(1,((state.currentRPM||850)-1300)/2800));
 const throttle=Math.max(0,Math.min(1,state.throttle||0));
 return Math.round(rev*throttle*650)/1000;
}
