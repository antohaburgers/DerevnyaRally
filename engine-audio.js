// Browser-local four-cylinder pulse synthesis, no external audio assets.
export class EngineAudio{
 constructor(button,autoUnlock=true){this.button=button;this.enabled=true;this.started=false;button.textContent='ЗВУК ON';button.addEventListener('click',()=>this.toggle());if(autoUnlock){document.addEventListener('pointerdown',()=>this.start());document.addEventListener('keydown',()=>this.start());}document.addEventListener('visibilitychange',()=>{if(!this.ctx)return;if(document.hidden)this.ctx.suspend().catch(()=>{});else if(this.enabled)this.ctx.resume().catch(()=>{});});}
 async start(){if(this.started){if(this.ctx.state==='suspended'&&this.enabled)await this.ctx.resume().catch(()=>{});return;}const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){this.button.textContent='БЕЗ ЗВУКА';return;}try{this.ctx=new Audio();const a=this.ctx;this.master=a.createGain();this.master.gain.value=this.enabled?.09:0;this.master.connect(a.destination);const filter=a.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;filter.Q.value=.65;filter.connect(this.master);this.filter=filter;const shaper=a.createWaveShaper(),curve=new Float32Array(256);for(let i=0;i<256;i++)curve[i]=Math.tanh((i/127.5-1)*2.5)*.65;shaper.curve=curve;shaper.connect(filter);this.pulse=a.createOscillator();const real=new Float32Array(18),imag=new Float32Array(18);for(let i=1;i<18;i++)imag[i]=(i%2?1:.58)/i;this.pulse.setPeriodicWave(a.createPeriodicWave(real,imag));const gain=a.createGain();gain.gain.value=.32;this.pulse.connect(gain).connect(shaper);this.crank=a.createOscillator();this.crank.type='triangle';const crankGain=a.createGain();crankGain.gain.value=.13;this.crank.connect(crankGain).connect(shaper);this.pulse.frequency.value=28.3;this.crank.frequency.value=14.2;this.pulse.start();this.crank.start();const buffer=a.createBuffer(1,a.sampleRate*2,a.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.5;const noise=a.createBufferSource();noise.buffer=buffer;noise.loop=true;const band=a.createBiquadFilter();band.type='bandpass';band.frequency.value=850;band.Q.value=.5;this.noiseGain=a.createGain();this.noiseGain.gain.value=.015;noise.connect(band).connect(this.noiseGain).connect(this.master);noise.start();this.turboOsc=a.createOscillator();this.turboOsc.type='sine';this.turboOsc.frequency.value=850;this.turboGain=a.createGain();this.turboGain.gain.value=0;this.turboOsc.connect(this.turboGain).connect(this.master);this.turboOsc.start();
 // High-revving naturally aspirated four-cylinder buzz, separate from Niva bass.
 this.driftBuzz=a.createOscillator();this.driftBuzz.type='sawtooth';this.driftBuzz.frequency.value=150;
 this.driftBuzzFilter=a.createBiquadFilter();this.driftBuzzFilter.type='bandpass';this.driftBuzzFilter.frequency.value=1400;this.driftBuzzFilter.Q.value=.75;
 this.driftBuzzGain=a.createGain();this.driftBuzzGain.gain.value=0;
 this.driftBuzz.connect(this.driftBuzzFilter).connect(this.driftBuzzGain).connect(this.master);this.driftBuzz.start();
 // A narrow, quiet rear-tyre squeal follows sustained angle and road speed.
 this.driftSkid=a.createOscillator();this.driftSkid.type='triangle';this.driftSkid.frequency.value=710;
 this.driftSkidGain=a.createGain();this.driftSkidGain.gain.value=0;
 this.driftSkid.connect(this.driftSkidGain).connect(this.master);this.driftSkid.start();
 this.started=true;await a.resume();this.button.textContent=this.enabled?'ЗВУК ON':'ЗВУК OFF';this.button.setAttribute('aria-pressed',String(this.enabled));}catch{this.button.textContent='ЗВУК ON';}}
 async toggle(){if(!this.started){await this.start();return;}this.enabled=!this.enabled;if(this.enabled)await this.ctx.resume().catch(()=>{});this.master.gain.setTargetAtTime(this.enabled?.12:0,this.ctx.currentTime,.09);this.button.textContent=this.enabled?'ЗВУК ON':'ЗВУК OFF';this.button.setAttribute('aria-pressed',String(this.enabled));}
 update(state,wheels=[]){if(!this.started||this.ctx.state!=='running')return;const now=this.ctx.currentTime,running=state.engineRunning!==false,rpm=state.currentRPM;const drift=!!state.driftCar;
 this.pulse.frequency.setTargetAtTime(rpm/(drift?25:30),now,drift?.025:.055);
 this.crank.frequency.setTargetAtTime(rpm/(drift?38:60)*.99,now,drift?.04:.07);
 this.filter.frequency.setTargetAtTime(drift?1050+rpm*.23+state.throttle*1050:380+rpm*.16+state.throttle*650,now,.065);
 if(this.driftSkid){
  const slide=Math.min(1,Math.max(0,(Math.abs(state.driftAngle||0)-.13)*1.8));
  const moving=Math.min(1,Math.max(0,((state.vehicleSpeed||0)-18)/45));
  this.driftSkid.frequency.setTargetAtTime(710+Math.min(180,(state.vehicleSpeed||0)*1.7)+slide*220,now,.08);
  this.driftSkidGain.gain.setTargetAtTime(this.enabled&&running&&drift?slide*moving*.028:0,now,.07);
 }
 if(this.driftBuzz){
  this.driftBuzz.frequency.setTargetAtTime(rpm/19,now,.035);
  this.driftBuzzFilter.frequency.setTargetAtTime(700+rpm*.22,now,.05);
  this.driftBuzzGain.gain.setTargetAtTime(this.enabled&&running&&drift?.095*(.3+state.throttle*.7):0,now,.08);
 }this.noiseGain.gain.setTargetAtTime(.013+state.throttle*.035+state.load*.016+Math.min(.022,(state.vehicleSpeed||0)*.00025)*wheels.filter(w=>w.contact&&w.surfaceType!=='ASPHALT').length/4,now,.1);this.master.gain.setTargetAtTime(this.enabled&&running?(.09+state.throttle*.055):0,now,.08);if(this.turboOsc){const boost=Math.max(0,Math.min(.65,state.turboBoost||0));this.turboOsc.frequency.setTargetAtTime(710+rpm*.2+boost*900,now,.04);this.turboGain.gain.setTargetAtTime(this.enabled&&running&&state.turboInstalled?boost*.03:0,now,.08);}}
}
