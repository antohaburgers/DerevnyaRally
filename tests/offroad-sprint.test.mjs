import test from 'node:test';
import assert from 'node:assert/strict';
import {RoadWorld} from '../road-world.js';
import {buildSprint,SPRINT_CONFIG} from '../sprint-world.js';
import {GAME_MODE,isRaceMode,isOffroadSprint,offroadRivalBuild,trophyFordSurface,raceInput,RaceProgress,RACE_CONFIG} from '../race.js';

test('offroad trophy sprint is a finite race with the original terrain generator',()=>{
 for(const [mode,length] of [[GAME_MODE.OFFROAD_SPRINT_5,5000],[GAME_MODE.OFFROAD_SPRINT_10,10000]]){
  const world=new RoadWorld(71263);
  buildSprint(world,71263,mode);
  assert.equal(world.offroadMode,true);
  assert.equal(world.finiteRace,true);
  assert.equal(world.raceLength,length);
  assert.equal(world.raceFinishS,115+length);
  assert.ok(world.sections.length>10);
  assert.ok(world.sections.some(s=>['ROCK_CRAWL','PEAT_BOG','CROSS_AXLE','FOREST_FORD','ROCK_STEPS','DEEP_MUD'].includes(s.type)), 'real offroad segments must remain');
  assert.ok(world.atDistance(world.raceFinishS)?.section);
  assert.ok(world.sections.slice(0,2).every(s=>s.localFeatures.length===0),'starting grid is traversable');
  const progress=new RaceProgress(world);
  assert.ok(progress.gates.length>5);
  assert.equal(progress.gates.at(-1).s,world.raceFinishS);
 }
});
test('race classification preserves original cup and includes both trophy distances',()=>{
 assert.equal(isRaceMode(GAME_MODE.OFFROAD_SPRINT_5),true);
 assert.equal(isRaceMode(GAME_MODE.OFFROAD_SPRINT_10),true);
 assert.equal(isOffroadSprint(GAME_MODE.CIRCUIT),false);
 assert.equal(isRaceMode(GAME_MODE.OFFROAD),false);
 assert.equal(SPRINT_CONFIG.lengths[GAME_MODE.OFFROAD_SPRINT_5],5000);
 assert.equal(SPRINT_CONFIG.lengths[GAME_MODE.OFFROAD_SPRINT_10],10000);
 assert.equal(RACE_CONFIG.racers,10);assert.equal(RACE_CONFIG.offroadRacers,6);
});
test('seeded rivals have reproducible and genuinely different offroad setups',()=>{
 const builds=Array.from({length:RACE_CONFIG.offroadRacers-1},(_,i)=>offroadRivalBuild(73915,i));
 const again=Array.from({length:RACE_CONFIG.offroadRacers-1},(_,i)=>offroadRivalBuild(73915,i));
 assert.deepEqual(builds,again);
 assert.equal(new Set(builds.map(o=>JSON.stringify([o.build.tires,o.build.engine,o.build.suspension,o.build.springTune,o.build.tyrePressure,o.locks]))).size,RACE_CONFIG.offroadRacers-1);
 for(const rival of builds){
  assert.ok(['stock','offroad'].includes(rival.build.tires));
  assert.ok(['stock','turbo'].includes(rival.build.engine));
  assert.ok(['stock','trophy','extreme'].includes(rival.build.suspension));
  assert.ok(['road','trail','soft'].includes(rival.build.tyrePressure));
  assert.equal(typeof rival.locks.center,'boolean');
 }
});

test('trophy water assistance changes only submerged rival tyre contact',()=>{
 const water={surfaceType:'WATER',waterDepth:.72,longitudinalGrip:.36,lateralGrip:.42,rollingResistance:.33};
 const dry={...water,surfaceType:'DIRT',waterDepth:0};
 const wet=trophyFordSurface(water,{tires:'stock'});
 assert.ok(wet.longitudinalGrip>water.longitudinalGrip*1.5);
 assert.ok(wet.rollingResistance<water.rollingResistance*.7);
 assert.deepEqual(trophyFordSurface(dry,{tires:'stock'}),dry);
 assert.equal(water.rollingResistance,.33);
});
test('ford keeps trophy AI in low range, driving ahead rather than reversing to escape',()=>{
 const section={type:'FOREST_FORD',localFeatures:[],hill:null};
 const world={offroadMode:true,finiteRace:true,
  locate:()=>({s:100,yaw:0,section,width:7,lateral:0}),
  atDistance:s=>({s,x:0,z:s,yaw:0,section,u:.5,width:7})};
 const car={p:[0,0,100],v:[0,0,.1],q:[0,0,0,1],omega:[0,0,0],
  wheels:[{waterDepth:.65,mudDepth:.1}],state:{transferRange:'L',turboInstalled:false,centerLocked:true},aiStuckTime:5};
 const cmd=raceInput(car,world,1.2,[],.1);
 assert.ok(cmd.drive>=.76);
 assert.ok(cmd.drive>0);
 assert.equal(car.state.transferRange,'L');
});
