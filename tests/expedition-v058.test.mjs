import test from 'node:test';
import assert from 'node:assert/strict';
import {ExpeditionMap} from '../expedition-map.js';
import {buildExpeditionTileGeometry} from '../expedition-3d-render.js';
import {OffroadVehicle,CAR_CONFIG} from '../physics.js';
import {SURFACE_CONFIG} from '../surfaces.js';

test('roads differ by shape, width, material and driving difficulty',()=>{
 for(const seed of [1,42,731024,9981,0xffffffff]){
  const map=new ExpeditionMap(seed);
  assert.equal(map.routeExists(),true);
  assert.equal(map.roads.length,47);
  assert.ok(new Set(map.roads.map(r=>r.surface)).size>=5);
  assert.ok(new Set(map.roads.map(r=>Math.round(r.width*10))).size>=12);
  assert.ok(map.roads.every(r=>r.path.length>=8));
  assert.ok(map.roads.some(r=>r.kind==='bridge'));
  assert.ok(map.roads.some(r=>r.kind==='ford'));
 }
});
test('streamed 3D geometry is valid, finite and bounded to the visible tiles',()=>{
 for(const seed of [731024,42]){
  const m=new ExpeditionMap(seed);
  for(let z=2500;z>-2500;z-=650){
   m.update(250*Math.sin(z/280),z);
   assert.ok(m.activeTiles.length<=25);
   for(const tile of m.activeTiles){
    const geometry=buildExpeditionTileGeometry(m,tile);
    assert.ok(geometry.length>0);
    assert.equal(geometry.length%9,0);
    assert.ok(geometry.every(Number.isFinite));
   }
  }
 }
});
test('real four-wheel driving physics accepts the new terrain and surface materials',()=>{
 const map=new ExpeditionMap(731024);
 const height=(x,z)=>map.terrainHeight(x,z);
 const normal=(x,z)=>{const d=.18,a=height(x-d,z)-height(x+d,z),b=height(x,z-d)-height(x,z+d),L=Math.hypot(a,2*d,b);return[a/L,d*2/L,b/L]};
 const surface=(x,z)=>{const p=map.surfaceAt(x,z);return {...SURFACE_CONFIG[p.surfaceType],...p};};
 const car=new OffroadVehicle({height,normal,surface,grip:(x,z)=>surface(x,z).longitudinalGrip},{...CAR_CONFIG,mapLimit:Infinity});
 car.setPhysicsRate(90);car.reset(map.start.x,map.start.z,map.roadAt(map.start.x,map.start.z).yaw);car.state.offroadMode=true;
 for(let i=0;i<240;i++)car.advance(1/60,{analog:true,throttle:i<180?1:0,brake:0,steer:i>120?.12:0,handbrake:false});
 assert.ok(car.state.vehicleSpeed>4);
 assert.ok([...car.p,...car.v,...car.q,...car.wheels.map(w=>w.load)].every(Number.isFinite));
});
