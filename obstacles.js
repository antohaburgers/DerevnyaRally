export const OBSTACLE_CONFIG={chance:1,minimumStart:14,clearLanding:36,localSpacing:[30,70],comboSpacing:[150,300],specialSpacing:[500,900],maxFeatures:28,samplingStep:.30,surfaceSamplingStep:.60,logSamplingStep:.10,detailRadius:3,types:{
 MUD_PATCH:{height:-.07,radius:.55,longRadius:2.0,surfaceType:'MUD',mudDepth:.60},
 MUD_MEDIUM:{height:-.08,radius:1.25,longRadius:3.0,surfaceType:'MUD',mudDepth:.52},
 MUD_STRIP:{height:-.09,radius:.65,longRadius:4.2,surfaceType:'MUD',mudDepth:.65},
 PUDDLE:{height:-.08,radius:.80,longRadius:1.15,surfaceType:'WATER',waterDepth:.08},
 LOG_SMALL:{height:.11,radius:1.1,longRadius:.24,shape:'log'},
 LOG_MEDIUM:{height:.22,radius:1.5,longRadius:.36,shape:'log'},
 LOG_LARGE:{height:.34,radius:1.7,longRadius:.50,shape:'log'},
 PIT:{height:-.23,radius:.95,longRadius:1.1},
 POTHOLE:{height:-.16,radius:.64,longRadius:.80},
 ROCK:{height:.56,radius:.72,longRadius:.82,surfaceType:'ROCK'},
 SHORT_RUT:{height:-.13,radius:.42,longRadius:3.1},
 DITCH:{height:-.20,radius:1.60,longRadius:.62},
 BUMP:{height:.32,radius:1.1,longRadius:1.6},
 SOFT_PATCH:{height:-.035,radius:1.1,longRadius:2.7,surfaceType:'SOFT_DIRT'}
}};
export const HILL_CONFIG={light:[12,16,20],hard:[25,28,30],extreme:[35,37,39],descent:[22,27,30],extremeDescent:35,extremeChance:.13};
export function obstacleWeight(o,u,lateral,length){
 if(o.shape==='long_rut'){
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const along=smooth((u-o.startU)/.085)*smooth((o.endU-u)/.085);
  const center=o.lateral+.10*Math.sin(u*14+o.phase);
  const across=(lateral-center)/o.radius;
  return along*Math.exp(-1.4*across*across);
 }
 if(o.shape==='river'){
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const sidewaysBend=1.4*(Math.sin(lateral*.19+o.phase)-Math.sin(o.phase));
  const along=Math.abs((u-o.u)*length-sidewaysBend);
  return smooth((o.longRadius+2-along)/3)*smooth((o.radius+2-Math.abs(lateral))/3);
 }
 const along=(u-o.u)*length/(o.longRadius||o.radius),across=(lateral-o.lateral)/o.radius;let radial=along*along+across*across;if(o.shape==='log')return Math.max(0,1-across**8)*Math.exp(-.5*along*along);if(o.ragged)radial*=1+.13*Math.sin(along*3+across*5+o.phase)+.08*Math.sin(across*7-along*2);return Math.exp(-.5*radial);}
// Cosine ramps give a specified maximum grade, with horizontal entry and exit tangents.
export function hillElevation(distance,hill){const x=distance-hill.start,L=hill.span,r=hill.ramp,e=hill.exitRamp||r,g=Math.tan(hill.angle*Math.PI/180)*hill.sign;if(x<=0)return 0;if(x>=L)return g*(L-(r+e)/2);if(x<r)return g*(x/2-r*Math.sin(Math.PI*x/r)/(2*Math.PI));if(x<=L-e)return g*(x-r/2);const t=x-(L-e);return g*(L-e-r/2+t/2+e*Math.sin(Math.PI*t/e)/(2*Math.PI));}
