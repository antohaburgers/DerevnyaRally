// Low-poly 1980s three-door drift hatchback, styled to match the hand-built Niva.
// Geometry is compiled once; gameplay does not allocate meshes each frame.
export const AE86_STYLE={
 white:[.91,.89,.81],black:[.075,.085,.088],trim:[.17,.19,.19],glass:[.21,.30,.34],
 metal:[.56,.61,.62],tail:[.86,.18,.095],indicator:[.98,.59,.14],
};
export function createAE86Model(extrude,polygonMesh){
 // The two wheel openings are built directly into the car's concave side profile.
 const lower=[[-1.91,.39]];
 for(const center of [-1.18,1.18]){
  const radius=.405,start=Math.asin((.39-.32)/radius);
  for(let i=0;i<=16;i++){const angle=Math.PI-start-(Math.PI-2*start)*i/16;lower.push([center+radius*Math.cos(angle),.32+radius*Math.sin(angle)]);}
 }
 lower.push([1.91,.39],[1.91,.94],[.70,1.02],[.50,1.06],[-1.87,.99]);
 const shell=extrude(lower,1.57);
 const cabin=extrude([[-1.78,.995],[-1.32,1.48],[-.42,1.52],[.57,1.04]],1.40);
 const glass=[];
 for(const side of [-1,1]){
  const x=side*.708;
  glass.push(polygonMesh([[x,1.12,.41],[x,1.43,-.38],[x,1.43,-.53],[x,1.12,-.53]]));
  glass.push(polygonMesh([[x,1.12,-.61],[x,1.42,-.61],[x,1.40,-1.30],[x,1.12,-1.62]]));
  glass.push(polygonMesh([[x+side*.004,1.12,.39],[x+side*.004,1.415,-.39],[x+side*.004,1.415,-.50],[x+side*.004,1.12,-.50]]));
 }
 const frontGlass=polygonMesh([[-.63,1.12,.55],[.63,1.12,.55],[.59,1.46,-.40],[-.59,1.46,-.40]]);
 const backGlass=polygonMesh([[-.61,1.12,-1.73],[.61,1.12,-1.73],[.59,1.43,-1.33],[-.59,1.43,-1.33]]);
 const arches=[];
 for(const side of [-1,1])for(const center of [-1.18,1.18])for(let i=0;i<17;i++){
  const a=.17+i*(Math.PI-.34)/17,b=.17+(i+1)*(Math.PI-.34)/17;
  arches.push(polygonMesh([
   [side*.791,.32+Math.sin(a)*.407,center+Math.cos(a)*.407],
   [side*.791,.32+Math.sin(b)*.407,center+Math.cos(b)*.407],
   [side*.791,.32+Math.sin(b)*.432,center+Math.cos(b)*.432],
   [side*.791,.32+Math.sin(a)*.432,center+Math.cos(a)*.432],
  ]));
 }
 return{shell,cabin,glass,frontGlass,backGlass,arches};
}
