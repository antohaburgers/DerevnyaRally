import test from 'node:test';
import assert from 'node:assert/strict';
import { ExpeditionMap, EXPEDITION_MAP_CONFIG } from '../expedition-map.js';

test('3 by 6 km map with a connected road graph and three different crossings', () => {
  const map = new ExpeditionMap(1234);
  assert.equal(map.config.width, 3000);
  assert.equal(map.config.length, 6000);
  assert.ok(map.routeExists());
  assert.ok(map.nodes.length >= 25);
  assert.ok(map.roads.some(road => road.kind === 'bridge'));
  assert.ok(map.roads.some(road => road.kind === 'ford'));
  assert.ok(map.roads.some(road => road.kind === 'deep-ford'));
  assert.ok(map.landmarks.some(item => item.upgrade === 'tires'));
  assert.ok(map.landmarks.some(item => item.upgrade === 'winch'));
  assert.ok(map.landmarks.some(item => item.upgrade === 'snorkel'));
});

test('square chunks are deterministic regardless of visiting order', () => {
  for (const seed of [1, 100, 731024, 4294967295]) {
    const a = new ExpeditionMap(seed), b = new ExpeditionMap(seed);
    a.update(-1000, 2200);
    b.update(800, -2200);
    assert.deepEqual(a.tileAt(3, 7), b.tileAt(3, 7));
    assert.deepEqual(a.landmarks, b.landmarks);
  }
});

test('only nearby chunks remain allocated while crossing the 6 km map', () => {
  const map = new ExpeditionMap(42);
  for (let z = 2850; z >= -2850; z -= 120) {
    map.update(250 * Math.sin(z / 280), z);
    assert.ok(map.stats.activeTiles <= 25);
    assert.equal(map.stats.cachedTiles, map.stats.activeTiles);
  }
  assert.ok(map.stats.discoveredTiles > 25);
});

test('physics sampling is finite and road / water types can be queried anywhere', () => {
  const map = new ExpeditionMap(987);
  for (let x = -1450; x <= 1450; x += 100) {
    for (let z = -2900; z <= 2900; z += 130) {
      assert.ok(Number.isFinite(map.terrainHeight(x, z)));
      const surface = map.surfaceAt(x, z);
      assert.ok(Number.isFinite(surface.waterDepth));
      assert.ok(Number.isFinite(surface.mudDepth));
    }
  }
  assert.equal(map.roadAt(map.start.x, map.start.z).distance, 0);
  assert.ok(map.riverDepth(0, map.river(0).center) > 0);
  assert.equal(EXPEDITION_MAP_CONFIG.activeRadius, 2);
});

test('upgrades and beer delivery are one-shot triggers', () => {
  const map = new ExpeditionMap(314);
  const tire = map.landmarks.find(item => item.upgrade === 'tires');
  assert.equal(map.visit(tire.x, tire.z)[0]?.type, 'UPGRADE_FOUND');
  assert.deepEqual(map.visit(tire.x, tire.z), []);
  const events = map.visit(map.goal.x, map.goal.z);
  assert.deepEqual(events.map(e => e.type), ['BEER_DELIVERED']);
  assert.equal(events[0].crates, 12);
  assert.equal(map.delivered, true);
  assert.deepEqual(map.visit(map.goal.x, map.goal.z), []);
});
