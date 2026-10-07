import {orientation} from './run-state.js?v=023';
export const CHECKPOINT_CONFIG={spacing:40,backtrack:8,history:5,immunity:.8};
export class SafeCheckpoints{
 constructor(world){this.world=world;this.points=[];}
 safe(point,body,traffic){const section=point.section;if(!section||section.crestSafe||['LOG_CROSSING','ROCK_SECTION','RUTS','WASHOUT','BUMP_CHAIN','CHICANE'].includes(section.type))return false;if(body&&(orientation(body.q)!=='NORMAL'||body.wheels.filter(w=>!w.detached).some(w=>!w.contact||w.load<200)||Math.abs(body.v[1])>1.2||Math.abs(point.lateral)>point.width/2-.9))return false;
 const p=this.world.point(section,point.u),surface=this.world.surface(p.x,p.z);if(surface.mudDepth>.16||surface.waterDepth>.025)return false;
 if(section.obstacles.some(o=>Math.abs((o.u-point.u)*section.length)<o.radius+3)||section.localFeatures.some(o=>Math.abs((o.u-point.u)*section.length)<o.longRadius+3))return false;
 if(this.world.sections.some(s=>s.decorations.some(d=>!d.broken&&Math.hypot(d.x-p.x,d.z-p.z)<(d.kind==='house'?Math.hypot(d.width,d.depth)/2+3:d.kind==='fence'?d.width/2+3:3))))return false;
 if(traffic?.active.some(n=>Math.hypot(n.x-p.x,n.z-p.z)<12))return false;return true;}
 remember(point){const p=this.world.point(point.section,point.u);this.points.push({position:[p.x+this.world.offset[0],p.y,p.z+this.world.offset[1]],rotation:p.yaw,roadDirection:p.yaw,progress:point.s,sectionId:point.section.id,u:point.u});if(this.points.length>CHECKPOINT_CONFIG.history)this.points.shift();}
 reset(){this.points=[];const section=this.world.sections[0],u=18/section.length,p=this.world.point(section,u);this.remember({...p,section,u,s:section.startDistance+18});}
 tick(body,traffic){const point=this.world.locate(body.p[0],body.p[2]),last=this.points.at(-1);if(last&&point.s-last.progress<CHECKPOINT_CONFIG.spacing)return;if(this.safe(point,body,traffic))this.remember(point);this.points=this.points.filter(p=>this.world.sections.some(s=>s.id===p.sectionId));}
 target(body,traffic){const current=this.world.locate(body.p[0],body.p[2]);for(const p of [...this.points].reverse()){const section=this.world.sections.find(s=>s.id===p.sectionId);if(section&&p.progress<=current.s-CHECKPOINT_CONFIG.backtrack&&this.safe({section,u:p.u,s:p.progress},null,traffic))return{section,u:p.u};}
 // Checkpoints may expire as chunks unload. Search loaded road behind the car.
 for(let at=Math.max(18,current.s-CHECKPOINT_CONFIG.backtrack);at>=Math.max(18,this.world.sections[0].startDistance+12);at-=6){const section=this.world.sections.find(s=>at>=s.startDistance+12&&at<=s.exitDistance-12);if(!section)continue;const u=(at-section.startDistance)/section.length;if(this.safe({section,u,s:at},null,traffic)){this.remember({section,u,s:at});return{section,u};}}
 const p=this.points.find(p=>{const section=this.world.sections.find(s=>s.id===p.sectionId);return section&&this.safe({section,u:p.u,s:p.progress},null,traffic);});return p?{section:this.world.sections.find(s=>s.id===p.sectionId),u:p.u}:null;}
}
