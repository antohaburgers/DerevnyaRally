export const PERFORMANCE_CONFIG={nearPhysics:40,midPhysics:120,gameplayHz:30,environmentHz:25,meshInterval:.15,meshDistance:12};
export class SpatialGrid{
 constructor(size=20){this.size=size;this.cells=new Map();this.result=[];}
 rebuild(items){for(const cell of this.cells.values())cell.length=0;for(const a of items){if(!a.active||a.hit)continue;const key=Math.floor(a.x/this.size)+','+Math.floor(a.z/this.size);let cell=this.cells.get(key);if(!cell)this.cells.set(key,cell=[]);cell.push(a);}for(const key of this.cells.keys())if(!this.cells.get(key).length)this.cells.delete(key);return this;}
 nearby(x,z,radius=12){const out=this.result;out.length=0;const loX=Math.floor((x-radius)/this.size),hiX=Math.floor((x+radius)/this.size),loZ=Math.floor((z-radius)/this.size),hiZ=Math.floor((z+radius)/this.size),rr=radius*radius;for(let i=loX;i<=hiX;i++)for(let j=loZ;j<=hiZ;j++){const cell=this.cells.get(i+','+j);if(cell)for(const a of cell)if(a.active&&!a.hit&&(a.x-x)**2+(a.z-z)**2<=rr)out.push(a);}return out;}
}
// Keep the original substep distance ledger while batching resource and pickup work.
export class GameplayClock{
 constructor(hz=30){this.interval=1/hz;this.reset();}
 reset(){this.elapsed=0;this.distance=0;this.impact=null;this.impactSnapshot??={position:[0,0,0]};}
 captureImpact(impact){const snapshot=this.impactSnapshot,position=snapshot.position;Object.assign(snapshot,impact);if(impact.position){for(let i=0;i<3;i++)position[i]=impact.position[i];snapshot.position=position;}this.impact=snapshot;}
 step(dt,body,callback){this.elapsed+=dt;this.distance+=Math.max(0,body.state.stepDistance||0);const impact=body.state.bodyImpact;if(impact?.fresh&&(!this.impact||impact.impulse>this.impact.impulse))this.captureImpact(impact);if(this.elapsed+1e-9<this.interval)return;const elapsed=this.elapsed,stepDistance=body.state.stepDistance,bodyImpact=body.state.bodyImpact;this.elapsed=0;body.state.stepDistance=this.distance;this.distance=0;if(this.impact)body.state.bodyImpact=this.impact;this.impact=null;try{callback(elapsed,body);}finally{body.state.stepDistance=stepDistance;body.state.bodyImpact=bodyImpact;}}
}
export function aiPhysicsRate(distance,current=180){if(current===180&&distance<43||distance<38)return 180;if(current===60&&distance>115||distance>123)return 60;return distance<=40?180:distance<=120?90:60;}
export const controllerInterval=d=>d<50?1/40:d<150?1/18:1/8;
export class RenderScale{
 constructor(){this.dpr=1.5;this.elapsed=0;this.frames=0;this.highWindows=0;this.fps=60;}
 update(dt){if(dt<=0||dt>1)return this.dpr;this.elapsed+=dt;this.frames++;if(this.elapsed<3)return this.dpr;this.fps=this.frames/this.elapsed;this.elapsed=0;this.frames=0;if(this.fps<45){this.dpr=1;this.highWindows=0;}else if(this.fps<53){this.dpr=Math.min(this.dpr,1.25);this.highWindows=0;}else if(this.fps>=57){if(++this.highWindows>=2){this.dpr=this.dpr<1.25?1.25:1.5;this.highWindows=0;}}else this.highWindows=0;return this.dpr;}
}
export class Profiler{
 constructor(enabled=false){this.enabled=enabled;this.values={};this.drawCalls=0;this.samples={};this.frames=[];this.maxFrame=0;}
 now(){return this.enabled?performance.now():0;}
 record(key,start){if(this.enabled)this.samples[key]=(this.samples[key]||0)+performance.now()-start;}
 end(){if(!this.enabled)return;for(const key of ["player","aiPhysics","aiController","collisions","world","render"]){const v=this.samples[key]||0;this.values[key]=(this.values[key]??v)*.92+v*.08;this.samples[key]=0;}}
 frame(ms){if(!this.enabled)return;this.frames.push(ms);if(this.frames.length>240)this.frames.shift();this.maxFrame=Math.max(...this.frames);this.values.frame=(this.values.frame??ms)*.95+ms*.05;}
 text(){return `FRAME ${(this.values.frame||0).toFixed(1)}ms MAX ${this.maxFrame.toFixed(1)}ms · PLAYER ${(this.values.player||0).toFixed(2)}ms AI PHYS ${(this.values.aiPhysics||0).toFixed(2)}ms AI CTRL ${(this.values.aiController||0).toFixed(2)}ms COLLISIONS ${(this.values.collisions||0).toFixed(2)}ms WORLD ${(this.values.world||0).toFixed(2)}ms RENDER ${(this.values.render||0).toFixed(2)}ms DRAW CALLS ${this.drawCalls}`;}
}
