import {rotate} from './physics.js?v=026';
export const PICKUP_CONFIG={first:120,spacing:[350,600],radius:1.65,visualScale:1.4,maxPerSection:2,weights:['FUEL','FUEL','FUEL','REPAIR','REPAIR','REPAIR','REPAIR','REPAIR','BEER','BEER'],safeLanding:45};
export function populatePickups(world,section){section.pickups=[];const start=section.startDistance,end=section.exitDistance,previous=world.sections.at(-2);let seed=(world.seed^Math.imul(section.id+1,0x85ebca6b))>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const safe=!section.crestSafe&&!['ROCK_SECTION','TECHNICAL_HILL','STEEP_DESCENT','LOG_CROSSING','WASHOUT','BUMP_CHAIN','RUTS'].includes(section.type);
 if(world.nextPickupS===undefined)world.nextPickupS=PICKUP_CONFIG.first;
 while(world.nextPickupS<end-14){const at=Math.max(world.nextPickupS,start+(previous?.crestSafe?PICKUP_CONFIG.safeLanding:20));if(!safe||at>=end-14){world.nextPickupS=end+20;break;}
 const u=(at-start)/section.length,p=world.point(section,u),node=section.nodes[Math.min(section.nodes.length-1,Math.floor(u*(section.nodes.length-1)))],type=PICKUP_CONFIG.weights[Math.floor(random()*PICKUP_CONFIG.weights.length)],preferred=random()<.20?1:-1;
 let item=null;for(const offset of [preferred*Math.min(2.05,node.width/2-1.1),0,-preferred*Math.min(2.05,node.width/2-1.1)]){const x=p.x+Math.cos(p.yaw)*offset,z=p.z-Math.sin(p.yaw)*offset,surface=world.surface(x,z);if(surface.mudDepth>.16||surface.waterDepth>.025||Math.abs(world.localHeight(section,u,offset))>.14)continue;
 if(world.sections.some(s=>s.decorations.some(d=>!d.broken&&Math.hypot(d.x-x,d.z-z)<(d.kind==='house'?Math.hypot(d.width,d.depth)/2+1.7:d.kind==='fence'?d.width/2+1.7:d.kind==='tree'?(d.radius||.3)+1.7:2.5))))continue;
 if(section.obstacles.some(o=>Math.hypot((o.u-u)*section.length,o.lateral-offset)<o.radius+1.2)||section.localFeatures.some(o=>Math.abs((o.u-u)*section.length)<o.longRadius+1.2&&Math.abs(o.lateral-offset)<o.radius+1.2))continue;
 item={type,x,z,y:world.height(x,z),phase:random()*6.28,collected:false,s:at};break;}
 if(item)section.pickups.push(item);world.nextPickupS=at+PICKUP_CONFIG.spacing[0]+random()*(PICKUP_CONFIG.spacing[1]-PICKUP_CONFIG.spacing[0]);if(section.pickups.length>=PICKUP_CONFIG.maxPerSection)break;}
}
export class Pickups{
 constructor(world,run,traffic){this.world=world;this.run=run;this.traffic=traffic;this.lastPickup='—';this.grid=new Map();this.signature='';}
 get visible(){return this.world.sections.flatMap(s=>(s.pickups||[]).filter(p=>!p.collected));}
 nearby(body){if(!this.world.circular&&!this.world.finiteRace)return this.visible;const signature=this.world.seed+':'+this.world.revision+':'+this.world.nextId;if(this.signature!==signature){this.grid.clear();for(const section of this.world.sections)for(const item of section.pickups||[]){const key=Math.floor(item.x/8)+','+Math.floor(item.z/8);if(!this.grid.has(key))this.grid.set(key,[]);this.grid.get(key).push(item);}this.signature=signature;}const out=[],x=Math.floor(body.p[0]/8),z=Math.floor(body.p[2]/8);for(let i=x-1;i<=x+1;i++)for(let j=z-1;j<=z+1;j++)for(const item of this.grid.get(i+','+j)||[])if(!item.collected)out.push(item);return out;}
 tick(dt,body){if(this.run.ended)return;const forward=rotate(body.q,[0,0,1]),yaw=Math.atan2(forward[0],forward[2]),c=Math.cos(yaw),s=Math.sin(yaw);
 for(const item of this.nearby(body)){if(this.run.isAI&&item.type==='BEER')continue;if(this.traffic.active.some(n=>Math.hypot(n.x-item.x,n.z-item.z)<3.7))continue;const dx=item.x-body.p[0],dz=item.z-body.p[2],lx=dx*c-dz*s,lz=dx*s+dz*c,near=Math.hypot(Math.max(0,Math.abs(lx)-.87),Math.max(0,Math.abs(lz)-1.9))<PICKUP_CONFIG.radius;
 if(near&&body.p[1]>item.y-.4&&body.p[1]<item.y+2.5&&this.run.collect(item.type)){item.collected=true;this.lastPickup=item.type;}}
 }
 shift(dx,dz){for(const section of this.world.sections)for(const p of section.pickups||[]){p.x-=dx;p.z-=dz;}}
}
