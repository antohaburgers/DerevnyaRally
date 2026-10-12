import test from 'node:test';
import assert from 'node:assert/strict';
import {OffroadVehicle,CAR_CONFIG} from '../physics.js';
import {RunState} from '../run-state.js';
import {VehicleFeedback} from '../feedback.js';
import {STOCK_BUILD} from '../garage.js';
import {SURFACE_CONFIG} from '../surfaces.js';
function rig(){let wet=0;const terrain={height:()=>0,normal:()=>[0,1,0],surface:()=>({surfaceType:wet?'WATER':'DIRT',...SURFACE_CONFIG[wet?'WATER':'DIRT'],waterDepth:wet,mudDepth:0,peatDepth:0,wetness:0,offroadFactor:0})};const feedback=new VehicleFeedback(42),run=new RunState(feedback,null),body=new OffroadVehicle(terrain,{...CAR_CONFIG,mapLimit:Infinity});run.garageBuild={...STOCK_BUILD};run.reset();run.randomFailures=false;run.body=body;run.expedition.bind(body,{sections:[]});run.mechanical.bind(body);run.applyEngine(body);terrain.afterStep=(dt,b)=>run.tick(dt,b);const tick=(secs,throttle=0)=>{for(let i=0;i<secs*60;i++)body.advance(1/60,{analog:true,throttle,brake:0,steer:0});};return {body,run,tick,setWater:d=>wet=d};}

test('flooded engine cannot fake gas RPM and automatically restores real drive on dry ground',()=>{
 const r=rig();r.tick(1);r.setWater(.72);r.tick(2);assert.equal(r.run.expedition.engine.stalled,true);const fuel=r.run.fuel;r.tick(2,1);assert.equal(r.run.fuel,fuel);assert.equal(r.body.state.engineRunning,false);assert.ok(r.body.state.currentRPM<30);assert.ok(r.body.wheels.every(w=>Math.abs(w.driveTorque)<1));
 const before=r.body.p.slice();r.setWater(0);r.tick(3,1);assert.equal(r.run.expedition.engine.stalled,false);assert.equal(r.body.state.engineRunning,true);assert.ok(r.body.state.currentRPM>850);assert.ok(r.body.state.vehicleSpeed>4);assert.ok(Math.hypot(r.body.p[0]-before[0],r.body.p[2]-before[2])>1);assert.equal(r.run.mechanical.frontDriveActive,true);assert.equal(r.run.mechanical.rearDriveActive,true);
});
test('manual restart samples new coordinates immediately and does not repair broken driveline',()=>{
 const r=rig();r.setWater(.72);r.tick(2);assert.equal(r.run.expedition.canRestart(),false);assert.equal(r.run.expedition.restart(),false);
 r.run.mechanical.fail('FRONT_DRIVE_FAILURE');r.body.state.currentGear=4;r.body.state.shiftRemaining=.18;r.setWater(0);assert.equal(r.run.expedition.restart(),true);r.run.applyEngine(r.body);assert.equal(r.body.state.currentGear,1);assert.equal(r.body.state.shiftRemaining,0);assert.equal(r.body.state.engineFlooded,false);assert.equal(r.body.state.frontDriveActive,false);assert.ok(r.body.state.enginePowerFactor>0);
});
test('restart remains forbidden under water or without fuel',()=>{
 const r=rig();r.setWater(.72);r.tick(2);r.tick(3,1);assert.equal(r.run.expedition.engine.stalled,true);r.setWater(0);r.run.fuel=0;r.run.applyEngine(r.body);assert.equal(r.run.expedition.restart(),false);r.tick(2,1);assert.equal(r.body.state.engineRunning,false);
});
