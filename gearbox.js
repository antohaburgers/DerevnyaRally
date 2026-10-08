// Five-speed automatic: throttle controls shift RPM; speed follows gearing, not a fixed shift table.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const GEARBOX_CONFIG={
  baseUpRPM:2200,fullUpRPM:5350,throttleExponent:1.25,
  downIdleRPM:1150,downThrottleRPM:650,
  kickdownThrottle:.82,kickdownCurrentMaxRPM:4400,
  kickdownFromFifthRPM:5100,kickdownOtherRPM:4550,
  loadThreshold:.78,loadDownRPM:2300,
  lowUpRPM:[2800,3700],lowDownRPM:1550,
  shiftDuration:.18,upCooldown:.45,downCooldown:.34,
  lowFadeStart:48,lowFadeEnd:68
};
export function chooseShift(state,c){
  const tune=c.gearbox,g=state.currentGear;
  if(g<1||state.shiftRemaining>0||!Number.isFinite(state.currentRPM))return null;
  const throttle=clamp(Math.max(state.throttle||0,state.throttleInput||0),0,1);
  const speed=Math.abs(state.vehicleSpeed||0);
  const nextRPM=g>1?state.currentRPM*c.gearRatios[g-2]/c.gearRatios[g-1]:Infinity;
  const canDownshift=g>1&&nextRPM<c.redlineRPM-350;
  if(state.transferRange==='L'){
    const lowUp=tune.lowUpRPM[0]+(tune.lowUpRPM[1]-tune.lowUpRPM[0])*throttle;
    if(canDownshift&&state.currentRPM<tune.lowDownRPM+((state.load||0)>.75?300:0))return {gear:g-1,event:'DOWNSHIFT'};
    if(g<5&&speed>3&&state.currentRPM>=lowUp&&(state.load||0)<.95)return {gear:g+1,event:'UPSHIFT'};
    return null;
  }
  const upRPM=Math.min(c.redlineRPM-650,tune.baseUpRPM+(tune.fullUpRPM-tune.baseUpRPM)*Math.pow(throttle,tune.throttleExponent));
  const downRPM=tune.downIdleRPM+tune.downThrottleRPM*throttle;
  if(canDownshift&&state.currentRPM<downRPM)return {gear:g-1,event:'DOWNSHIFT'};
  if(canDownshift&&throttle>=tune.kickdownThrottle&&state.currentRPM<tune.kickdownCurrentMaxRPM&&nextRPM<(g===5?tune.kickdownFromFifthRPM:tune.kickdownOtherRPM))return {gear:g-1,event:'KICKDOWN'};
  if(canDownshift&&(state.load||0)>tune.loadThreshold&&throttle>.65&&(state.longitudinalAcceleration??0)<.25&&state.currentRPM<tune.loadDownRPM)return {gear:g-1,event:'DOWNSHIFT'};
  if(g<5&&speed>4&&state.currentRPM>=upRPM)return {gear:g+1,event:'UPSHIFT'};
  return null;
}
// LOW retains its off-road safety fade; HIGH has no fake 110-135 km/h power cutoff.
export function speedTorqueFactor(speed,range,tune=GEARBOX_CONFIG){
  if(range!=='L')return 1;
  const t=clamp((Math.abs(speed)-tune.lowFadeStart)/(tune.lowFadeEnd-tune.lowFadeStart),0,1);
  return 1-t*t;
}
