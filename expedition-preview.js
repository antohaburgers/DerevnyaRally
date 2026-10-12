import {ExpeditionMap} from './expedition-map.js';
const canvas=document.querySelector('#map'),ctx=canvas.getContext('2d',{alpha:false});
const info=document.querySelector('#info'),stats=document.querySelector('#stats');
let map=new ExpeditionMap(731024);
let scale=0.1,panX=0,panY=0,width=1,height=1,dragged=false;
const dpr=()=>Math.min(2,devicePixelRatio||1);
function resize(){
  const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);
  canvas.width=Math.round(width*dpr());canvas.height=Math.round(height*dpr());
  ctx.setTransform(dpr(),0,0,dpr(),0,0);fit();draw();
}
function fit(){
  scale=Math.min((width-38)/map.config.width,(height-38)/map.config.length);
  panX=width/2;panY=height/2;
  draw();
}
function sx(x){return panX+x*scale;}
function sy(z){return panY+z*scale;}
function xy(x,y){return {x:(x-panX)/scale,z:(y-panY)/scale};}
function path(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(sx(p.x),sy(p.z)):ctx.moveTo(sx(p.x),sy(p.z)));}
function draw(){
 ctx.fillStyle='#829c72';ctx.fillRect(0,0,width,height);
 ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
 const left=Math.max(-1500,xy(0,0).x-40),right=Math.min(1500,xy(width,0).x+40);
 const top=Math.max(-3000,xy(0,0).z-40),bottom=Math.min(3000,xy(0,height).z+40);
 const detail=scale>.19?55:scale>.10?90:150;
 for(let z=Math.floor(top/detail)*detail;z<bottom;z+=detail)for(let x=Math.floor(left/detail)*detail;x<right;x+=detail){
   const biome=map.biomeAt(x+detail/2,z+detail/2);
   const light=(map.terrainHeight(x,z)+20)/50;
   ctx.fillStyle=biome==='FOREST'?(light>.5?'#527956':'#4b7051'):biome==='BOG'?'#657966':biome==='VILLAGE'?'#9ca37b':'#a3b48a';
   ctx.fillRect(sx(x),sy(z),detail*scale+1,detail*scale+1);
 }
 // River is one continuous geographical feature, even where roads are absent.
 const step=32;
 ctx.beginPath();for(let x=-1540;x<=1540;x+=step){let r=map.river(x);if(x===-1540)ctx.moveTo(sx(x),sy(r.center-r.halfWidth));else ctx.lineTo(sx(x),sy(r.center-r.halfWidth));}
 for(let x=1540;x>=-1540;x-=step){let r=map.river(x);ctx.lineTo(sx(x),sy(r.center+r.halfWidth));}
 ctx.closePath();ctx.fillStyle='#3b86a5';ctx.fill();ctx.strokeStyle='#b1d8d4';ctx.lineWidth=Math.max(1,2*scale);ctx.stroke();
 for(const road of map.roads){
   path(road.path);ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=Math.max(1,road.width*scale+2);ctx.strokeStyle='#435342';ctx.stroke();
   path(road.path);ctx.lineWidth=Math.max(1,road.width*scale);ctx.strokeStyle=road.difficulty>=3?'#896c4d':'#c5a47c';ctx.stroke();
   if(road.kind==='bridge'||road.kind==='ford'||road.kind==='deep-ford'){const mid=road.path[1];if(scale>.075){ctx.fillStyle=road.kind==='bridge'?'#ead8a9':'#91c5c3';ctx.beginPath();ctx.arc(sx(mid.x),sy(mid.z),4,0,Math.PI*2);ctx.fill();}}
 }
 for(const p of map.landmarks){
   const c={depot:'#e8bd53',upgrade:'#e2ebcf',service:'#e4ad6a',delivery:'#d8a047'}[p.kind];
   const x=sx(p.x),y=sy(p.z),r=Math.max(4,Math.min(10,scale*25));
   ctx.beginPath();ctx.arc(x,y,r+2,0,Math.PI*2);ctx.fillStyle='#163e35';ctx.fill();
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();
   if(scale>.09){ctx.fillStyle='#f5f2d8';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.strokeStyle='#213c30';ctx.lineWidth=3;ctx.strokeText(p.label,x,y-r-7);ctx.fillText(p.label,x,y-r-7);}
 }
 ctx.restore();
 ctx.strokeStyle='#d8e3c6';ctx.lineWidth=2;ctx.strokeRect(sx(-1500),sy(-3000),3000*scale,6000*scale);
 stats.textContent=map.nodes.length+' УЗЛОВ · '+map.roads.length+' ДОРОГ';
}
function inspect(x,y){
  const pt=xy(x,y);
  let nearest=null,distance=Infinity;
  for(const mark of map.landmarks){const d=Math.hypot(pt.x-mark.x,pt.z-mark.z);if(d<distance){distance=d;nearest=mark;}}
  if(nearest&&distance<Math.max(40,18/scale)){info.textContent=nearest.label+(nearest.upgrade?' · УЛУЧШЕНИЕ: '+nearest.upgrade.toUpperCase():nearest.kind==='delivery'?' · ПИВО ДОСТАВЛЕНО!':'');return;}
  const river=map.riverDepth(pt.x,pt.z),road=map.roadAt(pt.x,pt.z);
  info.textContent='X '+Math.round(pt.x)+' · Z '+Math.round(pt.z)+' · '+(river>0?'РЕКА':'БИОМ '+map.biomeAt(pt.x,pt.z))+(road&&road.distance<25?' · '+road.road.kind.toUpperCase():'');
}
const touches=new Map();let pinchDistance=0,pinchScale=scale,pinchCenter=null,last=null;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});last={x:e.clientX,y:e.clientY};dragged=false;if(touches.size===2){const a=[...touches.values()];pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);pinchScale=scale;pinchCenter={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};}});
canvas.addEventListener('pointermove',e=>{if(!touches.has(e.pointerId))return;const r=canvas.getBoundingClientRect();const next={x:e.clientX,y:e.clientY};touches.set(e.pointerId,next);const a=[...touches.values()];if(touches.size===2&&pinchDistance){const dd=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);const center={x:(a[0].x+a[1].x)/2-r.left,y:(a[0].y+a[1].y)/2-r.top};const original=xy(center.x,center.y);scale=Math.max(.035,Math.min(1.5,pinchScale*dd/pinchDistance));panX=center.x-original.x*scale;panY=center.y-original.z*scale;dragged=true;}else if(last){panX+=next.x-last.x;panY+=next.y-last.y;if(Math.hypot(next.x-last.x,next.y-last.y)>1)dragged=true;}last=next;draw();});
canvas.addEventListener('pointerup',e=>{const r=canvas.getBoundingClientRect();if(!dragged)inspect(e.clientX-r.left,e.clientY-r.top);touches.delete(e.pointerId);last=null;if(touches.size<2)pinchDistance=0;});
canvas.addEventListener('pointercancel',e=>{touches.delete(e.pointerId);last=null;pinchDistance=0;});
canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const pt=xy(x,y);scale=Math.max(.035,Math.min(1.5,scale*(e.deltaY>0?.8:1.25)));panX=x-pt.x*scale;panY=y-pt.z*scale;draw();},{passive:false});
document.querySelector('#fit').addEventListener('click',fit);
document.querySelector('#generate').addEventListener('click',()=>{map=new ExpeditionMap(Math.floor(Math.random()*2**32));info.textContent='Новая карта · SEED '+map.seed;fit();});
addEventListener('resize',resize);resize();
