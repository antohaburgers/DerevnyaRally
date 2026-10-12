import test from 'node:test';
import assert from 'node:assert/strict';
import {MusicPlayer,discoverTracks,MUSIC_POOLS} from '../music.js';
test('arena discovers gaps and uppercase optional music without confusing race tracks',async()=>{
 const files=await discoverTracks({...MUSIC_POOLS.ARENA,maxTracks:5},async url=>({ok:/arena(1\.mp3|3\.MP3|5\.mp3)$/.test(url),headers:{get:()=> 'audio/mpeg'}}));assert.deepEqual(files,['arena1.mp3','arena3.MP3','arena5.mp3']);
 assert.deepEqual(await discoverTracks({prefix:'arena',maxTracks:2},async()=>{throw Error('offline');}),[]);
});
test('stopping arena invalidates asynchronous discovery and does not restart audio',async()=>{
 const previous=globalThis.fetch;let resolve;const gate=new Promise(r=>resolve=r);globalThis.fetch=()=>gate;const audio={paused:true,addEventListener(){},pause(){this.paused=true;},play(){this.paused=false;return Promise.resolve();}};const m=new MusicPlayer({enabled:true},[],()=>audio);m.unlocked=true;const loading=m.setPool('CIRCUIT_START');m.stop();resolve({ok:false});globalThis.fetch=async()=>({ok:false});await loading;assert.equal(m.suspended,true);assert.equal(m.current,null);assert.equal(audio.paused,true);globalThis.fetch=previous;
});
