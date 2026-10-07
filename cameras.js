import {rotate} from './physics.js?v=024';
import {slerp} from './visual-car.js?v=024';
export const CAMERA_CONFIG={chaseDistance:6.3,chaseElevation:.34,chaseFollow:12,hoodPoint:[0,1.45,.60],hoodLookDistance:32,hoodRotationResponse:10,hoodFov:72,chaseFov:64,accelerationOffset:.025};
export class HoodCamera{
 constructor(visual){this.reset(visual);}
 reset(visual){this.p=visual.p.slice();this.q=visual.q.slice();}
 update(dt,visual,snap=false){if(snap)this.reset(visual);else{// VisualCar already filters position; a second translation lag would pull the eye inside the opaque windshield at speed.
this.p=visual.p.slice();this.q=slerp(this.q,visual.q,1-Math.exp(-CAMERA_CONFIG.hoodRotationResponse*dt));}const local=CAMERA_CONFIG.hoodPoint.map((v,i)=>v-visual.vehicle.c.centerOfMass[i]),offset=rotate(visual.q,local),eye=this.p.map((v,i)=>v+offset[i]),forward=rotate(this.q,[0,0,1]),up=rotate(this.q,[0,1,0]);return{eye,target:eye.map((v,i)=>v+forward[i]*CAMERA_CONFIG.hoodLookDistance),up};}
}
