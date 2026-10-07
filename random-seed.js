// Gameplay gets a fresh world. Reproducible seeds are accepted only in debug.
export function randomSeed(previous){let seed;try{const values=new Uint32Array(1);globalThis.crypto.getRandomValues(values);seed=values[0];}catch{seed=(Date.now()^Math.floor(Math.random()*0x100000000))>>>0;}if(seed===previous)seed=(seed+0x9e3779b9)>>>0;return seed;}
export function initialSeed(parameters){const value=parameters.get('seed');return parameters.has('debug')&&value!==null&&/^\d+$/.test(value)?Number(value)>>>0:randomSeed();}
