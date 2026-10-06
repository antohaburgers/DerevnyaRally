// Add each new filename here once. Optional files live next to index.html.
export const MUSIC_TRACKS=['music1.mp3','music2.mp3','music3.mp3','music4.mp3'];
export const MUSIC_CONFIG={volume:.096,duckVolume:.036,duckSeconds:.55};
export class MusicPlayer{
 constructor(engine,tracks=MUSIC_TRACKS,makeAudio=()=>new Audio(),random=Math.random){this.engine=engine;this.tracks=tracks;this.random=random;this.failed=new Set();this.previous=null;this.current=null;this.unlocked=false;this.retry=false;this.duckUntil=0;this.audio=null;this.pending=false;this.generation=0;try{this.audio=makeAudio();this.audio.preload='none';this.audio.loop=false;this.audio.volume=MUSIC_CONFIG.volume;this.audio.addEventListener('ended',()=>this.next());this.audio.addEventListener('error',()=>this.fail());}catch{} }
 unlock(){if(!this.audio)return;this.unlocked=true;if(this.engine.enabled){if(this.current){this.retry=false;this.play();}else this.next();}}
 candidates(){const available=this.tracks.filter(t=>!this.failed.has(t));return available.length>1?available.filter(t=>t!==this.previous):available;}
 next(){if(!this.unlocked||!this.audio||!this.engine.enabled)return;const options=this.candidates();if(!options.length){this.current=null;this.audio.pause();return;}const chosen=options[Math.min(options.length-1,Math.floor(this.random()*options.length))];this.current=chosen;this.generation++;this.pending=false;this.audio.src=new URL(chosen,globalThis.location?.href||'http://localhost/').href;this.play();}
 play(){if(this.pending)return;this.pending=true;const generation=this.generation;try{const p=this.audio.play();p?.then(()=>{if(generation!==this.generation)return;this.pending=false;this.previous=this.current;this.retry=false;}).catch(error=>{if(generation!==this.generation)return;this.pending=false;if(error?.name==='AbortError')return;if(error?.name==='NotAllowedError'){this.retry=true;return;}this.fail();});if(!p?.then)this.pending=false;}catch{this.pending=false;this.fail();}}
 fail(){this.pending=false;if(!this.current)return;this.failed.add(this.current);this.current=null;this.next();}
 event(event){if(['TREE_HIT','HOUSE_HIT','TRAFFIC_HIT','HARD_LANDING','ROLLOVER_IMPACT','BEER_USE'].includes(event.type))this.duckUntil=Date.now()/1000+MUSIC_CONFIG.duckSeconds;}
 update(){if(!this.audio)return;this.audio.volume=Date.now()/1000<this.duckUntil?MUSIC_CONFIG.duckVolume:MUSIC_CONFIG.volume;if(!this.engine.enabled||globalThis.document?.hidden){if(!this.audio.paused)this.audio.pause();}else if(this.unlocked&&this.audio.paused&&this.current&&!this.retry)this.play();}
}
