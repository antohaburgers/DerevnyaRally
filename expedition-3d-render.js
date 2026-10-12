// Streaming WebGL renderer. Reuses the exact old vehicle physics and visual poses.
const I=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dot=(a,b)=>a.reduce((v,k,i)=>v+k*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>a.map(v=>v/(Math.hypot(...a)||1));
export function matMul(a,b){const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}
export function matPose(x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,x,y,z,1]);}
function lookAt(eye,target){
 const z=unit(eye.map((v,i)=>v-target[i])),x=unit(cross([0,1,0],z)),y=cross(z,x);
 return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
function projection(fov,aspect){const f=1/Math.tan(fov/2),m=new Float32Array(16),n=.1,F=440;m[0]=f/aspect;m[5]=f;m[10]=(F+n)/(n-F);m[11]=-1;m[14]=2*F*n/(n-F);return m;}
const C={forest:[.25,.36,.26],grass:[.37,.49,.30],field:[.52,.59,.34],bog:[.30,.38,.29],village:[.50,.53,.38],gravel:[.66,.59,.43],country:[.54,.45,.34],forestRoad:[.37,.32,.25],rocky:[.51,.50,.45],muddy:[.31,.25,.20],rutted:[.38,.29,.21],bridge:[.68,.60,.43],ford:[.46,.39,.32],water:[.28,.49,.55],trunk:[.32,.23,.16],leaf:[.19,.35,.22],leaf2:[.25,.41,.25],house:[.65,.55,.42],roof:[.38,.23,.18],hay:[.73,.64,.35],metal:[.24,.26,.25],glass:[.19,.36,.39],murena:[.18,.32,.29],wheel:[.09,.10,.09],rim:[.48,.49,.45],lamp:[.95,.86,.59],beer:[.83,.57,.17]};
function builder(){
 const v=[],tri=(a,b,c,color)=>{const n=unit(cross(b.map((k,i)=>k-a[i]),c.map((k,i)=>k-a[i])));for(const p of [a,b,c])v.push(...p,...n,...color);};
 const quad=(a,b,c,d,color)=>{tri(a,b,c,color);tri(a,c,d,color);};
 const box=(x,y,z,w,h,d,color)=>{const l=x-w/2,r=x+w/2,b=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;
 quad([l,t,n],[l,t,f],[r,t,f],[r,t,n],color);quad([l,b,n],[r,b,n],[r,b,f],[l,b,f],color);
 quad([l,b,n],[l,b,f],[l,t,f],[l,t,n],color);quad([r,b,n],[r,t,n],[r,t,f],[r,b,f],color);
 quad([l,b,f],[r,b,f],[r,t,f],[l,t,f],color);quad([r,b,n],[l,b,n],[l,t,n],[r,t,n],color);};
 const pine=(x,y,z,r,h,color)=>{for(let i=0;i<6;i++){const a=i*Math.PI/3,b=(i+1)*Math.PI/3;
 tri([x+r*Math.cos(a),y,z+r*Math.sin(a)],[x+r*Math.cos(b),y,z+r*Math.sin(b)],[x,y+h,z],color);}};
 return{v,tri,quad,box,pine};
}
function tileGeometry(map,tile){
 const g=builder(),s=tile.size;
 for(let j=0;j<16;j++)for(let i=0;i<16;i++){
  const x=tile.x0+i*8,z=tile.z0+j*8;
  const p=(dx,dz)=>{const xx=x+dx*8,zz=z+dz*8;return[xx,map.terrainHeight(xx,zz),zz];};
  const b=map.biomeAt(x+4,z+4),col=b==='FIELD'?C.field:b==='BOG'?C.bog:b==='VILLAGE'?C.village:C.forest;
  g.quad(p(0,0),p(0,1),p(1,1),p(1,0),col);
 }
 // River crosses the entire open map, not a special road segment.
 for(let x=tile.x0-16;x<tile.x0+s+16;x+=16){
  const a=map.river(x),b=map.river(x+16);
  if(Math.max(a.center+a.halfWidth,b.center+b.halfWidth)<tile.z0-16||
     Math.min(a.center-a.halfWidth,b.center-b.halfWidth)>tile.z0+s+16)continue;
  const y=map.baseHeight(x,a.center)+.55,Y=map.baseHeight(x+16,b.center)+.55;
  g.quad([x,y,a.center-a.halfWidth],[x,y,a.center+a.halfWidth],
    [x+16,Y,b.center+b.halfWidth],[x+16,Y,b.center-b.halfWidth],C.water);
 }
 for(const id of tile.roadIds){
  const road=map.roads[id],w=road.width/2,color=C[road.surface==='forest'?'forestRoad':road.surface]||C.country;
  for(let i=0;i<road.path.length-1;i++){
   const a=road.path[i],b=road.path[i+1],cx=(a.x+b.x)/2,cz=(a.z+b.z)/2;
   if(cx<tile.x0-20||cx>tile.x0+s+20||cz<tile.z0-20||cz>tile.z0+s+20)continue;
   const d=Math.hypot(b.x-a.x,b.z-a.z)||1,nx=-(b.z-a.z)/d,nz=(b.x-a.x)/d;
   const p=(q,l,h=.09)=>{const x=q.x+nx*l,z=q.z+nz*l;return[x,map.terrainHeight(x,z)+h,z];};
   g.quad(p(a,-w),p(b,-w),p(b,w),p(a,w),color);
   if(road.surface==='muddy'||road.surface==='rutted')for(const lane of [-.43,.43]){
    g.quad(p(a,w*(lane-.15),.11),p(b,w*(lane-.15),.11),p(b,w*(lane+.15),.11),p(a,w*(lane+.15),.11),C.muddy);
   }
   if(road.surface==='rocky'&&i%3===0)
    g.quad(p(a,-w*.8,.115),p(b,-w*.8,.115),p(b,-w*.55,.115),p(a,-w*.55,.115),C.gravel);
  }
 }
 for(const f of tile.foliage){
  if(map.destroyedDecor.has(f.id))continue;
  if(f.kind==='hay'){g.box(f.x,f.y+.65,f.z,2.5,1.3,1.9,C.hay);continue;}
  const h=f.scale*.95;g.box(f.x,f.y+h*.35,f.z,.29,h*.7,.29,C.trunk);
  g.pine(f.x,f.y+h*.43,f.z,h*.36,h*.65,C.leaf);
  g.pine(f.x,f.y+h*.78,f.z,h*.27,h*.46,C.leaf2);
 }
 for(const place of map.landmarks){
  if(Math.abs(place.x-(tile.x0+s/2))>s/2+90||Math.abs(place.z-(tile.z0+s/2))>s/2+90)continue;
  for(let j=0;j<5;j++){
   const angle=j*2.4+place.x/800,x=place.x+Math.cos(angle)*(25+j*7),z=place.z+Math.sin(angle)*(25+j*7);
   if(x<tile.x0||x>=tile.x0+s||z<tile.z0||z>=tile.z0+s)continue;
   const y=map.terrainHeight(x,z);
   g.box(x,y+1.3,z,5.6,2.6,5.3,j%2?C.house:C.village);
   g.box(x,y+2.85,z,6.2,.5,5.9,C.roof);
  }
  if(place.x>=tile.x0&&place.x<tile.x0+s&&place.z>=tile.z0&&place.z<tile.z0+s){
   const y=map.terrainHeight(place.x,place.z);
   g.box(place.x,y+1.5,place.z,.35,3,.35,C.metal);
   g.box(place.x,y+3.15,place.z,2.1,.85,.22,place.kind==='delivery'?C.beer:C.lamp);
  }
 }
 return g.v;
}
function nivaGeometry(kit={}){
 const g=builder();
 g.box(0,.94,0,1.67,.92,3.68,C.murena);g.box(0,1.44,-.48,1.51,.77,2.18,C.murena);
 g.box(0,1.81,-.48,1.53,.13,2.2,C.murena);
 g.box(0,1.44,.59,1.40,.51,.06,C.glass);g.box(0,1.44,-1.55,1.40,.48,.06,C.glass);
 for(const k of [-1,1]){
  g.box(k*.775,1.43,-.53,.04,.44,1.62,C.glass);
  g.box(k*.63,.85,1.90,.36,.24,.06,C.lamp);
  g.box(k*.63,.86,-1.92,.28,.24,.05,[.74,.14,.13]);
  g.box(k*.86,1.09,-.20,.16,.21,.22,C.metal);
 }
 g.box(0,.64,1.96,1.77,.16,.17,C.metal);g.box(0,.63,-1.94,1.77,.15,.17,C.metal);
 if(kit.winch)g.box(0,.60,2.23,.64,.33,.39,C.metal);
 if(kit.snorkel){g.box(.9,1.35,.68,.18,.95,.16,C.metal);g.box(.91,1.80,.55,.24,.18,.30,C.metal);}
 if(kit.tires){g.box(0,1.93,-.57,1.49,.12,2.25,C.metal);}
 for(let i=0;i<4;i++)g.box((i%2-.5)*.61,1.03,-1.25+Math.floor(i/2)*.52,.54,.48,.49,C.beer);
 return g.v;
}
function tyreGeometry(kit=false){
 const g=builder(),r=kit?.51:.44;g.box(0,0,0,.33,2*r,2*r,C.wheel);
 for(const k of [-1,1])g.box(k*.175,0,0,.035,.66,.66,C.rim);
 return g.v;
}
function villagerGeometry(){
 const g=builder();
 g.box(0,.90,0,.45,1.0,.34,[.70,.58,.37]);
 g.box(0,1.60,0,.38,.42,.38,[.86,.69,.51]);
 g.box(0,1.89,0,.54,.14,.51,[.39,.29,.19]);
 g.box(-.33,1.17,0,.17,.75,.17,[.69,.57,.38]);
 g.box(.33,1.17,0,.17,.75,.17,[.69,.57,.38]);
 for(const x of [-.15,.15])g.box(x,.25,0,.13,.50,.16,[.32,.36,.33]);
 return g.v;
}
export class ExpeditionRenderer{
 constructor(canvas,map){
  this.canvas=canvas;this.map=map;const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
  if(!gl)throw Error('WEBGL НЕ ПОДДЕРЖИВАЕТСЯ');this.gl=gl;
  const vs='attribute vec3 p;attribute vec3 n;attribute vec3 c;uniform mat4 vp,model;uniform vec3 eye;varying vec3 color;varying float fog;void main(){vec4 w=model*vec4(p,1.);vec3 N=normalize(mat3(model)*n);color=c*(.64+.36*abs(dot(N,normalize(vec3(-.45,1.,.38)))));fog=clamp((distance(w.xyz,eye)-105.)/250.,0.,1.);gl_Position=vp*w;}';
  const fs='precision mediump float;varying vec3 color;varying float fog;void main(){gl_FragColor=vec4(mix(color,vec3(.69,.80,.77),fog),1.);}';
  const shader=(type,code)=>{const q=gl.createShader(type);gl.shaderSource(q,code);gl.compileShader(q);if(!gl.getShaderParameter(q,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(q));return q;};
  const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vs));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
  this.program=prog;gl.useProgram(prog);this.p=gl.getAttribLocation(prog,'p');this.n=gl.getAttribLocation(prog,'n');this.c=gl.getAttribLocation(prog,'c');
  this.uVP=gl.getUniformLocation(prog,'vp');this.uModel=gl.getUniformLocation(prog,'model');this.uEye=gl.getUniformLocation(prog,'eye');
  [this.p,this.n,this.c].forEach(k=>gl.enableVertexAttribArray(k));
  gl.enable(gl.DEPTH_TEST);gl.clearColor(.69,.80,.77,1);
  this.chunks=new Map();this.deliveryTime=null;this.body=this.upload(nivaGeometry());this.tyre=this.upload(tyreGeometry());this.farmer=this.upload(villagerGeometry());
 }
 upload(data){const gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return{b,count:data.length/9};}
 kit(build){this.gl.deleteBuffer(this.body.b);this.gl.deleteBuffer(this.tyre.b);this.body=this.upload(nivaGeometry(build));this.tyre=this.upload(tyreGeometry(build.tires));}
 sync(){
  const active=this.map.activeTiles,keep=new Set(active.map(t=>t.key));
  for(const [key,g] of this.chunks)if(!keep.has(key)){this.gl.deleteBuffer(g.b);this.chunks.delete(key);}
  for(const tile of active){if(!this.chunks.has(tile.key))this.chunks.set(tile.key,this.upload(tileGeometry(this.map,tile)));}
 }
 mesh(m,model){
  const gl=this.gl;if(!m?.count)return;gl.bindBuffer(gl.ARRAY_BUFFER,m.b);
  gl.vertexAttribPointer(this.p,3,gl.FLOAT,false,36,0);gl.vertexAttribPointer(this.n,3,gl.FLOAT,false,36,12);gl.vertexAttribPointer(this.c,3,gl.FLOAT,false,36,24);
  gl.uniformMatrix4fv(this.uModel,false,model);gl.drawArrays(gl.TRIANGLES,0,m.count);
 }
 frame(visual,camera,delivered=false,t=0){
  const gl=this.gl,dpr=Math.min(1.25,window.devicePixelRatio||1),w=Math.max(1,Math.round(this.canvas.clientWidth*dpr)),h=Math.max(1,Math.round(this.canvas.clientHeight*dpr));
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;gl.viewport(0,0,w,h);}
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
  gl.uniformMatrix4fv(this.uVP,false,matMul(projection(1.16,w/h),lookAt(camera.eye,camera.target)));
  gl.uniform3fv(this.uEye,camera.eye);
  for(const mesh of this.chunks.values())this.mesh(mesh,I);
  this.mesh(this.body,visual.matrix);
  for(const w of visual.wheels)if(!w.detached)this.mesh(this.tyre,matPose(w.position[0],w.position[1],w.position[2],visual.yaw+(w.front?w.steer:0)));
  if(delivered){this.deliveryTime??=t;const progress=clamp((t-this.deliveryTime)/2.5,0,1);for(let i=0;i<14;i++){const a=i*Math.PI*2/14+Math.sin(t*.25)*.1;const r=25-15*progress+i%3*2;const x=this.map.goal.x+Math.cos(a)*r,z=this.map.goal.z+Math.sin(a)*r;this.mesh(this.farmer,matPose(x,this.map.terrainHeight(x,z)+Math.abs(Math.sin(t*5+i))*.30,z,-a));}}
 }
}

export {tileGeometry as buildExpeditionTileGeometry};
