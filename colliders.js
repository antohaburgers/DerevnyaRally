import {rotate} from './physics.js?v=014';
export const COLLIDER_CONFIG={halfWidth:.87,halfLength:1.9,restitution:.035};
// SAT for two oriented rectangles. A tiny separation slop prevents repeated penetration.
export function boxContact(body,obstacle){
 if(body.p[1]<obstacle.y-.5||body.p[1]>obstacle.y+(obstacle.height||2)+.8)return null;
 const f=rotate(body.q,[0,0,1]),yaw=Math.atan2(f[0],f[2]),r=obstacle.rotation||0,
 axes=[[Math.cos(yaw),-Math.sin(yaw)],[Math.sin(yaw),Math.cos(yaw)],[Math.cos(r),-Math.sin(r)],[Math.sin(r),Math.cos(r)]],delta=[body.p[0]-obstacle.x,body.p[2]-obstacle.z];let depth=Infinity,normal;
 for(const a of axes){const project=(x,z)=>Math.abs(x*a[0]+z*a[1]);const player=COLLIDER_CONFIG.halfWidth*project(...axes[0])+COLLIDER_CONFIG.halfLength*project(...axes[1]),target=obstacle.width/2*project(...axes[2])+obstacle.depth/2*project(...axes[3]),d=delta[0]*a[0]+delta[1]*a[1],overlap=player+target-Math.abs(d);if(overlap<=0)return null;if(overlap<depth){depth=overlap;normal=a.map(v=>v*(d<0?-1:1));}}
 return{normal,depth};
}
export function resolveBox(body,obstacle,velocity=[0,0],strength=1){const contact=boxContact(body,obstacle);if(!contact)return null;const [nx,nz]=contact.normal;
 body.p[0]+=nx*(contact.depth+.001);body.p[2]+=nz*(contact.depth+.001);
 const closing=Math.max(0,-((body.v[0]-velocity[0])*nx+(body.v[2]-velocity[1])*nz)),impulse=closing*body.c.mass*(1+COLLIDER_CONFIG.restitution)*strength;
 body.v[0]+=nx*impulse/body.c.mass;body.v[2]+=nz*impulse/body.c.mass;
 // A glancing hit creates a small, bounded yaw impulse; straight impacts remain straight.
 const dx=obstacle.x-body.p[0],dz=obstacle.z-body.p[2],lever=Math.max(-.7,Math.min(.7,dz*nx-dx*nz));body.omega[1]+=Math.max(-1.2,Math.min(1.2,lever*impulse/body.c.inertia[1]*.12));
 return{...contact,closing,impulse};}
