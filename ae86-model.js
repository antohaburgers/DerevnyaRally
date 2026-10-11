// Lightweight 1980s three-door drift hatch, +Z is the nose.
// Every panel is generated only once at startup; batched details keep WebGL1 draw calls low.
export const AE86_STYLE={
 white:[.92,.91,.85],black:[.065,.073,.079],trim:[.13,.15,.15],glass:[.19,.28,.34],
 metal:[.72,.76,.75],tail:[.91,.13,.10],indicator:[1,.58,.12],
 lamp:[.96,.96,.83],roof:[.87,.86,.81],rim:[.79,.80,.75]
};
export function createAE86Model(extrude,polygonMesh,mesh){
 const lower=[[-1.94,.40]];
 for(const center of [-1.20,1.20]){
  const r=.382,start=Math.asin((.40-.32)/r);
  for(let i=0;i<=20;i++){const a=Math.PI-start-(Math.PI-2*start)*i/20;lower.push([center+r*Math.cos(a),.32+r*Math.sin(a)]);}
 }
 lower.push([1.94,.40],[1.94,.93],[1.65,1.01],[.66,1.065],[.49,1.075],[-1.75,1.02],[-1.94,.98]);
 const shell=extrude(lower,1.57);
 const cabin=extrude([[-1.78,1.025],[-1.31,1.48],[-.41,1.51],[.60,1.065]],1.40);
 const roof=polygonMesh([[-.695,1.517,-1.32],[.695,1.517,-1.32],[.695,1.532,-.40],[-.695,1.532,-.40]]);
 const bonnet=polygonMesh([[-.725,1.078,.63],[0,1.107,.63],[.725,1.078,.63],[.725,1.019,1.85],[0,1.042,1.85],[-.725,1.019,1.85]]);
 const glass=[];
 for(const side of [-1,1]){
  const x=side*.706;
  // Rear quarter + the single long driver/passenger window, with solid B-pillar gap.
  glass.push(polygonMesh([[x,1.102,-1.68],[x,1.435,-1.275],[x,1.435,-.56],[x,1.102,-.56]]));
  glass.push(polygonMesh([[x,1.105,-.49],[x,1.468,-.465],[x,1.47,-.405],[x,1.105,.45]]));
 }
 const frontGlass=polygonMesh([[-.639,1.124,.57],[.639,1.124,.57],[.601,1.496,-.39],[-.601,1.496,-.39]]);
 const backGlass=polygonMesh([[-.61,1.107,-1.744],[.61,1.107,-1.744],[.586,1.466,-1.302],[-.586,1.466,-1.302]]);
 const archV=[],archN=[];
 function tri(v,n,a,b,c){const u=b.map((q,i)=>q-a[i]),w=c.map((q,i)=>q-a[i]);let normal=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];const length=Math.hypot(...normal)||1;normal=normal.map(z=>z/length);for(const p of [a,b,c]){v.push(...p);n.push(...normal);}}
 function quad(v,n,a,b,c,d){tri(v,n,a,b,c);tri(v,n,a,c,d);}
 for(const side of [-1,1])for(const center of [-1.20,1.20])for(let i=0;i<18;i++){
  const a=.22+i*(Math.PI-.44)/18,b=.22+(i+1)*(Math.PI-.44)/18;
  const pt=(t,r)=>[side*.793,.32+Math.sin(t)*r,center+Math.cos(t)*r];
  quad(archV,archN,pt(a,.388),pt(b,.388),pt(b,.425),pt(a,.425));
 }
 const arches=mesh(archV,archN);
 // All small details are joined into one mesh per paint, rather than dozens of cube draws.
 const batches={};
 const add=(tone,points)=>{const b=batches[tone]??={v:[],n:[]};quad(b.v,b.n,...points);};
 const box=(tone,x,y,z,w,h,d)=>{
  const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
  add(tone,[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]);
  add(tone,[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]]);
  add(tone,[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]]);
  add(tone,[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]]);
  add(tone,[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]]);
  add(tone,[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]);
 };
 for(const side of [-1,1]){
  const sx=side*.791;
  // Panda livery sits above the tyre openings, with a continuous black door belt.
  add('black',[[sx,.79,-1.90],[sx,.79,1.91],[sx,.938,1.91],[sx,.938,-1.90]]);
  add('trim',[[sx,.742,-.76],[sx,.742,.75],[sx,.752,.75],[sx,.752,-.76]]);
  add('trim',[[sx,1.042,-1.76],[sx,1.042,.55],[sx,1.055,.55],[sx,1.055,-1.76]]);
  // Pillars, door seals, B-pillar, handle, side mirror and indicators.
  box('black',side*.708,1.29,-.525,.017,.40,.071);
  box('trim',side*.796,.928,.51,.012,.23,.014);
  box('trim',side*.796,.915,-.80,.012,.22,.014);
  box('black',side*.814,.967,-.19,.035,.040,.19);
  box('metal',side*.837,.980,-.19,.009,.016,.105);
  box('black',side*.852,1.105,.42,.17,.115,.15);
  box('metal',side*.946,1.115,.431,.012,.073,.096);
  box('indicator',side*.786,.832,1.66,.018,.075,.19);
  // Pop-up-headlight lids stay shut for a clean Trueno profile.
  box('trim',side*.47,1.06,1.48,.45,.010,.39);
  box('white',side*.47,1.072,1.48,.41,.009,.36);
  // Front and rear lighting blocks, with black lamp bezels.
  box('black',side*.53,.867,1.957,.395,.192,.022);
  box('lamp',side*.53,.870,1.972,.325,.095,.018);
  box('indicator',side*.754,.826,1.961,.12,.100,.028);
  box('black',side*.53,.880,-1.953,.55,.192,.023);
  box('tail',side*.53,.887,-1.967,.48,.132,.020);
  box('metal',side*.53,.955,-1.973,.48,.021,.012);
 }
 // Front fascia, bumper, grille, hood crease, rear hatch and slim ducktail.
 box('black',0,.765,1.967,1.18,.135,.034);
 box('trim',0,.686,2.002,1.55,.155,.19);
 box('metal',0,.852,1.992,.21,.045,.020);
 box('black',0,.700,-1.988,1.55,.17,.19);
 box('black',0,.884,-1.979,.24,.12,.027);
 box('metal',0,.882,-1.998,.19,.06,.018);
 box('white',0,1.040,-1.83,1.45,.074,.19);
 box('black',0,1.094,-1.925,1.40,.055,.13);
 // The bonnet and hatch seams are subtle and follow 1980s straight edges.
 for(const side of [-1,1]){
  box('trim',side*.726,1.066,1.23,.011,.012,1.16);
  box('trim',side*.707,1.065,-1.37,.010,.010,.57);
 }
 const details=Object.entries(batches).map(([tone,b])=>({tone,shape:mesh(b.v,b.n)}));
 return{shell,cabin,roof,bonnet,frontGlass,backGlass,glass,arches,details};
}
