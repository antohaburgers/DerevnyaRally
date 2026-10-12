// Playable expedition prototype. Old Niva 4-wheel rigid-body physics + square world chunks.
import {ExpeditionMap} from './expedition-map.js';
import {ExpeditionRenderer} from './expedition-3d-render.js';
import {OffroadVehicle,CAR_CONFIG,rotate} from './physics.js?v=055';
import {VisualCar} from './visual-car.js?v=028';
import {tireSurface,STOCK_BUILD} from './garage.js?v=055';
import {SURFACE_CONFIG,SURFACE_SETTINGS} from './surfaces.js?v=048';
import {EngineAudio} from './engine-audio.js?v=037';

const $=q=>document.querySelector(q);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const seed=Number(new URLSearchParams(location.search).get('seed'))||731024;
const map=new ExpeditionMap(seed),kit={tires:false,winch:false,snorkel:false};
const canvas=$('#screen'),hint=$('#hint');
let engine=null,renderer=null,visual=null,vehicle=null,started=false,paused=true,winchAnchor=null;
let hp=100,fuel=100,stalled=false,wetTime=0,time=0,travel=0,last=0,prevWorldCell='',lastSafe=null;
let hintUntil=0,damageCooldown=0,finish=false,mapTime=0,frameCount=0;
const keys=new Set();
const input={steer:0,gas:0,brake:0,handbrake:false};
function show(text,seconds=3){
 hint.textContent=text;hint.classList.add('visible');hintUntil=time+seconds;
}
function prepare(){
 if(renderer)return;
 const height=(x,z)=>map.terrainHeight(x,z);
 const normal=(x,z)=>{
  const d=.18,h0=height(x-d,z)-height(x+d,z),h1=height(x,z-d)-height(x,z+d),len=Math.hypot(h0,d*2,h1);
  return[h0/len,d*2/len,h1/len];
 };
 const surface=(x,z)=>{
  const raw=map.surfaceAt(x,z),t=raw.surfaceType,s={...SURFACE_CONFIG[t]};
  if(t==='MUD'||t==='PEAT'){
   s.longitudinalGrip*=Math.max(.28,1-SURFACE_SETTINGS.mudGripLoss*raw.mudDepth);
   s.lateralGrip*=Math.max(.38,1-.45*raw.mudDepth);
   s.rollingResistance+=SURFACE_SETTINGS.mudResistance*raw.mudDepth;
   s.sinkAmount=Math.min(SURFACE_SETTINGS.maxVisualSink,s.sinkAmount*(.6+raw.mudDepth));
  }
  if(t==='WATER'){
   s.rollingResistance+=raw.waterDepth*.22;
   s.longitudinalGrip*=Math.max(.35,1-raw.waterDepth*.95);
   s.lateralGrip*=Math.max(.38,1-raw.waterDepth*.8);
  }
  return tireSurface({...raw,...s,wetness:t==='WATER'||t==='MUD'? .8:.10}, {tires:kit.tires?'offroad':'stock'});
 };
 const terrain={height,normal,surface,grip:(x,z)=>surface(x,z).longitudinalGrip};
 vehicle=new OffroadVehicle(terrain,{...CAR_CONFIG,mapLimit:Infinity});
 vehicle.setPhysicsRate(90);vehicle.reset(map.start.x,map.start.z,map.roadAt(map.start.x,map.start.z).yaw);
 vehicle.state.offroadMode=true;vehicle.state.offroadTires=false;vehicle.state.tyrePressure=2.2;
 vehicle.state.enginePowerFactor=1;vehicle.state.engineRunning=true;
 visual=new VisualCar(vehicle);
 renderer=new ExpeditionRenderer(canvas,map);renderer.sync();
 engine=new EngineAudio($('#sound'),false);
 lastSafe={x:map.start.x,z:map.start.z,yaw:map.roadAt(map.start.x,map.start.z).yaw};
 drawMinimap(true);
}
function reset(){
 if(!renderer)prepare();
 map.reset(Math.floor(Math.random()*2**32));Object.assign(kit,{tires:false,winch:false,snorkel:false});
 renderer.map=map;for(const g of renderer.chunks.values())renderer.gl.deleteBuffer(g.b);renderer.chunks.clear();
 renderer.kit(kit);renderer.sync();
 vehicle.reset(map.start.x,map.start.z,map.roadAt(map.start.x,map.start.z).yaw);
 Object.assign(vehicle.state,{enginePowerFactor:1,engineRunning:true,transferRange:'H',centerLocked:false,rearLocked:false,frontLocked:false,tyrePressure:2.2,offroadTires:false});
 hp=100;fuel=100;wetTime=0;stalled=false;time=0;travel=0;finish=false;winchAnchor=null;lastSafe={x:map.start.x,z:map.start.z,yaw:vehicle.q[1]*2};
 visual.reset();$('#result').style.display='none';$('#landing').style.display='none';paused=false;started=true;prevWorldCell='';show('12 ЯЩИКОВ ПИВА ЗАГРУЖЕНО. НАЙДИ ТЮНИНГ!',5);
}
function updatePhysics(dt){
 const left=keys.has('KeyA')||keys.has('ArrowLeft'),right=keys.has('KeyD')||keys.has('ArrowRight');
 const gas=Math.max(input.gas,keys.has('KeyW')||keys.has('ArrowUp')?1:0);
 const brake=Math.max(input.brake,keys.has('KeyS')||keys.has('ArrowDown')?1:0);
 const steer=clamp(input.steer+(left?1:0)-(right?1:0),-1,1);
 const prev=[...vehicle.p];
 vehicle.state.engineRunning=!stalled&&fuel>0;
 vehicle.state.enginePowerFactor=vehicle.state.engineRunning?1:0;
 vehicle.advance(dt,{analog:true,throttle:gas,brake,steer,handbrake:input.handbrake||keys.has('Space')});
 travel+=Math.hypot(vehicle.p[0]-prev[0],vehicle.p[2]-prev[2]);
 time+=dt;
 fuel=Math.max(0,fuel-dt*(.004+.022*gas+.008*vehicle.state.load));
 if(!map.bounds(vehicle.p[0],vehicle.p[2]))recover();
 const x=vehicle.p[0],z=vehicle.p[2],cx=Math.floor(x/map.config.tileSize),cz=Math.floor(z/map.config.tileSize);
 const cell=cx+':'+cz;
 if(cell!==prevWorldCell){map.update(x,z);renderer.sync();prevWorldCell=cell;}
 const road=map.roadAt(x,z),s=map.surfaceAt(x,z);
 if(road&&road.distance<road.road.width/2+3&&s.waterDepth<.25&&Math.abs(vehicle.state.vehicleSpeed)<80){
  lastSafe={x,z,yaw:road.yaw};
 }
 if(s.waterDepth>(kit.snorkel?.85:.45)){
  wetTime+=dt;if(wetTime>1.3&&!stalled){stalled=true;show('МОТОР ЗАХЛЕБНУЛСЯ! ЭВАКУАЦИЯ ИЛИ ШНОРКЕЛЬ',6);}
 }else wetTime=Math.max(0,wetTime-dt*1.5);
 if(stalled&&s.waterDepth<.12&&gas>.85&&wetTime<.2){stalled=false;show('МОТОР ЗАПУЩЕН');}
 const impact=vehicle.state.bodyImpact;
 if(impact?.fresh&&impact.impulse>3000&&time>damageCooldown){
  hp=Math.max(0,hp-Math.min(22,(impact.impulse-3000)/3000));
  damageCooldown=time+.65;
 }
 const events=map.visit(x,z,16);
 for(const event of events){
  if(event.type==='UPGRADE_FOUND'){
   kit[event.upgrade]=true;renderer.kit(kit);
   vehicle.state.offroadTires=kit.tires;
   show('НАЙДЕН ТЮНИНГ: '+(event.upgrade==='tires'?'ГРЯЗЕВАЯ РЕЗИНА':event.upgrade==='winch'?'ЛЕБЁДКА':'ШНОРКЕЛЬ')+'!',5);
  }
  if(event.type==='SERVICE_FOUND'){
   hp=Math.min(100,hp+38);fuel=Math.min(100,fuel+35);
   show('СЕРВИС: РЕМОНТ И ТОПЛИВО +35%',4);
  }
  if(event.type==='BEER_DELIVERED'){
   finish=true;paused=true;vehicle.state.engineRunning=false;
   $('#result-time').textContent='ВРЕМЯ '+Math.floor(time/60)+' МИН '+Math.floor(time%60)+' С · ПРОБЕГ '+(travel/1000).toFixed(1)+' КМ · ПИВО: '+event.crates+' ЯЩИКОВ';
   $('#result').style.display='flex';
   show('ПИВО ДОСТАВЛЕНО!',9);
  }
 }
 if(!finish&&time>5&&hp<=0){recover();hp=42;show('НИВА СЛОМАЛАСЬ. СПАСАТЕЛИ ВЕРНУЛИ НА ДОРОГУ',5);}
 if(winchAnchor){
  const dx=winchAnchor.x-x,dz=winchAnchor.z-z,d=Math.hypot(dx,dz)||1;
  if(d<2.5||d>30){winchAnchor=null;}
  else{const rate=Math.min(4,(d-2.2)*.9);vehicle.v[0]+=(dx/d*rate-vehicle.v[0])*.025;vehicle.v[2]+=(dz/d*rate-vehicle.v[2])*.025;}
 }
 const trees=map.activeTiles.flatMap(t=>t.foliage);
 for(const tree of trees){
  if(tree.kind!=='tree'||map.destroyedDecor.has(tree.id))continue;
  const dx=x-tree.x,dz=z-tree.z,d=Math.hypot(dx,dz);
  if(d>1.45||Math.abs(vehicle.p[1]-tree.y)>3.0)continue;
  if(time>damageCooldown){
   const speed=Math.hypot(vehicle.v[0],vehicle.v[2]);
   hp=Math.max(0,hp-Math.min(12,speed*.65));
   damageCooldown=time+.8;
   if(speed>8){map.destroyedDecor.add(tree.id);const chunk=map.activeTiles.find(t=>t.foliage.includes(tree));if(chunk){const old=renderer.chunks.get(chunk.key);if(old)renderer.gl.deleteBuffer(old.b);renderer.chunks.delete(chunk.key);renderer.sync();}}
   else if(d>.01){vehicle.p[0]+=dx/d*(1.5-d);vehicle.p[2]+=dz/d*(1.5-d);vehicle.v[0]*=.5;vehicle.v[2]*=.5;}
  }
 }
 visual.update(dt);
}
function recover(){
 if(!vehicle||!lastSafe)return;
 const p=lastSafe;vehicle.reset(p.x,p.z,p.yaw);visual.reset();
 fuel=Math.max(10,fuel-5);hp=Math.max(15,hp-5);stalled=false;wetTime=0;winchAnchor=null;
 map.update(p.x,p.z);renderer.sync();prevWorldCell='';
 show('ЭВАКУАЦИЯ НА ПОСЛЕДНЮЮ ПРОЕЗЖУЮ ДОРОГУ · −5% ТОПЛИВА',4);
}
function useWinch(){
 if(!kit.winch){show('СНАЧАЛА НАЙДИ ЛЕБЁДКУ НА ЛЕСОПИЛКЕ');return;}
 if(winchAnchor){winchAnchor=null;show('ЛЕБЁДКА ОТЦЕПЛЕНА');return;}
 const f=rotate(vehicle.q,[0,0,1]),x=vehicle.p[0],z=vehicle.p[2];
 let best=24,found=null;
 for(const tile of map.activeTiles)for(const tree of tile.foliage)if(tree.kind==='tree'&&!map.destroyedDecor.has(tree.id)){
   const dx=tree.x-x,dz=tree.z-z,d=Math.hypot(dx,dz);
   if(d>3&&d<best&&dx*f[0]+dz*f[2]>d*.1){best=d;found=tree;}
 }
 if(!found){show('НЕТ ДЕРЕВА ДЛЯ ЛЕБЁДКИ ВПЕРЕДИ');return;}
 winchAnchor=found;show('ТРОС ЗАКРЕПЛЁН · НИВА ПОДТЯГИВАЕТСЯ',4);
}
let cam=null;
function camera(){
 const f=rotate(visual.q,[0,0,1]),base=visual.p;
 const desired=[base[0]-f[0]*11,base[1]+6.0,base[2]-f[2]*11],aim=[base[0]+f[0]*5,base[1]+1.1,base[2]+f[2]*5];
 desired[1]=Math.max(desired[1],map.terrainHeight(desired[0],desired[2])+1.5);
 if(!cam)cam=desired;
 cam=cam.map((x,i)=>x+(desired[i]-x)*.15);
 return{eye:cam,target:aim};
}
function mapDraw(ctx,w,h,full=false){
 const scale=full?Math.min((w-20)/map.config.width,(h-20)/map.config.length):.42;
 const px=x=>full?w/2+x*scale:w/2+(x-vehicle.p[0])*scale;
 const py=z=>full?h/2+z*scale:h/2+(z-vehicle.p[2])*scale;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#648362';ctx.fillRect(0,0,w,h);
 ctx.beginPath();
 for(let x=-1510;x<=1510;x+=25){const r=map.river(x);if(x===-1510)ctx.moveTo(px(x),py(r.center-r.halfWidth));else ctx.lineTo(px(x),py(r.center-r.halfWidth));}
 for(let x=1510;x>=-1510;x-=25){const r=map.river(x);ctx.lineTo(px(x),py(r.center+r.halfWidth));}
 ctx.closePath();ctx.fillStyle='#3e8ca5';ctx.fill();
 ctx.lineCap='round';ctx.lineJoin='round';
 for(const road of map.roads){
  if(!full&&!road.path.some(p=>Math.abs(p.x-vehicle.p[0])<420&&Math.abs(p.z-vehicle.p[2])<420))continue;
  ctx.beginPath();road.path.forEach((p,i)=>i?ctx.lineTo(px(p.x),py(p.z)):ctx.moveTo(px(p.x),py(p.z)));
  ctx.lineWidth=Math.max(1.3,road.width*scale);
  ctx.strokeStyle={gravel:'#e2d0a5',country:'#cfac7b',forest:'#9a886e',rutted:'#765e4a',muddy:'#65503f',rocky:'#aaa9a0',bridge:'#ead6ad',ford:'#c1aa86'}[road.surface];
  ctx.stroke();
 }
 for(const p of map.landmarks){
  const x=px(p.x),y=py(p.z);
  if(x<0||x>w||y<0||y>h)continue;
  ctx.beginPath();ctx.arc(x,y,full?4:5,0,Math.PI*2);
  ctx.fillStyle=p.kind==='delivery'?'#f6a93c':p.kind==='upgrade'?'#faf6bc':p.kind==='service'?'#d38d58':'#9ed0b1';ctx.fill();
  if(full){ctx.fillStyle='#182c25';ctx.font='bold 12px system-ui';ctx.fillText(p.label,x+6,y-6);}
 }
 const x=px(vehicle.p[0]),y=py(vehicle.p[2]);
 ctx.save();ctx.translate(x,y);ctx.rotate(visual?.yaw||0);ctx.beginPath();ctx.moveTo(0,9);ctx.lineTo(7,-7);ctx.lineTo(-7,-7);ctx.closePath();ctx.fillStyle='#f0d357';ctx.fill();ctx.strokeStyle='#203126';ctx.stroke();ctx.restore();
}
const mini=$('#minimap'),miniCtx=mini.getContext('2d'),full=$('#fullmap'),fullCtx=full.getContext('2d');
function drawMinimap(big=false){if(!vehicle)return;mapDraw(miniCtx,mini.width,mini.height);if(big)mapDraw(fullCtx,full.width,full.height,true);}
function updateUI(){
 if(!vehicle)return;$('#speed').textContent=Math.round(vehicle.state.vehicleSpeed);
 $('#rpm').textContent=Math.round(vehicle.state.currentRPM)+' RPM · '+(vehicle.state.currentGear<0?'R':vehicle.state.currentGear)+' · '+vehicle.state.transferRange;
 $('#fuel').textContent=Math.round(fuel);$('#hp').textContent=Math.round(hp);
 $('#kit').textContent=(kit.tires?'MT ':'')+(kit.winch?'ЛЕБЁДКА ':'')+(kit.snorkel?'ШНОРКЕЛЬ':'')||'СТОК';
 $('#distance').textContent='ДО ДЕРЕВНИ: '+(Math.hypot(map.goal.x-vehicle.p[0],map.goal.z-vehicle.p[2])/1000).toFixed(1)+' KM';
 $('#objective').textContent=map.collected.has('snorkel')?'ДОСТАВИТЬ ПИВО':map.collected.has('tires')?'ИСКАТЬ ЛЕБЁДКУ И ШНОРКЕЛЬ':'НАЙТИ ТЮНИНГ';
 $('#low').textContent=vehicle.state.transferRange;$('#low').classList.toggle('active',vehicle.state.transferRange==='L');
 $('#center').classList.toggle('active',vehicle.state.centerLocked);
 $('#rear').classList.toggle('active',vehicle.state.rearLocked);
 $('#winch').classList.toggle('active',!!winchAnchor);
 if(time>hintUntil)hint.classList.remove('visible');
}
function frame(now){
 requestAnimationFrame(frame);
 if(!renderer||!started)return;
 const dt=Math.min(.043,Math.max(.001,(now-last)/1000||.016));last=now;
 if(!paused&&!document.hidden&&!finish)updatePhysics(dt);
 if(!$('#map-panel').style.display||$('#map-panel').style.display==='none')renderer.frame(visual,camera());
 if(engine)engine.update(vehicle.state,vehicle.wheels);
 if(frameCount++%6===0){updateUI();drawMinimap();}
}
requestAnimationFrame(frame);
function start(){
 try{prepare();started=true;paused=false;last=performance.now();$('#landing').style.display='none';engine?.start();show('ПИВО ЗАГРУЖЕНО! СНАЧАЛА ИЩИ ГРЯЗЕВУЮ РЕЗИНУ',5);}
 catch(e){$('#landing p').textContent='ОШИБКА ЗАПУСКА: '+(e?.message||e);console.error(e);}
}
$('#enter').addEventListener('click',start);
$('#rescue').addEventListener('click',recover);
$('#winch').addEventListener('click',useWinch);
$('#low').addEventListener('click',()=>vehicle?.requestRange());
$('#center').addEventListener('click',()=>vehicle?.requestCenter());
$('#rear').addEventListener('click',()=>vehicle?.requestRear());
$('#exit').addEventListener('click',()=>{location.href='./index.html';});
$('#again').addEventListener('click',()=>{reset();last=performance.now();engine?.start();});
$('#map').addEventListener('click',()=>{paused=true;drawMinimap(true);$('#map-panel').style.display='flex';});
$('#map-close').addEventListener('click',()=>{paused=false;last=performance.now();$('#map-panel').style.display='none';});
const joy=$('#joystick'),knob=$('#knob');
let steeringPointer=null,originX=0;
joy.addEventListener('pointerdown',e=>{if(steeringPointer!==null)return;steeringPointer=e.pointerId;originX=e.clientX;joy.setPointerCapture(e.pointerId);e.preventDefault();});
joy.addEventListener('pointermove',e=>{if(e.pointerId!==steeringPointer)return;input.steer=clamp(-(e.clientX-originX)/56,-1,1);knob.style.setProperty('--steer',(-input.steer*40)+'px');e.preventDefault();});
for(const kind of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(kind,e=>{if(e.pointerId!==steeringPointer)return;steeringPointer=null;input.steer=0;knob.style.setProperty('--steer','0px');});
function hold(id,key){
 const el=$(id);let pointer=null;
 el.addEventListener('pointerdown',e=>{if(pointer!==null)return;pointer=e.pointerId;el.setPointerCapture(pointer);input[key]=key==='handbrake'?true:1;el.classList.add('pressed');e.preventDefault();});
 for(const kind of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(kind,e=>{if(pointer!==e.pointerId)return;pointer=null;input[key]=key==='handbrake'?false:0;el.classList.remove('pressed');});
}
hold('#gas','gas');hold('#brake','brake');hold('#hand','handbrake');
addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 keys.add(e.code);
 if(e.repeat)return;
 if(e.code==='KeyL')vehicle?.requestRange();
 if(e.code==='KeyC')vehicle?.requestCenter();
 if(e.code==='KeyR')vehicle?.requestRear();
 if(e.code==='KeyE')recover();
 if(e.code==='KeyF')useWinch();
 if(e.code==='KeyM')$('#map').click();
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();input.steer=input.gas=input.brake=0;input.handbrake=false;});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
