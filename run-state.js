import {rotate} from './physics.js?v=018';
export const RUN_CONFIG={bestKey:'niva3d.bestMeters.v1',hp:100,fuel:100,fuelIdle:.006,fuelThrottle:.085,fuelRPM:.026,fuelLoad:.020,lowConsumption:1.10,repair:25,refuel:25,impactThreshold:1,impactExponent:1.65,impactScale:.20,impactMax:75,hitCooldown:.35,landingThreshold:4.5,landingScale:2,landingDamageMultiplier:.70,slideRate:.08,slideSpeedRate:.025,maxSlideSpeed:15,saveInterval:2};
export const DAMAGE_EVENTS=['COW_HIT','TREE_HIT','HOUSE_HIT','TRAFFIC_HIT','FENCE_HIT','SIGN_HIT','HARD_LANDING','ROLLOVER_IMPACT','ROOF_SLIDE'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function orientation(q){const up=rotate(q,[0,1,0])[1];return up>.5?'NORMAL':up>-.5?'SIDE':'UPSIDE_DOWN';}
export function collisionDamage(impulse,mass=1280){return clamp(RUN_CONFIG.impactScale*Math.max(0,impulse/mass-RUN_CONFIG.impactThreshold)**RUN_CONFIG.impactExponent,0,RUN_CONFIG.impactMax);}
export function fuelRate(state){const rpm=clamp((state.currentRPM-850)/5350,0,1),throttle=clamp(state.throttle||0,0,1);return(RUN_CONFIG.fuelIdle+RUN_CONFIG.fuelThrottle*throttle**2+RUN_CONFIG.fuelRPM*rpm+RUN_CONFIG.fuelLoad*clamp(state.load||0,0,1))*(state.transferRange==='L'?RUN_CONFIG.lowConsumption:1);}
export class RunState{
 constructor(feedback,storage){this.feedback=feedback;this.storage=storage;this.best=0;try{const value=Number(storage?.getItem(RUN_CONFIG.bestKey));if(Number.isFinite(value)&&value>=0&&value<1e9)this.best=value;}catch{}this.unsubscribe=feedback.onEvent(e=>this.receive(e));this.reset();}
 reset(){this.hp=100;this.fuel=100;this.distance=0;this.beer=false;this.ended=false;this.time=0;this.cooldowns=new Map();this.messages=[];this.previousBest=this.best;this.recordShown=false;this.lastSave=0;this.lastSlide=-10;this.lastOrientation='NORMAL';this.orientation='NORMAL';this.body=null;this.damageImmuneUntil=0;this.stats={trees:0,fences:0,signs:0,beers:0,collisions:0,rollovers:0,hardLandings:0};}
 notify(text,duration=2){this.messages.push({text,until:this.time+duration});if(this.messages.length>4)this.messages.shift();}
 get message(){this.messages=this.messages.filter(m=>m.until>this.time);return (this.messages.find(m=>m.text==='БАЛДЁЖ')||this.messages.at(-1))?.text||'';}
 save(){try{this.storage?.setItem(RUN_CONFIG.bestKey,String(this.best));}catch{}this.lastSave=this.time;}
 receive(e){if(this.ended)return;const map={cowHit:'COW_HIT',treeHit:'TREE_HIT',propHit:e.propType==='house'?'HOUSE_HIT':e.propType==='parked'?'TRAFFIC_HIT':'HOUSE_HIT',trafficHit:'TRAFFIC_HIT',fenceBreak:'FENCE_HIT',signHit:'SIGN_HIT',hardLanding:'HARD_LANDING'};
 if(e.type==='treeBreak'){this.stats.trees++;this.feedback.emit('TREE_BREAK',{impulse:e.impulse,position:e.position});return;}
 const type=map[e.type];if(!type)return;
 if(type==='FENCE_HIT')this.stats.fences++;if(type==='SIGN_HIT')this.stats.signs++;
 if(type==='HARD_LANDING'){const force=e.contactForce||this.body?.wheels.reduce((n,w)=>n+w.load,0)||0,mass=this.body?.c.mass||1280,weight=clamp(force/(mass*9.81),.8,1.4),damage=RUN_CONFIG.landingScale*Math.max(0,e.impact-RUN_CONFIG.landingThreshold)**1.4*weight*RUN_CONFIG.landingDamageMultiplier;this.hit(type,{...e,impulse:mass*(e.impact||0),damage,contactForce:force});}
 else this.hit(type,e);
 }
 hit(type,e={}){if(this.ended||this.time<this.damageImmuneUntil)return false;const key=e.sourceId||type,at=this.cooldowns.get(key)??-10;if(this.time-at<RUN_CONFIG.hitCooldown)return false;this.cooldowns.set(key,this.time);if(this.cooldowns.size>80)this.cooldowns.delete(this.cooldowns.keys().next().value);
 const impulse=Math.max(0,e.impulse||0),damage=e.damage??collisionDamage(impulse,this.body?.c.mass||1280);if(type==='HARD_LANDING')this.stats.hardLandings++;else if(type!=='ROOF_SLIDE')this.stats.collisions++;
 this.hp=clamp(this.hp-damage,0,100);this.feedback.emit(type,{impulse,damage,position:e.position,impact:e.impact,contactForce:e.contactForce,sourceId:key,roof:e.roof});if(this.hp<=0)this.finish();return true;}
 tick(dt,body){if(this.ended)return;this.body=body;this.time+=dt;this.distance+=Math.max(0,body.state.stepDistance||0);this.orientation=orientation(body.q);
 if(this.orientation!==this.lastOrientation&&this.lastOrientation==='NORMAL')this.stats.rollovers++;this.lastOrientation=this.orientation;
 const impact=body.state.bodyImpact;if(this.orientation!=='NORMAL'&&impact?.force>1000){if(impact.impulse>1200&&impact.closing>1&&impact.fresh)this.hit('ROLLOVER_IMPACT',{...impact,sourceId:'body',contactForce:impact.force});
 const speed=Math.hypot(body.v[0],body.v[2]);if(speed>.5&&!this.ended&&this.time>=this.damageImmuneUntil){const damage=(RUN_CONFIG.slideRate+Math.min(RUN_CONFIG.maxSlideSpeed,speed)*RUN_CONFIG.slideSpeedRate)*dt;this.hp=Math.max(0,this.hp-damage);if(this.time-this.lastSlide>1){this.lastSlide=this.time;this.feedback.emit('ROOF_SLIDE',{damage,impulse:0,orientation:this.orientation});}if(this.hp<=0)this.finish();}}
 if(this.fuel>0&&!this.ended)this.fuel=Math.max(0,this.fuel-fuelRate(body.state)*dt);
 if(this.distance>this.best){this.best=this.distance;if(!this.recordShown&&this.distance>Math.max(100,this.previousBest+10)){this.recordShown=true;this.notify('НОВЫЙ РЕКОРД');}if(this.time-this.lastSave>RUN_CONFIG.saveInterval)this.save();}
 this.applyEngine(body);}
 applyEngine(body){body.state.hp=this.hp;body.state.fuel=this.fuel;body.state.runEnded=this.ended;body.state.engineRunning=this.fuel>0&&!this.ended;body.state.enginePowerFactor=body.state.engineRunning?(this.hp<=25?.85:1):0;}
 collect(type){if(this.ended)return false;if(type==='BEER'&&this.beer)return false;if(type==='FUEL'){this.fuel=Math.min(100,this.fuel+RUN_CONFIG.refuel);this.notify('+25% ТОПЛИВА');}else if(type==='REPAIR'){this.hp=Math.min(100,this.hp+RUN_CONFIG.repair);this.notify('+25 HP');}else if(type==='BEER'){this.beer=true;this.notify('ПИВО НАЙДЕНО');}else return false;this.feedback.emit(type+'_PICKUP',{amount:type==='BEER'?1:25});if(this.body)this.applyEngine(this.body);return true;}
 drink(){if(!this.beer||this.ended)return false;this.beer=false;this.stats.beers++;this.notify('БАЛДЁЖ',2);this.feedback.emit('BEER_USE',{});return true;}
 finish(){if(this.ended)return;this.ended=true;this.hp=0;this.best=Math.max(this.best,this.distance);this.save();if(this.body){this.applyEngine(this.body);this.body.v=[0,0,0];this.body.omega=[0,0,0];this.body.wheels.forEach(w=>w.omega=0);this.body.state.vehicleSpeed=0;}this.feedback.emit('RUN_END',{distance:this.distance,best:this.best,stats:{...this.stats}});}
 updateClock(dt){if(this.ended)this.time+=dt;}
}
