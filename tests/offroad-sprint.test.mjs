import test from 'node:test';
import assert from 'node:assert/strict';
import {RoadWorld} from '../road-world.js';
import {buildSprint,SPRINT_CONFIG} from '../sprint-world.js';
import {GAME_MODE,isRaceMode,isOffroadSprint,offroadRivalBuild,RaceProgress,RACE_CONFIG} from '../race.js';

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
 assert.equal(RACE_CONFIG.racers,10);
});
test('seeded rivals have reproducible and genuinely different offroad setups',()=>{
 const builds=Array.from({length:9},(_,i)=>offroadRivalBuild(73915,i));
 const again=Array.from({length:9},(_,i)=>offroadRivalBuild(73915,i));
 assert.deepEqual(builds,again);
 assert.equal(new Set(builds.map(o=>JSON.stringify([o.build.tires,o.build.engine,o.build.suspension,o.build.springTune,o.build.tyrePressure,o.locks]))).size,9);
 for(const rival of builds){
  assert.ok(['stock','offroad'].includes(rival.build.tires));
  assert.ok(['stock','turbo'].includes(rival.build.engine));
  assert.ok(['stock','trophy','extreme'].includes(rival.build.suspension));
  assert.ok(['road','trail','soft'].includes(rival.build.tyrePressure));
  assert.equal(typeof rival.locks.center,'boolean');
 }
});
