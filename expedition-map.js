// Finite, deterministic 2D world planner for the expedition mode.
// No WebGL or DOM dependencies; the existing 3D renderer will consume active tiles.
export const EXPEDITION_MAP_CONFIG = Object.freeze({
  width: 3000,
  length: 6000,
  tileSize: 128,
  activeRadius: 2,        // 5 x 5 nearby square tiles, independent of map size
  roadWidth: 6.8,
  seed: 731024
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => t * t * (3 - 2 * t);
const sq = n => n * n;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function hash(x, z, seed) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + (seed >>> 0)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, z, wavelength, seed) {
  const ax = Math.floor(x / wavelength), az = Math.floor(z / wavelength);
  const tx = smooth(x / wavelength - ax), tz = smooth(z / wavelength - az);
  const a = hash(ax, az, seed), b = hash(ax + 1, az, seed);
  const c = hash(ax, az + 1, seed), d = hash(ax + 1, az + 1, seed);
  return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
}
function rng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
function pointSegment(x, z, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
  const px = a.x + dx * t, pz = a.z + dz * t;
  return { x: px, z: pz, t, distance: Math.hypot(x - px, z - pz) };
}

export class ExpeditionMap {
  constructor(seed = EXPEDITION_MAP_CONFIG.seed, options = {}) {
    this.config = { ...EXPEDITION_MAP_CONFIG, ...options };
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = Number(seed) >>> 0;
    this.nodes = [];
    this.roads = [];
    this.segmentBins = new Map();
    this.tiles = new Map();
    this.activeTiles = [];
    this.discovered = new Set();
    this.collected = new Set();
    this.destroyedDecor = new Set();
    this.cargo = 12;
    this.delivered = false;
    this.generateNetwork();
    this.generateLandmarks();
    this.update(this.start.x, this.start.z);
    return this;
  }

  bounds(x, z) {
    return Math.abs(x) <= this.config.width / 2 && Math.abs(z) <= this.config.length / 2;
  }

  river(x) {
    const center = 110 + 100 * Math.sin(x / 390) + 42 * Math.sin(x / 120 + 1.7);
    const halfWidth = 35 + 14 * noise(x, 0, 310, this.seed ^ 301);
    return { center, halfWidth };
  }

  riverDepth(x, z) {
    const r=this.river(x), t=Math.abs(z-r.center)/r.halfWidth;
    if(t>=1)return 0;
    // Smooth ford transitions, never a vertical wall at a portal edge.
    const shallow=Math.exp(-sq((x+770)/100)),deep=Math.exp(-sq((x-80)/95));
    return (1-t*t)*(1.55-1.13*shallow-.83*deep);
  }

  baseHeight(x,z) {
    const progress=clamp((2700-z)/5500,0,1);
    const hills=(noise(x,z,420,this.seed^81)-.5)*(12+progress*24)
      +(noise(x,z,110,this.seed^82)-.5)*(2+progress*5);
    const valley=smooth(clamp(Math.abs(z-this.river(x).center)/190,0,1));
    return 3+hills*valley;
  }

  terrainHeight(x,z) {
    const r=this.river(x), depth=this.riverDepth(x,z), road=this.roadAt(x,z);
    const span=Math.abs(z-r.center), bank=smooth(clamp((span-r.halfWidth)/18,0,1));
    let h=depth>0?3-depth:3+(this.baseHeight(x,z)-3)*bank;
    if(road) {
      const influence=smooth(clamp((road.road.width/2+2-road.distance)/2,0,1));
      const progress=road.road.difficulty/4, type=road.road.surface;
      const junction=Math.min(...this.nodes.filter(n=>Math.abs(n.x-x)<15&&Math.abs(n.z-z)<15).map(n=>Math.hypot(n.x-x,n.z-z)),15);
      const fade=smooth(clamp((junction-4)/9,0,1))*influence;
      const lat=road.lateral;
      if(['rutted','muddy','abandoned'].includes(type)) {
        const rut=Math.exp(-sq((Math.abs(lat)-.8)/.34));
        h-=rut*(.10+progress*.27)*fade;
        h+=.06*Math.sin(x*.24+z*.34)*fade;
      }
      if(type==='rocky')h+=fade*(.16+progress*.24)*(Math.sin(x*1.3+z*.65)*.5+Math.cos(z*1.8-x*.5)*.4);
      if(type==='forest')h+=.07*Math.sin(z*1.6+x*.8)*fade;
      if(type==='bridge'&&span<r.halfWidth+28&&Math.abs(lat)<road.road.width/2+1.2) {
        const ramp=smooth(clamp((r.halfWidth+28-span)/20,0,1));
        h=h*(1-ramp)+3.45*ramp;
      }
    }
    // Soft hillside around the finite play area; no clamping to a road corridor.
    const edge=Math.max(Math.abs(x)-1470,Math.abs(z)-2970,0);
    return h+Math.min(80,edge*edge*.008);
  }

  generateNetwork() {
    const random=rng(this.seed^93);
    const add=(x,z,jitter=80)=>{const n={id:this.nodes.length,x:x+(random()-.5)*jitter,z:z+(random()-.5)*jitter};this.nodes.push(n);return n.id;};
    const start=add(-180,2700),v1=add(300,2180),hub=add(-120,1480),east=add(1090,870);
    const bridgeN=add(1200,this.river(1200).center+145,0),bridgeS=add(1200,this.river(1200).center-145,0);
    const v2=add(950,-610),south=add(650,-1390),hubS=add(-260,-2090),goal=add(100,-2730);
    const tires=add(-880,2250),west=add(-1100,1470),suspension=add(-590,1120);
    const winch=add(640,1640),snorkel=add(-100,680),fordN=add(-770,this.river(-770).center+125,0),fordS=add(-770,this.river(-770).center-125,0);
    const deepN=add(80,this.river(80).center+130,0),deepS=add(80,this.river(80).center-130,0);
    const repair=add(-1050,-800),forest=add(-650,-1530),rock=add(170,-1140),fuel=add(1120,-2170);
    const dead1=add(1100,2460),dead2=add(-1280,850),dead3=add(-1220,-2450),dead4=add(1300,-1430);
    const branch=add(750,2550),bog=add(-1150,-220),ridge=add(1180,-2730),mill=add(170,-1850);
    const join=(ia,ib,surface='country',kind='road')=>{
      const a=this.nodes[ia],b=this.nodes[ib],id=this.roads.length;
      const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz),nx=-dz/L,nz=dx/L;
      const widths={gravel:8.2,country:6.7,forest:3.3,rutted:3.9,muddy:5.3,rocky:4.5,abandoned:3.5,bridge:6.0,ford:5.0};
      const winding={gravel:.035,country:.08,forest:.19,rutted:.13,muddy:.10,rocky:.15,abandoned:.21,bridge:0,ford:0}[surface];
      const controls=[a];
      for(let j=1;j<5;j++){const t=j/5,bend=(random()-.5)*2*L*winding*Math.sin(Math.PI*t);controls.push({x:a.x+dx*t+nx*bend,z:a.z+dz*t+nz*bend});}controls.push(b);
      const path=[a];
      for(let i=0;i<controls.length-1;i++){
        const p0=controls[Math.max(0,i-1)],p1=controls[i],p2=controls[i+1],p3=controls[Math.min(controls.length-1,i+2)];
        const steps=Math.max(3,Math.ceil(distance(p1,p2)/8));
        for(let j=1;j<=steps;j++){const t=j/steps,t2=t*t,t3=t2*t,cat=k=>.5*(2*p1[k]+(p2[k]-p0[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);path.push(j===steps&&i===controls.length-2?b:{x:cat('x'),z:cat('z')});}
      }
      const road={id,from:ia,to:ib,kind,surface,path,width:widths[surface]*(.94+random()*.12),difficulty:Math.min(4,Math.floor(clamp((2700-Math.min(a.z,b.z))/5500,0,1)*5)),length:path.slice(1).reduce((n,p,i)=>n+distance(path[i],p),0)};
      this.roads.push(road);
      for(let i=0;i<path.length-1;i++){
        const a=path[i],b=path[i+1],segment={road,a,b,part:i},pad=24,size=this.config.tileSize;
        for(let cx=Math.floor((Math.min(a.x,b.x)-pad)/size);cx<=Math.floor((Math.max(a.x,b.x)+pad)/size);cx++)for(let cz=Math.floor((Math.min(a.z,b.z)-pad)/size);cz<=Math.floor((Math.max(a.z,b.z)+pad)/size);cz++){
          const key=cx+':'+cz;if(!this.segmentBins.has(key))this.segmentBins.set(key,[]);this.segmentBins.get(key).push(segment);
        }
      }
    };
    // A long firm east-bank route, short west ford, and technical centre loop.
    for(const [a,b] of [[start,v1],[v1,hub],[hub,east],[east,bridgeN],[bridgeS,v2],[v2,south],[south,fuel],[fuel,ridge],[ridge,goal]])join(a,b,'gravel');
    join(bridgeN,bridgeS,'bridge','bridge');
    for(const [a,b,type] of [[start,tires,'country'],[tires,west,'forest'],[west,suspension,'rutted'],[suspension,hub,'country'],[hub,winch,'country'],[winch,east,'forest'],[hub,snorkel,'rutted'],[snorkel,fordN,'muddy'],[west,fordN,'forest'],[fordS,repair,'muddy'],[repair,forest,'rutted'],[forest,hubS,'rocky'],[hubS,goal,'country'],[bridgeS,rock,'rocky'],[rock,south,'rutted'],[rock,hubS,'muddy'],[snorkel,deepN,'rocky'],[deepS,rock,'rocky'],[deepS,repair,'muddy'],[v1,branch,'country'],[branch,dead1,'abandoned'],[branch,winch,'forest'],[suspension,dead2,'abandoned'],[hubS,dead3,'abandoned'],[south,dead4,'abandoned'],[fordS,bog,'muddy'],[bog,repair,'rutted'],[hubS,mill,'forest'],[mill,fuel,'rutted']])join(a,b,type);
    join(fordN,fordS,'ford','ford');join(deepN,deepS,'ford','deep-ford');
    this.start={...this.nodes[start]};this.goal={...this.nodes[goal]};
    this.poiNodes={start,goal,tires,winch,suspension,snorkel,repair,fuel,v1,v2,mill,dead1,dead3};
  }

  generateLandmarks() {
    const p=(id,kind,node,label,upgrade=null)=>({id,kind,label,upgrade,...{x:this.nodes[node].x,z:this.nodes[node].z,nodeId:node}}),n=this.poiNodes;
    this.landmarks=[p('start','depot',n.start,'СКЛАД ПИВА'),p('tires','upgrade',n.tires,'ШИНОМОНТАЖ','tires'),p('winch','upgrade',n.winch,'ЛЕСОПИЛКА','winch'),p('suspension','upgrade',n.suspension,'УСИЛЕННАЯ ПОДВЕСКА','suspension'),p('snorkel','upgrade',n.snorkel,'СТАРЫЙ ГАРАЖ','snorkel'),p('repair','service',n.repair,'РЕМОНТНАЯ БАЗА'),p('fuel','service',n.fuel,'ЗАПРАВКА'),p('village1','village',n.v1,'МАЛЫЕ ПЕНЬКИ'),p('village2','village',n.v2,'ГЛУХОМАНЬ'),p('mill','service',n.mill,'ЛЕСНАЯ МАСТЕРСКАЯ'),p('goal','delivery',n.goal,'ДЕРЕВНЯ БУХАЛОВО')];
  }

  // 2D spatial search: nearby road segments only, not all roads on the map.
  roadAt(x, z) {
    const s = this.config.tileSize, key = Math.floor(x / s) + ':' + Math.floor(z / s);
    const candidates = this.segmentBins.get(key) || [];
    let nearest = null;
    for (const segment of candidates) {
      const pt = pointSegment(x, z, segment.a, segment.b);
      if (!nearest || pt.distance < nearest.distance) {
        nearest = { ...pt, road: segment.road,
          yaw: Math.atan2(segment.b.x - segment.a.x, segment.b.z - segment.a.z),
          lateral:(x-pt.x)*Math.cos(Math.atan2(segment.b.x-segment.a.x,segment.b.z-segment.a.z))-(z-pt.z)*Math.sin(Math.atan2(segment.b.x-segment.a.x,segment.b.z-segment.a.z)) };
      }
    }
    return nearest;
  }

  biomeAt(x, z) {
    if (Math.hypot(x - this.start.x, z - this.start.z) < 145 ||
        Math.hypot(x - this.goal.x, z - this.goal.z) < 190)
      return 'VILLAGE';
    if (this.riverDepth(x, z) > 0) return 'RIVER';
    const n = noise(x, z, 590, this.seed ^ 0x9875);
    return n > 0.61 ? 'FIELD' : n < 0.13 ? 'BOG' : 'FOREST';
  }

  surfaceAt(x, z) {
    const waterDepth = this.riverDepth(x, z), road = this.roadAt(x, z);
    const onRoad = !!road && road.distance < road.road.width / 2;
    const roadType = road?.road.surface ?? 'country', p = road?.road.difficulty ?? 0;
    const biome = !onRoad ? this.biomeAt(x, z) : null;
    const mild = noise(x, z, 38, this.seed ^ 533);
    const strips = Math.sin(x * .71 + z * .42);
    let surfaceType = 'GRASS', mudDepth = 0;
    if (biome === 'BOG' && z<1200) { surfaceType = 'PEAT'; mudDepth = .46; }
    if (onRoad) {
      if (roadType === 'gravel') surfaceType = 'DIRT';
      else if (roadType === 'rocky') surfaceType = strips > -.2 ? 'ROCK' : 'DIRT';
      else if (roadType === 'forest') surfaceType = 'SOFT_DIRT';
      else if (roadType === 'abandoned') { surfaceType='GRASS';mudDepth=.1; }
      else if (roadType === 'rutted') { surfaceType = 'SOFT_DIRT'; mudDepth = .20 + .17 * mild; }
      else if (roadType === 'muddy') { surfaceType = 'MUD'; mudDepth = .28 + mild * .44; }
      else if (roadType === 'bridge') surfaceType = 'DIRT';
      else surfaceType = mild > .62 && p > 1 ? 'MUD' : 'DIRT';
      if (surfaceType === 'MUD') mudDepth = Math.max(mudDepth, .16 + mild * (.3 + .13 * p));
    }
    const onBridge = onRoad && roadType === 'bridge' && Math.abs(z-this.river(x).center)<this.river(x).halfWidth+28;
    if (waterDepth > 0 && !onBridge) {
      surfaceType = 'WATER';
      mudDepth = Math.max(mudDepth, waterDepth * .28);
    }
    return { surfaceType, waterDepth: onBridge ? 0 : waterDepth,
      mudDepth, peatDepth: biome === 'BOG' ? .35 : 0,
      offroadFactor: onRoad ? 0 : 1,
      onRoad, roadType, roadId: road?.road.id ?? null };
  }

  tileAt(cx, cz) {
    const key = cx + ':' + cz;
    if (this.tiles.has(key)) return this.tiles.get(key);
    const size = this.config.tileSize, x0 = cx * size, z0 = cz * size;
    const random = rng((this.seed ^ Math.imul(cx, 2654435761) ^ Math.imul(cz, 1597334677)) >>> 0);
    const center = { x: x0 + size / 2, z: z0 + size / 2 };
    const biome = this.biomeAt(center.x, center.z);
    const terrain = [];
    // One 9x9 height grid for chunk rendering. Physics samples terrainHeight directly.
    for (let row = 0; row <= (this.config.plannerOnly ? -1 : 8); row++) {
      const values = [];
      for (let col = 0; col <= 8; col++)
        values.push(this.terrainHeight(x0 + col * size / 8, z0 + row * size / 8));
      terrain.push(values);
    }
    const foliage = [];
    const count = this.config.plannerOnly ? 0 : biome === 'FOREST' ? 36 : biome === 'FIELD' ? 10 : biome === 'BOG' ? 13 : 5;
    for (let i = 0; i < count; i++) {
      const x = x0 + random() * size, z = z0 + random() * size;
      const nearRoad = this.roadAt(x, z);
      if (!this.bounds(x, z) || nearRoad?.distance < 10 || this.riverDepth(x, z) > 0) continue;
      const id = key + '/' + i;
      foliage.push({
        id, x, z, y: this.terrainHeight(x, z),
        kind: biome === 'FIELD' && random() < .65 ? 'hay' : 'tree',
        scale: 2.3 + random() * 2.5,
        rotation: random() * Math.PI * 2,
        variant: Math.floor(random() * 3)
      });
    }
    const roadIds = new Set();
    const segmentCandidates = this.segmentBins.get(key) || [];
    for (const segment of segmentCandidates) roadIds.add(segment.road.id);
    const tile = { key, cx, cz, x0, z0, size, biome, terrain,
      roadIds: [...roadIds], foliage };
    this.tiles.set(key, tile);
    return tile;
  }

  update(x, z) {
    const s = this.config.tileSize, radius = this.config.activeRadius;
    const cx = Math.floor(x / s), cz = Math.floor(z / s);
    const desired = new Set(), active = [];
    for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
      const tx = cx + dx, tz = cz + dz;
      const centerX = (tx + .5) * s, centerZ = (tz + .5) * s;
      if (Math.abs(centerX)>this.config.width/2+s/2||Math.abs(centerZ)>this.config.length/2+s/2) continue;
      const key = tx + ':' + tz;
      desired.add(key);
      active.push(this.tileAt(tx, tz));
      if(Math.hypot(dx,dz)<=1.5)this.discovered.add(key);
    }
    for (const key of this.tiles.keys()) if (!desired.has(key)) this.tiles.delete(key);
    this.activeTiles = active;
    return { cx, cz, active, nearestRoad: this.roadAt(x, z) };
  }

  visit(x, z, radius = 18) {
    const events = [];
    for (const item of this.landmarks) {
      if (Math.hypot(x - item.x, z - item.z) > radius || this.collected.has(item.id)) continue;
      this.collected.add(item.id);
      if (item.kind === 'upgrade') events.push({ type: 'UPGRADE_FOUND', upgrade: item.upgrade, label: item.label });
      if (item.kind === 'service') events.push({ type: 'SERVICE_FOUND', label: item.label });
      if (item.kind === 'delivery' && this.cargo > 0) {
        this.delivered = true;
        events.push({ type: 'BEER_DELIVERED', crates: this.cargo, label: item.label });
      }
    }
    return events;
  }

  // Pure graph connectivity check; suitable for map QA and route guidance.
  routeExists(from = this.start.id, to = this.goal.id) {
    const adjacent = new Map(this.nodes.map(n => [n.id, []]));
    for (const edge of this.roads) {
      adjacent.get(edge.from).push(edge.to);
      adjacent.get(edge.to).push(edge.from);
    }
    const queue = [from], visited = new Set(queue);
    for (let i = 0; i < queue.length; i++) {
      const node = queue[i];
      if (node === to) return true;
      for (const neighbor of adjacent.get(node) || []) if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
    return false;
  }

  get stats() {
    return { nodes: this.nodes.length, roads: this.roads.length,
      activeTiles: this.activeTiles.length, cachedTiles: this.tiles.size,
      discoveredTiles: this.discovered.size, upgrades: this.collected.size,
      cargo: this.cargo, delivered: this.delivered };
  }
}
