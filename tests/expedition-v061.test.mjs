import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ExpeditionWorld} from '../expedition-world.js';
import {ExpeditionSession} from '../expedition-session.js';
import {OffroadVehicle,CAR_CONFIG} from '../physics.js';

test('forest tuning is deterministic, away from roads and not inside buildings',()=>{
 for(const seed of [1,42,9981,731024,0xffffffff]){const w=new ExpeditionWorld(seed),caches=w.landmarks.filter(p=>p.inForest);assert.equal(caches.length,3);assert.equal(w.landmarks.filter(p=>p.upgrade).length,6);
  for(const p of caches){assert.ok((w.map.roadAt(p.x,p.z)?.distance??Infinity)>35);assert.equal(w.map.biomeAt(p.x,p.z),'FOREST');w.update(p.x,p.z);assert.ok(!w.sections.flatMap(s=>s.decorations).some(d=>d.kind==='house'&&Math.hypot(d.x-p.x,d.z-p.z)<12));}
  const second=new ExpeditionWorld(seed);assert.deepEqual(second.landmarks,w.landmarks);
 }
});
test('navigation picks nearest uncollected point in the viewing direction and hides elsewhere',()=>{
 const run={garageBuild:{},mechanical:{},expedition:{},feedback:{}},body={p:[0,0,0],state:{}};
 const world={start:{x:0,z:0},map:{roadAt:()=>null},landmarks:[{x:0,z:100,upgrade:'rearLock'},{x:0,z:200,upgrade:'frontLock'},{x:0,z:-60,kind:'delivery',label:'ДЕРЕВНЯ'}]};
 const s=new ExpeditionSession(world,run,body,{});assert.match(s.navigation(0),/ЗАДНЯЯ БЛОКИРОВКА · 100 М/);s.found.add('rearLock');assert.match(s.navigation(0),/ПЕРЕДНЯЯ БЛОКИРОВКА · 200 М/);assert.equal(s.navigation(Math.PI/2),'');assert.match(s.navigation(Math.PI),/ДЕРЕВНЯ/);
});
test('missing axle locks cannot engage through requests or pending state; AWD remains intact',()=>{
 const body=new OffroadVehicle({height:()=>0,normal:()=>[0,1,0],grip:()=>1},{...CAR_CONFIG,mapLimit:Infinity});Object.assign(body.state,{rearLockInstalled:false,frontLockInstalled:false,frontDriveActive:true,rearDriveActive:true});assert.equal(body.requestRear(),false);assert.equal(body.requestFront(),false);body.state.pendingRear=body.state.pendingFront=true;body.advance(1/60,{drive:0});assert.equal(body.state.rearLocked,false);assert.equal(body.state.frontLocked,false);assert.equal(body.state.pendingRear,null);assert.equal(body.state.pendingFront,null);assert.equal(body.state.frontDriveActive,true);assert.equal(body.state.rearDriveActive,true);body.state.rearLockInstalled=true;body.state.frontLockInstalled=true;body.requestRear();body.requestFront();assert.equal(body.state.pendingRear,true);assert.equal(body.state.pendingFront,true);
});
test('only manually opened map remains in HTML, with a compact directional label',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(!html.includes('<aside id="expedition-minimap-panel"'));assert.ok(html.includes('id="expedition-navigation"'));assert.ok(html.includes('id="expedition-map-panel" hidden'));assert.ok(html.includes('id="expedition-map-button"'));
});
