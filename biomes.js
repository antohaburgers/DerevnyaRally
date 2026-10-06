export const BIOME_CONFIG={transition:110,lengths:{FOREST:[550,850],FIELD:[550,850],VILLAGE:[230,330]},names:['ЗАЛУПОВКА','КАТЫШКА','МУХОСРАНСКОЕ','КИСЛАЯ ПИСЬКА','БОЛЬШИЕ ПУПЫРКИ','ПЕРДЯЕВО']};
export class BiomeStream{
 constructor(seed){this.rng=(seed^0x9e3779b9)>>>0;this.type='FOREST';this.previous='FOREST';this.start=0;this.id=0;this.next=650;this.name='';}
 random(){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return this.rng/4294967296;}
 sample(distance){if(distance>=this.next){this.previous=this.type;this.type=this.type==='VILLAGE'?'FIELD':this.type==='FOREST'?'FIELD':this.random()<.6?'VILLAGE':'FOREST';this.start=distance;this.id++;const lengths=BIOME_CONFIG.lengths[this.type];this.next=distance+lengths[0]+this.random()*(lengths[1]-lengths[0]);if(this.type==='VILLAGE')this.name=BIOME_CONFIG.names[Math.floor(this.random()*BIOME_CONFIG.names.length)];}return{type:this.type,previous:this.previous,start:this.start,id:this.id,name:this.name};}
}
export function biomeWeights(profile,distance){let t=Math.max(0,Math.min(1,(distance-profile.start)/BIOME_CONFIG.transition));t=t*t*(3-2*t);const weights={FOREST:0,FIELD:0,VILLAGE:0};weights[profile.previous]+=1-t;weights[profile.type]+=t;return weights;}
export function fieldTone(profile,distance){const w=biomeWeights(profile,distance);return w.FIELD+w.VILLAGE*.3;}
export function populateVillage(world,section){const p=section.biomeProfile;if(p.type!=='VILLAGE')return;const count=Math.max(3,Math.min(8,Math.ceil(section.length/27))),span=section.length;
 function place(kind,u,lateral,extra){const pt=world.point(section,u),width=section.nodes[Math.floor(u*(section.nodes.length-1))].width;return{kind,u,x:pt.x+Math.cos(pt.yaw)*lateral,z:pt.z-Math.sin(pt.yaw)*lateral,y:pt.y+.025*Math.max(0,Math.abs(lateral)-width/2),rotation:pt.yaw,broken:false,...extra};}
 for(let i=0;i<count;i++){const u=.18+(i+.5)/count*.62,side=i%2?1:-1,variant=Math.floor(world.random()*4),width=4+world.random()*2,depth=4+world.random()*2,offset=side*(section.width/2+11+world.random()*5);section.decorations.push(place('house',u,offset,{variant,side,width,depth,height:2.5+world.random()*.7}));
 const fenceOffset=side*(section.width/2+5.5);for(let j=0;j<3;j++){const fu=Math.max(.06,Math.min(.94,u+(j-1)*3.3/span));section.decorations.push(place('fence',fu,fenceOffset,{width:3,height:1.1,radius:1.55}));}}
 if(!world.sections.at(-1)||world.sections.at(-1).biomeProfile.id!==p.id){section.decorations.push(place('sign',.10,section.width/2+2.3,{text:p.name,width:3.8,height:.85,radius:.20}));}
}

// Field dressing is generated once per section, never each frame.
export function populateField(world,section){
 if(section.biomeProfile.type!=='FIELD')return;
 const groups=1+Math.floor(world.random()*2);
 for(let g=0;g<groups;g++){const u=.22+world.random()*.55,pt=world.point(section,u),side=world.random()<.5?-1:1,offset=side*(section.width/2+7+world.random()*20),variant=world.random()<.7?'round':'square',count=1+Math.floor(world.random()*3);
 for(let i=0;i<count;i++){const lateral=offset+side*i*2.4,x=pt.x+Math.cos(pt.yaw)*lateral,z=pt.z-Math.sin(pt.yaw)*lateral;section.decorations.push({kind:'hay',variant,x,z,y:world.height(x,z),rotation:pt.yaw+world.random()*.4,width:variant==='round'?1.65:2.2,depth:1.55,height:variant==='round'?1.65:1.25,broken:false});}}
}
