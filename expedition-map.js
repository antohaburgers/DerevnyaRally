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
    const r = this.river(x);
    const span = Math.abs(z - r.center);
    if (span >= r.halfWidth) return 0;
    const profile = Math.max(0, 1 - sq(span / r.halfWidth));
    const shallow = Math.abs(x + 770) < 125 || Math.abs(x - 810) < 115;
    return profile * (shallow ? 0.42 : 1.35);
  }

  terrainHeight(x, z) {
    const north = clamp((2700 - z) / 5500, 0, 1);
    const rolling = (noise(x, z, 450, this.seed ^ 81) - 0.5) * 10
      + (noise(x, z, 115, this.seed ^ 82) - 0.5) * 2.5;
    const valley = Math.max(0, 1 - Math.abs(z - this.river(x).center) / 170);
    return north * 7 + rolling - valley * 3.5 - this.riverDepth(x, z) * 0.8;
  }

  // Fixed road graph: three winding north-south routes joined by crossroads.
  // All positions follow map coordinates, not the order in which tiles are visited.
  generateNetwork() {
    const rows = [2670, 2130, 1600, 1070, 520, -100, -650, -1190, -1740, -2250, -2720];
    const lanes = [-920, 0, 910];
    const nodeRows = [];
    for (let row = 0; row < rows.length; row++) {
      const r = [];
      for (let lane = 0; lane < lanes.length; lane++) {
        const x = lanes[lane] + (hash(row, lane, this.seed ^ 93) - 0.5) * (lane === 1 ? 165 : 115);
        const z = rows[row] + (hash(lane, row, this.seed ^ 39) - 0.5) * 100;
        const node = { id: this.nodes.length, x, z, row, lane };
        this.nodes.push(node);
        r.push(node.id);
      }
      nodeRows.push(r);
    }
    const join = (ia, ib, kind = 'road') => {
      const a = this.nodes[ia], b = this.nodes[ib], id = this.roads.length;
      const dx = b.x - a.x, dz = b.z - a.z;
      const bend = (hash(ia, ib, this.seed ^ 110) - 0.5) * 110;
      const normalLength = Math.hypot(dx, dz) || 1;
      const mid = { x: (a.x + b.x) / 2 - dz / normalLength * bend,
                    z: (a.z + b.z) / 2 + dx / normalLength * bend };
      const path = [a, mid, b];
      const northProgress = clamp((2700 - Math.min(a.z, b.z)) / 5500, 0, 1);
      const road = {
        id, from: ia, to: ib, kind, path,
        width: this.config.roadWidth,
        difficulty: Math.min(4, Math.floor(northProgress * 5)),
        length: distance(a, mid) + distance(mid, b)
      };
      this.roads.push(road);
      for (let part = 0; part < 2; part++) {
        const p = path[part], q = path[part + 1];
        const segment = { road, a: p, b: q, part };
        const pad = this.config.tileSize;
        const minX = Math.floor((Math.min(p.x, q.x) - pad) / pad);
        const maxX = Math.floor((Math.max(p.x, q.x) + pad) / pad);
        const minZ = Math.floor((Math.min(p.z, q.z) - pad) / pad);
        const maxZ = Math.floor((Math.max(p.z, q.z) + pad) / pad);
        for (let cx = minX; cx <= maxX; cx++) for (let cz = minZ; cz <= maxZ; cz++) {
          const key = cx + ':' + cz;
          if (!this.segmentBins.has(key)) this.segmentBins.set(key, []);
          this.segmentBins.get(key).push(segment);
        }
      }
    };
    for (let row = 0; row < rows.length - 1; row++) for (let lane = 0; lane < 3; lane++) {
      const a = nodeRows[row][lane], b = nodeRows[row + 1][lane];
      const r0 = this.nodes[a], r1 = this.nodes[b];
      const crossing = (r0.z - this.river(r0.x).center) * (r1.z - this.river(r1.x).center) <= 0;
      join(a, b, crossing ? (lane === 0 ? 'ford' : lane === 1 ? 'deep-ford' : 'bridge') : 'road');
    }
    for (const row of [0, 2, 3, 5, 7, 8, 10]) for (let lane = 0; lane < 2; lane++)
      join(nodeRows[row][lane], nodeRows[row][lane + 1], 'crossroad');
    // Looping detours between columns: a route is never just one corridor.
    join(nodeRows[1][0], nodeRows[2][1], 'detour');
    join(nodeRows[5][1], nodeRows[6][2], 'detour');
    join(nodeRows[8][0], nodeRows[9][1], 'detour');
    this.start = { ...this.nodes[nodeRows[0][1]] };
    this.goal = { ...this.nodes[nodeRows[10][1]] };
  }

  generateLandmarks() {
    const p = (id, kind, nodeId, label, upgrade = null) => ({
      id, kind, label, upgrade, x: this.nodes[nodeId].x, z: this.nodes[nodeId].z
    });
    const at = (row, lane) => this.nodes.find(n => n.row === row && n.lane === lane).id;
    this.landmarks = [
      p('start', 'depot', at(0, 1), 'СКЛАД ПИВА'),
      p('tires', 'upgrade', at(1, 0), 'ШИНОМОНТАЖ', 'tires'),
      p('winch', 'upgrade', at(3, 2), 'ЛЕСОПИЛКА', 'winch'),
      p('snorkel', 'upgrade', at(4, 1), 'СТАРЫЙ ГАРАЖ', 'snorkel'),
      p('repair', 'service', at(6, 0), 'РЕМОНТНАЯ БАЗА'),
      p('fuel', 'service', at(8, 2), 'ЗАПРАВКА'),
      p('goal', 'delivery', at(10, 1), 'ДЕРЕВНЯ БУХАЛОВО')
    ];
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
          yaw: Math.atan2(segment.b.x - segment.a.x, segment.b.z - segment.a.z) };
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
    const waterDepth = this.riverDepth(x, z);
    const road = this.roadAt(x, z);
    const onRoad = !!road && road.distance <= road.road.width / 2;
    let surfaceType = onRoad ? (road.road.kind === 'bridge' ? 'DIRT' :
      road.road.difficulty >= 3 ? 'SOFT_DIRT' : 'DIRT') : 'GRASS';
    let mudDepth = 0;
    if (!onRoad && this.biomeAt(x, z) === 'BOG') {
      surfaceType = 'PEAT';
      mudDepth = 0.45;
    }
    if (onRoad && road.road.difficulty >= 2) {
      const muddy = noise(x, z, 55, this.seed ^ 533);
      if (muddy > 0.54) { surfaceType = 'MUD'; mudDepth = 0.20 + muddy * 0.55; }
    }
    if (waterDepth > 0 && (!onRoad || road?.road.kind !== 'bridge')) {
      surfaceType = 'WATER';
      mudDepth = Math.max(mudDepth, waterDepth * 0.30);
    }
    return { surfaceType, waterDepth: onRoad && road?.road.kind === 'bridge' ? 0 : waterDepth,
      mudDepth, onRoad, roadId: road?.road.id ?? null };
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
    for (let row = 0; row <= 8; row++) {
      const values = [];
      for (let col = 0; col <= 8; col++)
        values.push(this.terrainHeight(x0 + col * size / 8, z0 + row * size / 8));
      terrain.push(values);
    }
    const foliage = [];
    const count = biome === 'FOREST' ? 36 : biome === 'FIELD' ? 10 : biome === 'BOG' ? 13 : 5;
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
      if (!this.bounds(centerX, centerZ)) continue;
      const key = tx + ':' + tz;
      desired.add(key);
      active.push(this.tileAt(tx, tz));
      this.discovered.add(key);
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
