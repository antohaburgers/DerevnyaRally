import test from 'node:test';
import assert from 'node:assert/strict';
import {ExpeditionWorld} from '../expedition-world.js';
import {OBSTACLE_CONFIG} from '../obstacles.js';

test('routes include short tracks, forest, ruts and peat rather than continuous highways',()=>{
 const w=new ExpeditionWorld(42);for(const road of w.roads.filter(r=>r.length>500&&!['bridge','ford'].includes(r.surface))){const stages=new Set();let cleared=0,total=0;for(let s=65;s<road.length-60;s+=5){const p=w.map.routeProfile({road,distanceAlong:s});stages.add(p.stage);cleared+=p.cleared?1:0;total++;}assert.ok(stages.has('FOREST'));assert.ok(stages.has('BOG'));assert.ok(stages.has('RUTS'));assert.ok(cleared/total<.25);}
});
test('original obstacle definitions produce real height and material challenges outside roads',()=>{
 const w=new ExpeditionWorld(9981);for(let z=2100;z>-2400;z-=256)w.update(900*Math.sin(z/900),z);const features=[...w.map.terrain.cells.values()].flat();const outside=features.filter(f=>(w.map.roadAt(f.x,f.z)?.distance??1000)>20);assert.ok(outside.length>5);
 assert.ok(outside.some(f=>f.kind==='TECH_HILL'||OBSTACLE_CONFIG.types[f.kind]));assert.ok(outside.some(f=>Math.abs(w.map.terrain.sample(f.x,f.z).height)>.15));assert.ok(features.some(f=>['PEAT','MUD','ROCK'].includes(f.surfaceType)));
});
test('fine obstacle mesh and physical height match, including coarse/detail transitions',()=>{
 const w=new ExpeditionWorld(42);const f=[...w.map.terrain.routeBins.values()].flat().find(f=>f.kind.startsWith('LOG'));assert.ok(f);w.update(f.x,f.z);let fine=0,checks=0;
 w.terrainTriangles(w.current,(key,a,b,c)=>{if(key==='WATER_TOP')return;const area=Math.abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]));if(area<1)fine++;const x=w.current.entryTransform.x+(a[0]+b[0]+c[0])/3,z=w.current.entryTransform.z+(a[2]+b[2]+c[2])/3;assert.ok(Math.abs(w.height(x,z)-(a[1]+b[1]+c[1])/3)<1e-7);checks++;});assert.ok(fine>0);assert.ok(checks>8192);
 for(let x=Math.floor(f.x/2)*2-12;x<=f.x+12;x+=2)for(let z=Math.floor(f.z/2)*2-12;z<=f.z+12;z+=2)assert.ok(Math.abs(w.height(x-1e-5,z+.7)-w.height(x+1e-5,z+.7))<.002);
});
