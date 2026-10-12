import test from 'node:test';
import assert from 'node:assert/strict';
import {StadiumWorld,STADIUM_CONFIG} from '../cow-stadium.js';
import {OffroadVehicle,CAR_CONFIG} from '../physics.js';
import {SURFACE_CONFIG} from '../surfaces.js';
test('arena is a smooth symmetric bowl, with flat surrounding field and higher grip',()=>{
 const w=new StadiumWorld(42);assert.equal(w.height(0,0),-STADIUM_CONFIG.bowlDepth);assert.equal(w.height(70,0),0);assert.equal(w.height(0,40),0);assert.equal(w.height(300,100),0);assert.equal(w.height(15,10),w.height(-15,-10));assert.deepEqual(w.normal(0,0),[-0,1,-0]);for(let x=0;x<70;x+=2)assert.ok(w.height(x+2,0)>=w.height(x,0));assert.ok(w.surface(0,0).longitudinalGrip>SURFACE_CONFIG.DIRT.longitudinalGrip);assert.ok(w.surface(0,0).lateralGrip>SURFACE_CONFIG.DIRT.lateralGrip);assert.equal(w.surface(0,0).vibrationMultiplier,0);
 const s=w.sections[0];assert.ok(s.decorations.filter(d=>d.kind==='house').length>=10);assert.ok(s.visualDecor.some(d=>d.kind==='horizon'));assert.ok([...s.decorations,...s.visualDecor].every(d=>w.radius(d.x,d.z)>1));let far=0;w.terrainTriangles(s,(key,...points)=>{for(const p of points){assert.ok(p.slice(0,3).every(Number.isFinite));assert.ok(Math.abs(p[1]-w.height(p[0],p[2]))<1e-8);far=Math.max(far,Math.abs(p[2]));}});assert.ok(far>650);
});
test('original stock Niva accelerates promptly on bowl terrain',()=>{
 const w=new StadiumWorld(42),body=new OffroadVehicle({height:(x,z)=>w.height(x,z),normal:(x,z)=>w.normal(x,z),surface:(x,z)=>w.surface(x,z),grip:(x,z)=>w.surface(x,z).longitudinalGrip},{...CAR_CONFIG,mapLimit:Infinity});body.reset(0,-24,0);for(let i=0;i<120;i++)body.advance(1/60,{drive:1,steer:0});assert.ok(body.state.vehicleSpeed>35);assert.ok(body.p.every(Number.isFinite));
});
