// Surface coefficients are independent of transmission range and differential state.
export const SURFACE_CONFIG={
 GRASS:{longitudinalGrip:.74,lateralGrip:.43,rollingResistance:.028,slipResistance:1,sinkAmount:0,effectMultiplier:.3,vibrationMultiplier:.16},
 DIRT:{longitudinalGrip:.90,lateralGrip:.90,rollingResistance:.025,slipResistance:1,sinkAmount:0,effectMultiplier:1,vibrationMultiplier:.12},
 SOFT_DIRT:{longitudinalGrip:.60,lateralGrip:.55,rollingResistance:.065,slipResistance:1.35,sinkAmount:.018,effectMultiplier:1.2,vibrationMultiplier:.2},
 MUD:{longitudinalGrip:.52,lateralGrip:.40,rollingResistance:.065,slipResistance:2.2,sinkAmount:.07,effectMultiplier:1.5,vibrationMultiplier:.08},
 ROCK:{longitudinalGrip:1.12,lateralGrip:1.15,rollingResistance:.025,slipResistance:1,sinkAmount:0,effectMultiplier:.3,vibrationMultiplier:.8},
 WATER:{longitudinalGrip:.68,lateralGrip:.60,rollingResistance:.045,slipResistance:1.3,sinkAmount:0,effectMultiplier:1.8,vibrationMultiplier:.03}
};
export const SURFACE_SETTINGS={transitionTime:.18,mudGripLoss:.55,mudResistance:.085,mudPostPeak:.52,waterResistance:.14,maxVisualSink:.15,mudSpeedDrag:.0014,waterSpeedDrag:.0011,maxSpeedDrag:.55,dragResponseTime:.12};
export const SURFACE_PATCHES=[
 {x0:18,x1:26,z0:-6,z1:4,type:'SOFT_DIRT',label:'04 · РЫХЛАЯ ЗЕМЛЯ',color:[.57,.43,.29]},
 {x0:28,x1:36,z0:-6,z1:4,type:'MUD',mudDepth:.18,label:'05 · ЛЁГКАЯ ГРЯЗЬ',color:[.36,.29,.20]},
 {x0:18,x1:26,z0:-30,z1:-9,type:'MUD',mudDepth:.60,label:'06 · ГРЯЗЕВАЯ ЯМА',color:[.23,.21,.15]},
 {x0:28,x1:36,z0:-24,z1:-9,type:'WATER',waterDepth:.16,label:'07 · БРОД',color:[.37,.52,.52]}
];
export function sampleSurface(x,z){
 const patch=SURFACE_PATCHES.find(q=>x>=q.x0&&x<=q.x1&&z>=q.z0&&z<=q.z1);
 let type=patch?.type||((x>7&&x<13&&z>-15&&z<-3)||(x>-7&&x<7&&z>8&&z<23)?'ROCK':'DIRT');
 // Unequal ruts let wheel and axle differentials encounter different traction.
 const mudDepth=patch?.mudDepth?patch.mudDepth*(patch.mudDepth>.5?(x<22?.22:1.15)*(z<-18?1.18:.55):1):0;
 const waterDepth=patch?.waterDepth||0,c={...SURFACE_CONFIG[type]};
 if(type==='MUD'){c.longitudinalGrip*=1-SURFACE_SETTINGS.mudGripLoss*mudDepth;c.lateralGrip*=1-.45*mudDepth;c.rollingResistance+=SURFACE_SETTINGS.mudResistance*mudDepth;c.sinkAmount=Math.min(SURFACE_SETTINGS.maxVisualSink,c.sinkAmount*mudDepth);}
 if(type==='WATER')c.rollingResistance+=waterDepth*SURFACE_SETTINGS.waterResistance;
 return{surfaceType:type,mudDepth,waterDepth,...c};
}
