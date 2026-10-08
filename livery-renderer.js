import {createSideDecalGeometry,liveryAsset} from './livery-system.js?v=032';
// Separate WebGL1 texture pipeline: one transparent image, two body-clipped mesh batches.
// Meshes are built once, images are rasterized once, and render uses two draw calls.
export function createLiveryRenderer(gl,compile){
 const vertex=`attribute vec3 decalPosition;
attribute vec2 decalUV;
uniform mat4 decalMVP;
uniform mat4 decalBody;
uniform float decalSide;
varying vec2 vUV;
varying vec3 vWorld;
varying float vLight;
void main(){
 vec4 world=decalBody*vec4(decalPosition,1.0);
 vWorld=world.xyz;
 vUV=decalUV;
 vec3 normal=normalize(mat3(decalBody)*vec3(decalSide,0.,0.));
 vLight=.76+.24*max(dot(normal,normalize(vec3(-.5,1.,.3))),0.);
 gl_Position=decalMVP*vec4(decalPosition,1.0);
}`;
 const fragment=`precision mediump float;
uniform sampler2D decalTex;
uniform vec3 decalDaylight;
uniform float decalAmbient;
uniform vec3 decalFogColor;
uniform vec3 decalEye;
uniform vec2 decalFogLimits;
varying vec2 vUV;
varying vec3 vWorld;
varying float vLight;
void main(){
 vec4 paint=texture2D(decalTex,vUV);
 if(paint.a<.045)discard;
 vec3 lit=paint.rgb*vLight*decalDaylight*max(.30,decalAmbient);
 float fog=smoothstep(decalFogLimits.x,decalFogLimits.y,distance(decalEye,vWorld));
 gl_FragColor=vec4(mix(lit,decalFogColor,fog),paint.a*(1.-fog));
}`;
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Livery shader link failed');
 const uniforms={};
 for(const key of ['decalMVP','decalBody','decalSide','decalTex','decalDaylight','decalAmbient','decalFogColor','decalEye','decalFogLimits'])uniforms[key]=gl.getUniformLocation(program,key);
 const attributes={position:gl.getAttribLocation(program,'decalPosition'),uv:gl.getAttribLocation(program,'decalUV')};
 function makeBuffer(data){const result=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,result);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return result;}
 const panels=[-1,1].map(side=>{const geo=createSideDecalGeometry(side);return{side,count:geo.count,position:makeBuffer(geo.positions),uv:makeBuffer(geo.uv)};});
 const textures=new Map();
 const failed=new Set();
 function loadTexture(key){
  const url=liveryAsset(key);if(!url||textures.has(key)||failed.has(key))return;
  textures.set(key,null);
  const img=new Image();
  img.onload=()=>{
   try{
    // Safari/WebGL1 accepts 2D canvas sources more consistently than raw SVG images.
    const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=208;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('2D canvas unavailable');
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    textures.set(key,t);
   }catch(e){textures.delete(key);failed.add(key);console.warn('Не удалось создать ливрею:',key,e);}
  };
  img.onerror=()=>{textures.delete(key);failed.add(key);console.warn('Ливрея не загрузилась:',url);};
  img.src=url;
 }
 loadTexture('beer');
 function draw(key,mvp,model,environment,eye){
  const texture=textures.get(key);
  if(!texture)return false;
  gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.uniform1i(uniforms.decalTex,0);
  gl.uniformMatrix4fv(uniforms.decalMVP,false,mvp);
  gl.uniformMatrix4fv(uniforms.decalBody,false,model);
  gl.uniform3fv(uniforms.decalDaylight,environment.lightColor);
  gl.uniform1f(uniforms.decalAmbient,environment.ambient);
  gl.uniform3fv(uniforms.decalFogColor,environment.skyHorizon);
  gl.uniform3fv(uniforms.decalEye,eye);
  gl.uniform2f(uniforms.decalFogLimits,environment.fogStart,environment.fogEnd);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  for(const part of panels){
   gl.uniform1f(uniforms.decalSide,part.side);
   gl.bindBuffer(gl.ARRAY_BUFFER,part.position);
   gl.enableVertexAttribArray(attributes.position);
   gl.vertexAttribPointer(attributes.position,3,gl.FLOAT,false,0,0);
   gl.bindBuffer(gl.ARRAY_BUFFER,part.uv);
   gl.enableVertexAttribArray(attributes.uv);
   gl.vertexAttribPointer(attributes.uv,2,gl.FLOAT,false,0,0);
   gl.drawArrays(gl.TRIANGLES,0,part.count);
  }
  gl.depthMask(true);gl.disable(gl.BLEND);
  gl.disableVertexAttribArray(attributes.position);gl.disableVertexAttribArray(attributes.uv);
  return true;
 }
 return{draw,loadTexture,hasTexture:key=>!!textures.get(key),counts:panels.map(p=>p.count)};
}
