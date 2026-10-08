// Decal geometry: only metal panels of the current Niva shell, never glazing or wheel openings.
export const LIVERY_ASSETS=Object.freeze({"beer":"./assets/liveries/beer.svg","anime":"./assets/liveries/anime.svg","expedition":"./assets/liveries/expedition.svg","mud":"./assets/liveries/mud.svg","soviet":"./assets/liveries/soviet.svg","wolf":"./assets/liveries/wolf.svg","schnauzer":"./assets/liveries/schnauzer.svg","night":"./assets/liveries/night.svg","tractor":"./assets/liveries/tractor.svg","cyber":"./assets/liveries/cyber.svg"});
export const LIVERY_CATALOG=Object.freeze([{"id":"none","name":"Без ливреи","tag":"Чистый кузов"},{"id":"beer","name":"Beer Rally","tag":"Пиво и ралли"},{"id":"anime","name":"Anime Itasha","tag":"Аниме-тян и JDM"},{"id":"expedition","name":"Expedition","tag":"Экспедиция"},{"id":"mud","name":"Mud Monster","tag":"Грязевой монстр"},{"id":"soviet","name":"Soviet Rally","tag":"Советский спорт"},{"id":"wolf","name":"Taiga Wolf","tag":"Волк и тайга"},{"id":"schnauzer","name":"Schnauzer Team","tag":"Боевой шнауцер"},{"id":"night","name":"Night Runner","tag":"Ночная гонка"},{"id":"tractor","name":"Tractor Team","tag":"Колхозный автоспорт"},{"id":"cyber","name":"Cyber Niva","tag":"Кибер-Нива"}]);
export const LIVERY_COUNT=LIVERY_CATALOG.length-1;
export const BODY_DECAL=Object.freeze({
 halfWidth:.84,offset:.009,top:1.067,bottom:.605,minZ:-1.76,maxZ:1.77,
 archCenters:[-1.1,1.1],archRadius:.515,archMargin:.075,segmentsPerMeter:36,
 panels:[[-1.745,-.585],[-.555,.545],[.575,1.745]]
});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function safeLowerEdge(z){
 let low=BODY_DECAL.bottom;
 for(const centre of BODY_DECAL.archCenters){
  const d=Math.abs(z-centre),r=BODY_DECAL.archRadius+BODY_DECAL.archMargin;
  if(d<r)low=Math.max(low,.44+Math.sqrt(r*r-d*d)+.014);
 }
 return low;
}
export function isInSafeDecalZone(z,y){
 return BODY_DECAL.panels.some(([a,b])=>z>=a-1e-4&&z<=b+1e-4)&&y>=safeLowerEdge(z)-1e-4&&y<=BODY_DECAL.top+1e-4;
}
export function createSideDecalGeometry(side){
 if(side!==1&&side!==-1)throw Error('side must be +1 or -1');
 const p=[],uv=[],d=BODY_DECAL;
 const emit=(z,y)=>{
  p.push(side*(d.halfWidth+d.offset),y,z);
  uv.push(clamp(side===1?(d.maxZ-z)/(d.maxZ-d.minZ):(z-d.minZ)/(d.maxZ-d.minZ),0,1),clamp((d.top-y)/(d.top-d.bottom),0,1));
 };
 const tri=(a,b,c)=>{emit(...a);emit(...b);emit(...c);};
 for(const [a,b] of d.panels){
  const steps=Math.ceil((b-a)*d.segmentsPerMeter);
  for(let i=0;i<steps;i++){
   const z0=a+(b-a)*i/steps,z1=a+(b-a)*(i+1)/steps;
   const low=Math.max(safeLowerEdge(z0),safeLowerEdge((z0+z1)*.5),safeLowerEdge(z1));
   if(low>=d.top-.018)continue;
   const p0=[z0,low],p1=[z1,low],p2=[z1,d.top],p3=[z0,d.top];
   if(side===1){tri(p0,p1,p2);tri(p0,p2,p3);}else{tri(p2,p1,p0);tri(p3,p2,p0);}
  }
 }
 return{positions:new Float32Array(p),uv:new Float32Array(uv),count:p.length/3};
}
export function liveryAsset(key){return LIVERY_ASSETS[key]||null;}
