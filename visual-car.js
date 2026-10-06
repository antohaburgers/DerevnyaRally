import {rotate} from './physics.js?v=019';
export const VISUAL_CONFIG={positionResponse:[18,10,18],yawResponse:22,tiltResponse:8,positionDeadZone:.0008,angleDeadZone:.0007};
const blend=(a,b,t)=>a+(b-a)*t,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function slerp(a,b,t){let d=a.reduce((s,v,i)=>s+v*b[i],0),target=b;if(d<0){target=b.map(v=>-v);d=-d;}if(d>.9995){const q=a.map((v,i)=>blend(v,target[i],t)),n=Math.hypot(...q);return q.map(v=>v/n);}const angle=Math.acos(Math.min(1,d)),s=Math.sin(angle);return a.map((v,i)=>(v*Math.sin((1-t)*angle)+target[i]*Math.sin(t*angle))/s);}
function quat(yaw,pitch,roll){const cy=Math.cos(yaw/2),sy=Math.sin(yaw/2),cx=Math.cos(pitch/2),sx=Math.sin(pitch/2),cz=Math.cos(roll/2),sz=Math.sin(roll/2);return [cy*sx*cz+sy*cx*sz,sy*cx*cz-cy*sx*sz,cy*cx*sz-sy*sx*cz,cy*cx*cz+sy*sx*sz];}
function angles(q){const front=rotate(q,[0,0,1]),right=rotate(q,[1,0,0]),up=rotate(q,[0,1,0]);return{yaw:Math.atan2(front[0],front[2]),pitch:Math.atan2(-front[1],Math.hypot(front[0],front[2])),roll:Math.atan2(right[1],up[1])};}
export class VisualCar{
 constructor(vehicle){this.vehicle=vehicle;this.reset();}
 reset(){this.p=this.vehicle.p.slice();this.q=this.vehicle.q.slice();Object.assign(this,angles(this.q));this.update(0,true);}
 update(dt,snap=false){const v=this.vehicle,c=v.c,prev=v.previousPose||{p:v.p,q:v.q,lengths:v.wheels.map(w=>w.length),angles:v.wheels.map(w=>w.angle)},t=Math.min(1,v.accumulator/c.fixedStep),q=slerp(prev.q,v.q,t),p=v.p.map((value,i)=>blend(prev.p[i],value,t)),target=angles(q);
 if(snap){this.p=p;Object.assign(this,target);}else{this.p=this.p.map((value,i)=>{const error=p[i]-value;return Math.abs(error)<VISUAL_CONFIG.positionDeadZone?value:blend(value,p[i],1-Math.exp(-VISUAL_CONFIG.positionResponse[i]*dt));});for(const key of ['yaw','pitch','roll']){const error=wrap(target[key]-this[key]);if(Math.abs(error)>VISUAL_CONFIG.angleDeadZone)this[key]+=error*(1-Math.exp(-(key==='yaw'?VISUAL_CONFIG.yawResponse:VISUAL_CONFIG.tiltResponse)*dt));}}
 this.q=quat(this.yaw,this.pitch,this.roll);const basis=[[1,0,0],[0,1,0],[0,0,1]].map(axis=>rotate(this.q,axis)),com=rotate(this.q,c.centerOfMass),origin=this.p.map((v,i)=>v-com[i]);this.matrix=new Float32Array([...basis[0],0,...basis[1],0,...basis[2],0,...origin,1]);
 this.wheels=v.wheels.map((w,i)=>{const length=blend(prev.lengths[i]??w.length,w.length,t),offset=rotate(this.q,[w.x,c.mountHeight-length,w.z]);return {...w,position:origin.map((v,j)=>v+offset[j]),angle:(prev.angles[i]??w.angle)+wrap(w.angle-(prev.angles[i]??w.angle))*t};});
 return this;
 }
}
