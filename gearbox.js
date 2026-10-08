// Smart 5-speed automatic. Select a gear from road speed, never free-spinning airborne wheels.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const GEARBOX_CONFIG={
  baseUpRPM:2200,fullUpRPM:5350,throttleExponent:1.25,
  coastDownRPM:1250,urgentDownRPM:1650,
  driveRecoveryThrottle:.55,driveRecoveryRPM:2100,
  recoveryTargetRPM:2450,recoveryMaxRPM:5200,
  kickdownThrottle:.88,kickdownDelay:.65,kickdownCurrentMaxRPM:4250,
  kickdownFromFifthRPM:5100,kickdownOtherRPM:3900,
  loadThreshold:.78,loadDownRPM:2050,loadDownDelay:.9,
  rapidDecelKmhPerSecond:14,rapidDecelMemory:.75,
  lowUpRPM:[2800,3700],lowDownRPM:1550,
  shiftDuration:.18,upCooldown:.45,downCooldown:.40,
  lowFadeStart:48,lowFadeEnd:68
};
export function rpmAtSpeed(speed,gear,c,range='H'){
  const ratio=gear<0?c.reverseRatio:c.gearRatios[gear-1];
  return Math.abs(speed)/3.6/c.wheelRadius*ratio*(range==='L'?c.lowRangeRatio:c.highRangeRatio)*c.finalDrive*60/(2*Math.PI);
}
export function updateGearboxIntent(s,c,dt){
  const tune=c.gearbox,speed=Math.abs(s.vehicleSpeed||0);
  const previous=s.previousGearboxSpeed;
  const slowdown=Number.isFinite(previous)?(previous-speed)/Math.max(.001,dt):0;
  s.previousGearboxSpeed=speed;
  s.rapidDecelHold=Math.max(0,(s.rapidDecelHold||0)-dt);
  if(slowdown>tune.rapidDecelKmhPerSecond&&speed>4)s.rapidDecelHold=tune.rapidDecelMemory;
  const throttle=clamp(Math.max(s.throttleInput||0,s.throttle||0),0,1);
  const kickdownIntent=s.transferRange==='H'&&(s.brake||0)<.05&&throttle>=tune.kickdownThrottle;
  s.kickdownHold=kickdownIntent?Math.min(3,(s.kickdownHold||0)+dt):0;
  const loaded=throttle>.65&&(s.load||0)>tune.loadThreshold&&(s.longitudinalAcceleration||0)<.25&&s.currentRPM<tune.loadDownRPM;
  s.lugHold=loaded?Math.min(3,(s.lugHold||0)+dt):0;
}
function recoveryGear(speed,current,c){
  if(speed<5)return 1;
  const target=c.gearbox.recoveryTargetRPM;
  let best=current,bestError=Infinity;
  for(let g=1;g<current;g++){
    const rpm=rpmAtSpeed(speed,g,c,'H');
    if(rpm>Math.min(c.redlineRPM-450,c.gearbox.recoveryMaxRPM))continue;
    const error=Math.abs(rpm-target)+Math.max(0,rpm-3000)*2;
    if(error<bestError){best=g;bestError=error;}
  }
  return best;
}
export function chooseShift(state,c){
  const tune=c.gearbox,g=state.currentGear;
  if(g<1||state.shiftRemaining>0||!Number.isFinite(state.currentRPM))return null;
  const throttle=clamp(Math.max(state.throttle||0,state.throttleInput||0),0,1);
  const speed=Math.abs(state.vehicleSpeed||0),low=state.transferRange==='L';
  const currentRoadRPM=rpmAtSpeed(speed,g,c,state.transferRange);
  const nextRoadRPM=g>1?rpmAtSpeed(speed,g-1,c,state.transferRange):Infinity;
  const nextWheelRPM=g>1?state.currentRPM*c.gearRatios[g-2]/c.gearRatios[g-1]:Infinity;
  const safeDown=g>1&&nextRoadRPM<c.redlineRPM-450&&(state.airborne||nextWheelRPM<c.redlineRPM-250);
  if(low){
    const lowUp=tune.lowUpRPM[0]+(tune.lowUpRPM[1]-tune.lowUpRPM[0])*throttle;
    if(safeDown&&state.currentRPM<tune.lowDownRPM+((state.load||0)>.75?300:0))return{gear:g-1,event:'DOWNSHIFT'};
    if(g<5&&speed>3&&state.currentRPM>=lowUp&&(state.load||0)<.95)return{gear:g+1,event:'UPSHIFT'};
    return null;
  }
  const isUrgent=(state.rapidDecelHold||0)>0||(state.brake||0)>.35;
  const rpmThreshold=isUrgent?tune.urgentDownRPM:tune.coastDownRPM;
  // An under-geared car needs a road-speed recovery, not a delayed one-step kickdown.
  // Real vehicle speed is authoritative after jumps even if the wheels are still spinning.
  const needsDriveGear=(state.brake||0)<.2&&throttle>=tune.driveRecoveryThrottle&&currentRoadRPM<tune.driveRecoveryRPM;
  if(g>1&&(speed<5||currentRoadRPM<rpmThreshold||needsDriveGear)){
    const target=recoveryGear(speed,g,c);
    if(target<g)return{gear:target,event:'RECOVERY'};
  }
  if(safeDown&&(state.kickdownHold||0)>=tune.kickdownDelay&&state.currentRPM<tune.kickdownCurrentMaxRPM&&nextRoadRPM<(g===5?tune.kickdownFromFifthRPM:tune.kickdownOtherRPM))return{gear:g-1,event:'KICKDOWN'};
  if(safeDown&&(state.lugHold||0)>=tune.loadDownDelay)return{gear:g-1,event:'DOWNSHIFT'};
  const upRPM=Math.min(c.redlineRPM-650,tune.baseUpRPM+(tune.fullUpRPM-tune.baseUpRPM)*Math.pow(throttle,tune.throttleExponent));
  // Prevent a freshly recovered gear from upshifting merely because its wheels spin in the air.
  const recoveryUpshiftReady=state.shiftEvent!=='RECOVERY'||currentRoadRPM>=upRPM*.75;
  if(g<5&&speed>4&&!state.airborne&&recoveryUpshiftReady&&state.currentRPM>=upRPM)return{gear:g+1,event:'UPSHIFT'};
  return null;
}
export function speedTorqueFactor(speed,range,tune=GEARBOX_CONFIG){
  if(range!=='L')return 1;
  const t=clamp((Math.abs(speed)-tune.lowFadeStart)/(tune.lowFadeEnd-tune.lowFadeStart),0,1);
  return 1-t*t;
}
