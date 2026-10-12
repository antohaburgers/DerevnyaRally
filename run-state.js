import {MechanicalDamage} from './mechanical.js?v=065';
import {ExpeditionSystems} from './expedition-systems.js?v=060';
import {rotate} from './physics.js?v=061';
export const RUN_CONFIG={bestKey:'niva3d.bestMeters.v1',hp:100,fuel:100,fuelConsumptionMultiplier:1.15,fuelIdle:.006,fuelThrottle:.085,fuelRPM:.026,fuelLoad:.020,lowConsumption:1.10,repair:25,refuel:25,impactThreshold:1,impactExponent:1.65,impactScale:.20,impactMax:75,hitCooldown:.35,landingThreshold:4.5,landingScale:2,landingDamageMultiplier:.70,slideRate:.08,slideSpeedRate:.025,maxSlideSpeed:15,saveInterval:2};
export const DAMAGE_EVENTS=['FARMER_HIT','VILLAGE_PROP_HIT','COW_HIT','TREE_HIT','HOUSE_HIT','TRAFFIC_HIT','FENCE_HIT','SIGN_HIT','HARD_LANDING','ROLLOVER_IMPACT','ROOF_SLIDE'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function orientation(q){const up=rotate(q,[0,1,0])[1];return up>.5?'NORMAL':up>-.5?'SIDE':'UPSIDE_DOWN';}
export function collisionDamage(impulse,mass=1280){return clamp(RUN_CONFIG.impactScale*Math.max(0,impulse/mass-RUN_CONFIG.impactThreshold)**RUN_CONFIG.impactExponent,0,RUN_CONFIG.impactMax);}
export function fuelRate(state){if(state.engineRunning===false)return 0;const rpm=clamp((state.currentRPM-850)/5350,0,1),throttle=clamp(state.throttle||0,0,1);return(RUN_CONFIG.fuelIdle+RUN_CONFIG.fuelThrottle*throttle**2+RUN_CONFIG.fuelRPM*rpm+RUN_CONFIG.fuelLoad*clamp(state.load||0,0,1))*(state.transferRange==='L'?RUN_CONFIG.lowConsumption:1)*RUN_CONFIG.fuelConsumptionMultiplier;}
export class RunState{
 constructor(feedback,storage){this.feedback=feedback;this.storage=storage;this.best=0;try{const value=Number(storage?.getItem(RUN_CONFIG.bestKey));if(Number.isFinite(value)&&value>=0&&value<1e9)this.best=value;}catch{}this.mechanical=new MechanicalDamage(feedback);this.expedition=new ExpeditionSystems(feedback);this.unsubscribe=feedback.onEvent(e=>this.receive(e));this.reset();}
 reset(){this.mechanical.reset();this.expedition.reset(this.garageBuild);this.hp=100;this.fuel=100;this.distance=0;this.beer=false;this.ended=false;this.time=0;this.cooldowns=new Map();this.messages=[];this.previousBest=this.best;this.recordShown=false;this.lastSave=0;this.lastSlide=-10;this.lastOrientation='NORMAL';this.orientation='NORMAL';this.body=null;this.damageImmuneUntil=0;this.lastImpactDamage=0;this.stats={trees:0,fences:0,signs:0,beers:0,collisions:0,rollovers:0,hardLandings:0,brokenParts:0,brokenLocks:0};}
 notify(text,duration=2){this.messages.push({text,until:this.time+duration});if(this.messages.length>4)this.messages.shift();}
 get message(){this.messages=this.messages.filter(m=>m.until>this.time);return (this.messages.find(m=>m.text==='БАЛДЁЖ')||this.messages.at(-1))?.text||'';}
 bestFor(mode='ENDLESS'){const key=mode==='OFFROAD'?'niva3d.bestOffroadMeters.v1':RUN_CONFIG.bestKey;try{const value=Number(this.storage?.getItem(key));return Number.isFinite(value)&&value>=0&&value<1e9?value:0;}catch{return 0;}}
 setMode(mode){this.mode=mode;this.recordKey=mode==='OFFROAD'?'niva3d.bestOffroadMeters.v1':RUN_CONFIG.bestKey;this.best=this.bestFor(mode);}
 save(){if(this.mode==='SLAUGHTER')return;try{this.storage?.setItem(this.recordKey||RUN_CONFIG.bestKey,String(this.best));}catch{}this.lastSave=this.time;}
 receive(e){if(this.ended)return;
 const status={WINCH_NO_ANCHOR:'НЕТ ДЕРЕВА ПЕРЕД МАШИНОЙ',WINCH_ATTACHED:'ТРОС ЗАКРЕПЛЁН · УДЕРЖИВАЙ ТЯНУТЬ',WINCH_RELEASED:'ЛЕБЁДКА ОТЦЕПЛЕНА',WINCH_OVERHEATED:'ЛЕБЁДКА ПЕРЕГРЕЛАСЬ',WINCH_SNAPPED:'ТРОС ПОРВАН',WINCH_BROKEN:'ЛЕБЁДКА СЛОМАНА',TYRE_UNSEATED:'КОЛЕСО РАЗБОРТОВАЛОСЬ',TYRE_PUNCTURE:'ПРОКОЛ ШИНЫ',ENGINE_FLOODED:'МОТОР ЗАГЛОХ В БРОДУ',ENGINE_RESTARTED:'ДВИГАТЕЛЬ ЗАПУЩЕН',CAR_WASHED:'НИВА ОТМЫТА'};
 if(status[e.type]){this.notify(status[e.type]+(e.wheel?' · '+e.wheel:''),3);return;}
 if(e.type==='TYRE_PRESSURE'){this.notify('ДАВЛЕНИЕ ШИН: '+e.pressure.toFixed(1)+' БАР',1.4);return;}

 const lockName={front:'ПЕРЕДНЯЯ',center:'МЕЖОСЕВАЯ',rear:'ЗАДНЯЯ'};
 if(e.type==='LOCK_WARNING'){this.notify(lockName[e.lock]+' БЛОКИРОВКА: ИЗНОС '+Math.round(e.wear)+'%',2.6);return;}
 if(e.type==='LOCK_CRITICAL'){this.notify('КРИТИЧЕСКИЙ ИЗНОС: '+lockName[e.lock]+' БЛОКА',3.0);return;}
 if(e.type==='LOCK_FAILURE'||e.type==='LOCK_JAMMED'){
  this.stats.brokenLocks++;
  this.notify(lockName[e.lock]+' БЛОКИРОВКА '+(e.type==='LOCK_JAMMED'?'ЗАКЛИНИЛА!':'СЛОМАНА!'),3.2);
  return;
 }
 if(e.type==='BUMPER_DETACHED'||e.type==='FOG_LIGHT_BROKEN'){
  this.stats.brokenParts++;
  const labels={frontBumper:'ПЕРЕДНИЙ БАМПЕР',rearBumper:'ЗАДНИЙ БАМПЕР',fogLeft:'ЛЕВАЯ ТУМАНКА',fogRight:'ПРАВАЯ ТУМАНКА'};
  this.notify((labels[e.part]||'ДЕТАЛЬ')+' ОТВАЛИЛАСЬ!',2.6);return;
 }
 const failureMessages={FRONT_DRIVE_FAILURE:"ПЕРЕДНИЙ ПРИВОД СЛОМАН",REAR_DRIVE_FAILURE:"ЗАДНИЙ ПРИВОД СЛОМАН",WHEEL_DETACHED:"КОЛЕСО ОТОРВАНО · "+(e.wheel||"")};if(failureMessages[e.type]){const randomMessages={FRONT_DRIVE_FAILURE:'ОТКАЗ ПЕРЕДНЕГО ПРИВОДА',REAR_DRIVE_FAILURE:'ОТКАЗ ЗАДНЕГО ПРИВОДА',WHEEL_DETACHED:'ОТОРВАЛО КОЛЕСО'};this.notify(e.randomFailure?randomMessages[e.type]:failureMessages[e.type],2.5);return;}const map={farmerHit:'FARMER_HIT',villagePropHit:'VILLAGE_PROP_HIT',villagePropBreak:'VILLAGE_PROP_HIT',cowHit:'COW_HIT',treeHit:'TREE_HIT',propHit:e.propType==='house'?'HOUSE_HIT':e.propType==='parked'?'TRAFFIC_HIT':'HOUSE_HIT',trafficHit:'TRAFFIC_HIT',fenceBreak:'FENCE_HIT',signHit:'SIGN_HIT',hardLanding:'HARD_LANDING'};
 if(e.type==='treeBreak'){this.stats.trees++;this.feedback.emit('TREE_BREAK',{impulse:e.impulse,position:e.position});return;}
 const type=map[e.type];if(!type)return;
 if(type==='FENCE_HIT')this.stats.fences++;if(type==='SIGN_HIT')this.stats.signs++;
 if(type==='HARD_LANDING'){const force=e.contactForce||this.body?.wheels.reduce((n,w)=>n+w.load,0)||0,mass=this.body?.c.mass||1280,weight=clamp(force/(mass*9.81),.8,1.4),damage=RUN_CONFIG.landingScale*Math.max(0,e.impact-RUN_CONFIG.landingThreshold)**1.4*weight*RUN_CONFIG.landingDamageMultiplier;this.hit(type,{...e,impulse:mass*(e.impact||0),damage,contactForce:force});}
 else this.hit(type,e);
 }
 hit(type,e={}){if(this.ended||this.time<this.damageImmuneUntil)return false;const key=e.sourceId||type,at=this.cooldowns.get(key)??-10;if(this.time-at<RUN_CONFIG.hitCooldown)return false;this.cooldowns.set(key,this.time);if(this.cooldowns.size>80)this.cooldowns.delete(this.cooldowns.keys().next().value);
 const impulse=Math.max(0,e.impulse||0),damage=e.damage??collisionDamage(impulse,this.body?.c.mass||1280);if(type==='HARD_LANDING')this.stats.hardLandings++;else if(type!=='ROOF_SLIDE')this.stats.collisions++;
 this.lastImpactDamage=damage;this.expedition.hit(type,damage,e);this.hp=clamp(this.hp-damage,0,100);this.feedback.emit(type,{impulse,damage,position:e.position,impact:e.impact,contactForce:e.contactForce,sourceId:key,propType:e.propType,roof:e.roof});if(this.hp<=0)this.finish();else this.mechanical.impact(type,damage,e);return true;}
 tick(dt,body){if(this.ended)return;this.body=body;if(this.mechanical.body!==body)this.mechanical.bind(body);this.mechanical.tick(dt);if(this.expedition.body===body)this.expedition.tick(dt,body);this.time+=dt;this.distance+=Math.max(0,body.state.stepDistance||0);if(this.randomFailures!==false)this.mechanical.checkDistance(this.distance);this.orientation=orientation(body.q);
 if(this.orientation!==this.lastOrientation&&this.lastOrientation==='NORMAL')this.stats.rollovers++;this.lastOrientation=this.orientation;
 const impact=body.state.bodyImpact;if(this.orientation!=='NORMAL'&&impact?.force>1000){if(impact.impulse>1200&&impact.closing>1&&impact.fresh)this.hit('ROLLOVER_IMPACT',{...impact,sourceId:'body',contactForce:impact.force});
 const speed=Math.hypot(body.v[0],body.v[2]);if(speed>.5&&!this.ended&&this.time>=this.damageImmuneUntil){const damage=(RUN_CONFIG.slideRate+Math.min(RUN_CONFIG.maxSlideSpeed,speed)*RUN_CONFIG.slideSpeedRate)*dt;this.hp=Math.max(0,this.hp-damage);if(this.time-this.lastSlide>1){this.lastSlide=this.time;this.feedback.emit('ROOF_SLIDE',{damage,impulse:0,orientation:this.orientation});}if(this.hp<=0)this.finish();}}
 if(this.fuel>0&&!this.ended)this.fuel=Math.max(0,this.fuel-fuelRate(body.state)*dt);
 if((!this.mode||this.mode==='ENDLESS'||this.mode==='OFFROAD')&&this.distance>this.best){this.best=this.distance;if(!this.recordShown&&this.distance>Math.max(100,this.previousBest+10)){this.recordShown=true;this.notify('НОВЫЙ РЕКОРД');}if(this.time-this.lastSave>RUN_CONFIG.saveInterval)this.save();}
 this.applyEngine(body);}
 applyEngine(body){if(this.mechanical.body!==body)this.mechanical.bind(body);body.state.hp=this.hp;body.state.fuel=this.fuel;body.state.runEnded=this.ended;body.state.engineRunning=this.fuel>0&&!this.ended&&!this.expedition.engine.stalled;body.state.enginePowerFactor=body.state.engineRunning?(this.hp<=25?.85:1)*(this.garageBuild?.engine==='turbo'?1.30:1):0;}
 collect(type){if(this.ended)return false;if(type==='BEER'&&this.beer)return false;if(type==='FUEL'){this.fuel=Math.min(100,this.fuel+RUN_CONFIG.refuel);this.notify('+25% ТОПЛИВА');}else if(type==='REPAIR'){this.hp=Math.min(100,this.hp+RUN_CONFIG.repair);this.mechanical.repair();this.expedition.repair();this.notify('+25 HP · МЕХАНИКА ИСПРАВНА');}else if(type==='BEER'){this.beer=true;this.notify('ПИВО НАЙДЕНО');}else return false;this.feedback.emit(type+'_PICKUP',{amount:type==='BEER'?1:25});if(this.body)this.applyEngine(this.body);return true;}
 drink(){if(!this.beer||this.ended)return false;this.beer=false;this.stats.beers++;this.notify('БАЛДЁЖ',2);this.feedback.emit('BEER_USE',{});return true;}
 finish(){if(this.ended)return;this.ended=true;this.hp=0;if((!this.mode||this.mode==='ENDLESS'||this.mode==='OFFROAD')){this.best=Math.max(this.best,this.distance);this.save();}if(this.body){this.applyEngine(this.body);this.body.v=[0,0,0];this.body.omega=[0,0,0];this.body.wheels.forEach(w=>w.omega=0);this.body.state.vehicleSpeed=0;}this.feedback.emit('RUN_END',{distance:this.distance,best:this.best,stats:{...this.stats}});}
 updateClock(dt){if(this.ended){this.time+=dt;this.mechanical.tick(dt);}}
}
