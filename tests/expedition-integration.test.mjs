import test from 'node:test';
import assert from 'node:assert/strict';
import {ExpeditionWorld} from '../expedition-world.js';
import {OffroadVehicle,CAR_CONFIG} from '../physics.js';
import {ExpeditionSystems} from '../expedition-systems.js';

const seeds=[1,42,731024,9981,0xffffffff];
test('irregular graph has loops, dead ends, all POIs connected and a firm bridge route',()=>{
 for(const seed of seeds){const w=new ExpeditionWorld(seed),m=w.map,degree=m.nodes.map(()=>0);for(const r of m.roads){degree[r.from]++;degree[r.to]++;assert.ok(r.path.length>=8);assert.ok(r.path.every(p=>m.bounds(p.x,p.z)));}
 assert.ok(degree.filter(d=>d===1).length>=4);assert.ok(m.roads.length>m.nodes.length);assert.ok(new Set(m.roads.map(r=>r.surface)).size>=8);
 for(const poi of m.landmarks)assert.ok(m.routeExists(m.start.id,poi.nodeId));
 const edges=m.roads.filter(r=>['gravel','bridge'].includes(r.surface)),seen=new Set([m.start.id]);for(let i=0;i<m.nodes.length;i++)for(const e of edges){if(seen.has(e.from))seen.add(e.to);if(seen.has(e.to))seen.add(e.from);}assert.ok(seen.has(m.goal.id));
 assert.ok(m.landmarks.filter(p=>p.upgrade).every(p=>p.z>=650-40));
 }
});
test('exact triangle contact height is continuous at every sampled chunk seam',()=>{
 const w=new ExpeditionWorld(42);for(let x=-1408;x<=1408;x+=128)for(let z=-2816;z<=2816;z+=256){const h=w.height(x,z);w.update(x+60,z+60);assert.equal(w.height(x,z),h);assert.ok(Math.abs(w.height(x-1e-5,z)-w.height(x+1e-5,z))<1e-3);}
 const section=w.current;let checks=0;w.terrainTriangles(section,(key,a,b,c)=>{if(key==='WATER_TOP')return;const x=section.entryTransform.x+(a[0]+b[0]+c[0])/3,z=section.entryTransform.z+(a[2]+b[2]+c[2])/3;assert.ok(Math.abs(w.height(x,z)-(a[1]+b[1]+c[1])/3)<1e-8);checks++;});assert.equal(checks,8192);
});
test('streamed world is bounded, objects survive unloading and coordinates are deterministic',()=>{
 const a=new ExpeditionWorld(9981),b=new ExpeditionWorld(9981);const key=a.current.id;const snapshot=structuredClone(a.current.decorations);b.update(-1000,-2200);b.update(a.start.x,a.start.z);assert.deepEqual(b.current.decorations,snapshot);
 const tree=a.current.decorations.find(d=>d.kind==='tree');assert.ok(tree);tree.broken=true;a.current.decorationRevision++;a.update(1100,-2400);a.update(a.start.x,a.start.z);assert.equal(a.sectionCache.get(key).decorations.find(d=>d.id===tree.id).broken,true);
 for(let z=2700;z>=-2700;z-=256){a.update(Math.sin(z/600)*1100,z);assert.ok(a.sections.length<=25);assert.equal(a.sections.length,a.sectionCache.size);assert.ok(a.heightCache.size<=49);}
});
test('bridge contact is above water, fords differ and the original intake can stall',()=>{
 const w=new ExpeditionWorld(731024);const x=1200,z=w.map.river(x).center;assert.ok(w.height(x,z)>3.3);assert.equal(w.surface(x,z).waterDepth,0);
 for(const [x,min,max] of [[-770,.35,.49],[80,.60,.87],[450,1.1,1.6]]){const z=w.map.river(x).center;const s=w.surface(x,z);assert.ok(s.waterDepth>=min&&s.waterDepth<=max,`${x}: ${s.waterDepth}`);}
 const events=[],system=new ExpeditionSystems({emit:t=>events.push(t)}),body={state:{vehicleSpeed:0},wheels:Array.from({length:4},()=>({waterDepth:.72,contact:true,surfaceType:'WATER'}))};system.reset({snorkel:false});for(let i=0;i<120;i++)system.tick(1/60,body);assert.equal(system.engine.stalled,true);assert.ok(events.includes('ENGINE_FLOODED'));system.reset({snorkel:true});for(let i=0;i<240;i++)system.tick(1/60,body);assert.equal(system.engine.stalled,false);
});
test('real vehicle drives freely across terrain and has finite four-wheel contacts',()=>{
 const w=new ExpeditionWorld(42),body=new OffroadVehicle({height:(x,z)=>w.height(x,z),normal:(x,z)=>w.normal(x,z),surface:(x,z)=>w.surface(x,z),grip:(x,z)=>w.surface(x,z).longitudinalGrip},{...CAR_CONFIG,mapLimit:Infinity});
 for(const p of [w.start,{x:600,z:2300},{x:-770,z:w.map.river(-770).center},{x:1200,z:w.map.river(1200).center}]){w.update(p.x,p.z);body.reset(p.x,p.z,Math.PI);body.state.offroadMode=true;body.state.transferRange='L';body.state.centerLocked=true;for(let i=0;i<240;i++){body.advance(1/60,{analog:true,throttle:i>90?.6:0,brake:0,steer:.08,handbrake:false});w.update(body.p[0],body.p[2]);assert.ok([...body.p,...body.v,...body.q,...body.wheels.map(t=>t.load)].every(Number.isFinite));}assert.ok(body.p[1]>w.height(body.p[0],body.p[2])-.1);}
});
