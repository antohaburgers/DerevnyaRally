import test from 'node:test';
import assert from 'node:assert/strict';
// DOM / WebGL call harness. This exercises the real game module and renderer
// command construction; it is deliberately NOT a GPU or Safari certification.
const nodes=new Map();let nextBuffer=0,draws=0;
const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>1,getUniformLocation:()=>1,getShaderPrecisionFormat:()=>({precision:23}),createBuffer:()=>({id:nextBuffer++}),drawArrays:()=>draws++},{get:(t,k)=>k in t?t[k]:(typeof k==='string'&&k===k.toUpperCase()?1:()=>({}))});
const ctx=new Proxy({measureText:s=>({width:s.length*10})},{get:(t,k)=>k in t?t[k]:()=>({}),set:(t,k,v)=>(t[k]=v,true)});
function el(id){if(nodes.has(id))return nodes.get(id);const node={style:{setProperty(){}},dataset:{},classList:{toggle(){},add(){},remove(){},contains:()=>false},handlers:{},textContent:'',hidden:false,width:844,height:390,parentNode:{insertBefore(){},appendChild(){}},nextSibling:null,addEventListener(k,f){(this.handlers[k]??=[]).push(f);},getContext:type=>type==='webgl'?gl:ctx,setAttribute(){},getAttribute:()=>null,removeAttribute(){},setPointerCapture(){},releasePointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:844,height:390}),querySelector:el,querySelectorAll:()=>[],appendChild(){},contains:()=>false,focus(){},click(){for(const f of this.handlers.click||[])f({preventDefault(){}});}};nodes.set(id,node);return node;}
globalThis.document={querySelector:el,querySelectorAll:()=>[],createElement:()=>el('created:'+nodes.size),documentElement:el('html'),addEventListener(){},body:el('body')};globalThis.window={addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})};globalThis.matchMedia=window.matchMedia;globalThis.location={search:'?seed=42',href:'http://localhost/index.html'};globalThis.innerWidth=844;globalThis.innerHeight=390;globalThis.devicePixelRatio=1;globalThis.Image=class{addEventListener(){}set src(v){}};globalThis.Audio=class{addEventListener(){}load(){}pause(){}play(){return Promise.resolve();}};let frame;globalThis.requestAnimationFrame=f=>frame=f;
const game=await import('../game.js');

test('original game starts expedition in the same scene and preserves the vehicle',()=>{
 const body=game.physics,visual=game.visual,t=performance.now();game.startRun('EXPEDITION');
 assert.equal(game.physics,body);assert.equal(game.visual,visual);assert.equal(game.world.openWorld,true);assert.equal(game.run.garageBuild.tires,'stock');assert.equal(game.run.garageBuild.winch,false);assert.equal(game.run.garageBuild.snorkel,false);assert.equal(game.run.garageBuild.suspension,'stock');assert.equal(game.physics.requestRear(),false);assert.equal(game.physics.requestFront(),false);assert.equal(game.cup.countdown,0);
 for(let i=0;i<30;i++)frame(16+i*16);
 assert.ok(draws>0);assert.ok(game.run.time>0);assert.ok(game.physics.p.every(Number.isFinite));assert.ok(game.physics.wheels.every(w=>Number.isFinite(w.load)));assert.ok(game.chunkSlots.size<=25);console.log('Original renderer harness initial expedition ms:',Math.round(performance.now()-t));
});
test('mission installs all original upgrades, repairs, map toggles and victory runs',()=>{
 for(const p of game.world.landmarks.filter(p=>p.upgrade)){game.world.update(p.x,p.z);game.physics.reset(p.x,p.z,Math.PI);game.physics.state.vehicleSpeed=0;game.expeditionSession.tick(.05);}
 assert.equal(game.expeditionSession.found.size,6);assert.equal(game.run.garageBuild.tires,'offroad');assert.equal(game.run.expedition.build.winch,true);assert.equal(game.run.expedition.build.snorkel,true);assert.equal(game.run.garageBuild.suspension,'trophy');assert.equal(game.physics.state.rearLockInstalled,true);assert.equal(game.physics.state.frontLockInstalled,true);
 game.run.hp=20;game.run.fuel=2;const repair=game.world.landmarks.find(p=>p.id==='repair');game.world.update(repair.x,repair.z);game.physics.reset(repair.x,repair.z,Math.PI);game.physics.state.vehicleSpeed=0;game.expeditionSession.tick(.05);assert.equal(game.run.hp,100);assert.equal(game.run.fuel,100);
 el('#expedition-map-button').click();assert.equal(game.expeditionSession.mapOpen,true);frame(700);el('#expedition-map-close').click();assert.equal(game.expeditionSession.mapOpen,false);
 const goal=game.world.goal;game.world.update(goal.x,goal.z);game.physics.reset(goal.x,goal.z,Math.PI);game.physics.state.vehicleSpeed=0;game.expeditionSession.tick(.05);assert.equal(game.expeditionSession.complete,true);assert.equal(game.run.ended,true);assert.equal(game.expeditionSession.celebrants.length,8);game.expeditionSession.celebrate(.2);assert.ok(game.expeditionSession.celebrants.some(a=>a.y>game.height(a.x,a.z)));
 frame(1000);assert.match(el('#result-title').textContent,/ПИВО ДОСТАВЛЕНО/);
});
test('switching from expedition back to every original mode keeps the same physical car',()=>{
 const car=game.physics;
 for(const mode of ['ENDLESS','OFFROAD','CIRCUIT','SPRINT_5','SPRINT_10','EXPEDITION','OFFROAD']){
  game.startRun(mode);assert.equal(game.physics,car);assert.equal(game.gameMode,mode);assert.equal(!!game.world.openWorld,mode==='EXPEDITION');if(mode!=='EXPEDITION'){assert.equal(game.expeditionSession,null);assert.equal(game.physics.state.rearLockInstalled,true);assert.equal(game.physics.state.frontLockInstalled,true);}
  frame(2000);assert.ok(game.physics.p.every(Number.isFinite));assert.ok(game.world.sections.length>0);
  if(mode==='CIRCUIT'||mode.startsWith('SPRINT'))assert.equal(game.cup.ai.length,9);
 }
});
test('stadium keeps original car, delays start, counts real contacts and preserves dirty finale',()=>{
 const body=game.physics,visual=game.visual;game.startRun('SLAUGHTER');const a=game.stadium;
 assert.equal(game.physics,body);assert.equal(game.visual,visual);assert.equal(game.world.arena,true);assert.equal(game.animals.active.length,30);assert.equal(game.raceDecor.spectators.length,42);assert.equal(game.cup.ai.length,0);assert.equal(game.environment.hour,15);assert.equal(game.environment.rainIntensity,0);assert.equal(a.time,0);
 a.before(5,1);assert.equal(a.phase,'intro');assert.equal(a.time,0);a.before(1,1);a.before(3,1);assert.equal(a.phase,'playing');assert.equal(game.physics.state.startLock,false);
 const cow=game.animals.active[0];Object.assign(cow,{x:body.p[0],y:game.height(body.p[0],body.p[2]),z:body.p[2]+1.7,rotation:Math.PI});body.v=[0,0,12];game.animals.tick(.025,body);
 assert.equal(a.cows,1);assert.equal(a.score,100);assert.ok(a.redZones[0]>a.redZones[1]);assert.ok(game.run.hp>95);assert.ok(game.animals.debris.some(d=>d.active));game.animals.tick(.025,body);assert.equal(a.cows,1);
 a.tick(.7);assert.equal(game.animals.active.length,30);for(let i=0;i<5;i++){const cow=game.animals.active[0];a.hit(cow,{closing:12,impulse:2000},[body.p[0]-1,body.p[1],body.p[2]]);a.spawn();}assert.equal(a.combo,5);assert.equal(a.bestCombo,5);a.tick(3.1);assert.equal(a.combo,1);
 body.p[0]=90;body.p[2]=0;const hp=game.run.hp,red=[...a.redZones];a.boundary(3);assert.ok(game.world.radius(body.p[0],body.p[2])<1);assert.equal(game.run.hp,hp);assert.deepEqual(a.redZones,red);
 for(let i=0;i<1300&&a.phase==='playing';i++)a.tick(.05);assert.equal(a.time,60);assert.equal(a.phase,'outro');assert.equal(game.run.ended,false);assert.deepEqual(a.redZones,red);a.before(4,0);assert.equal(a.phase,'outro');a.before(1,0);assert.equal(a.phase,'results');frame(3000);assert.equal(el('#result-title').textContent,'КОРОВЫ УНИЧТОЖЕНЫ!');assert.equal(el('#run-results').hidden,false);
 game.startRun('SLAUGHTER');game.stadium.before(6,0);game.stadium.before(3,0);game.stadium.time=45;for(let i=0;i<20;i++)game.stadium.tick(.05);assert.equal(game.animals.active.length,50);game.stadium.redZones.fill(2.4);game.run.expedition.mudZones.fill(1);for(let i=0;i<8;i++)game.feedback.burst(game.physics.p,[0,0,0],90,'antifreeze');frame(3100);assert.ok(game.profiler.drawCalls<1000);assert.ok(game.feedback.activeParticles<=540);
 const count=game.chunkSlots.size;for(let i=0;i<6;i++){game.startRun('SLAUGHTER');assert.equal(game.animals.active.length,30);assert.equal(game.raceDecor.spectators.length,42);assert.ok(game.stadium.redZones.every(v=>v===0));assert.equal(game.run.hp,100);assert.equal(game.chunkSlots.size,count);assert.ok(game.physics.wheels.every(w=>!w.detached));}
 game.showMenu();assert.equal(game.stadium,null);assert.equal(game.animals.stadium,null);assert.equal(game.music.suspended,true);game.startRun('OFFROAD');assert.equal(game.world.arena,undefined);assert.equal(game.animals.stadium,null);
});

test('stadium finishes through real frame/physics loop even with a substep fraction left',()=>{
 game.startRun('SLAUGHTER');game.stadium.before(6,0);game.stadium.before(3,0);game.stadium.time=59.999999999;frame(4000);assert.equal(game.stadium.time,60);assert.equal(game.stadium.phase,'outro');
 for(let i=1;i<340;i++)frame(4000+i*16.6666667);assert.equal(game.stadium.phase,'results');assert.equal(game.run.ended,true);assert.equal(el('#run-results').hidden,false);
 game.startRun('SLAUGHTER');game.stadium.before(6,0);game.stadium.before(3,0);for(let i=0;i<3900&&game.stadium.phase==='playing';i++)frame(12000+i*16.6666667);assert.equal(game.stadium.time,60);assert.equal(game.stadium.phase,'outro');
});
test('garage turbo selection reaches the actual stadium engine factor',()=>{
 const choose=engine=>{const handler=el('#garage-screen').handlers.click[0];handler({target:{closest:()=>({dataset:{tune:'engine',value:engine}})}});};choose('turbo');game.startRun('SLAUGHTER');assert.equal(game.run.garageBuild.engine,'turbo');assert.equal(game.physics.state.turboInstalled,true);assert.equal(game.physics.state.enginePowerFactor,1.3);choose('stock');game.startRun('SLAUGHTER');assert.equal(game.physics.state.enginePowerFactor,1);
});
test('stadium locks transmission controls and cow charges have windup, cooldown and a limit',()=>{
 game.startRun('SLAUGHTER');const s=game.physics.state,a=game.stadium;assert.equal(s.rearLocked,true);assert.equal(s.centerLocked,false);assert.equal(s.transferRange,'H');assert.equal(el('#transmission').hidden,true);for(const method of ['requestRange','requestCenter','requestRear','requestFront'])assert.equal(game.physics[method](),false);assert.equal(game.run.mechanical.failLock('rear'),false);
 a.before(6,0);a.before(3,0);const cow=game.animals.active[0];Object.assign(cow,{x:game.physics.p[0],z:game.physics.p[2]+14,rotation:Math.PI,attackCooldown:0});a.beginAttack(cow,game.physics);assert.ok(cow.attackCooldown>=5);game.animals.tick(.1,game.physics);assert.equal(cow.state,'WINDUP');const z=cow.z;game.animals.tick(.4,game.physics);assert.equal(cow.state,'CHARGE');assert.ok(cow.z<z);for(let i=0;i<20;i++){game.animals.tick(.1,game.physics);assert.ok(game.animals.active.filter(c=>c.attackTime>0).length<=3);}assert.ok(cow.attackCooldown>0);game.startRun('OFFROAD');assert.equal(game.physics.state.arcadeDrive,null);assert.equal(game.physics.state.rearLocked,false);assert.equal(el('#transmission').hidden,false);
});
