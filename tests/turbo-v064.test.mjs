import test from 'node:test';
import assert from 'node:assert/strict';
import {OffroadVehicle,CAR_CONFIG} from '../physics.js';
import {RunState} from '../run-state.js';
import {VehicleFeedback} from '../feedback.js';
import {STOCK_BUILD,suspensionConfig,tireSurface} from '../garage.js';
import {StadiumWorld,STADIUM_CONFIG} from '../cow-stadium.js';
function trial(engine){const build={...STOCK_BUILD,engine},world=new StadiumWorld(42),run=new RunState(new VehicleFeedback(42,0));run.garageBuild=build;run.reset();run.randomFailures=false;const surface=()=>tireSurface(world.surface(0,0),build),body=new OffroadVehicle({height:()=>0,normal:()=>[0,1,0],surface,grip:()=>surface().longitudinalGrip,afterStep:(dt,b)=>run.tick(dt,b)},suspensionConfig({...CAR_CONFIG,mapLimit:Infinity},build));run.body=body;run.mechanical.bind(body,42);run.expedition.bind(body,{sections:[]});run.applyEngine(body);let to60=null,speed2;for(let i=0;i<360;i++){body.advance(1/60,{drive:1,steer:0});if(i===119)speed2=body.state.vehicleSpeed;if(to60===null&&body.state.vehicleSpeed>=60)to60=(i+1)/60;}return{body,run,to60,speed2};}
test('turbo retains +30% torque and beats stock with identical healthy car and grip',()=>{const stock=trial('stock'),turbo=trial('turbo');assert.equal(stock.body.state.enginePowerFactor,1);assert.equal(turbo.body.state.enginePowerFactor,1.3);assert.equal(Math.max(...CAR_CONFIG.engineTorqueCurve.map(p=>p[1])),209);assert.ok(turbo.to60<stock.to60*.9);assert.ok(turbo.speed2>stock.speed2);assert.equal(turbo.run.hp,100);turbo.run.hp=25;turbo.run.applyEngine(turbo.body);assert.equal(turbo.body.state.enginePowerFactor,.85*1.3);turbo.run.fuel=0;turbo.run.applyEngine(turbo.body);assert.equal(turbo.body.state.enginePowerFactor,0);});
test('arena cows panic and dodge slower while herd limits are unchanged',()=>{assert.equal(STADIUM_CONFIG.initialCows,30);assert.equal(STADIUM_CONFIG.finalCows,50);assert.ok(STADIUM_CONFIG.cowPanicSpeed<3.4);assert.ok(STADIUM_CONFIG.cowDodgeSpeed<4.4);});
