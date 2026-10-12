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
