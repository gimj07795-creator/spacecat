(()=>{let ctx,musicGain,fxGain,timer=null,pageActive=true,nextBeat=0,step=0,lastVoice=-1,lastDoor=-1;const config={music:true,effects:true};try{Object.assign(config,JSON.parse(localStorage.getItem('space-cat-audio'))||{})}catch{}
function tone(freq,start,duration,volume,bus,type='sine',end=freq){if(!ctx)return;const osc=ctx.createOscillator(),amp=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,start);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),start+duration);amp.gain.setValueAtTime(.0001,start);amp.gain.exponentialRampToValueAtTime(volume,start+Math.min(.06,duration*.2));amp.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(amp);amp.connect(bus);osc.start(start);osc.stop(start+duration+.02);osc.onended=()=>{osc.disconnect();amp.disconnect()}}
function music(){if(!ctx||ctx.state!=='running'||!config.music||document.hidden||ctx.currentTime<nextBeat)return;nextBeat=ctx.currentTime+1.4;const chords=[[130.81,164.81,196,246.94],[110,130.81,164.81,220],[87.31,130.81,174.61,220],[98,146.83,196,246.94]],chord=chords[Math.floor(step/4)%4],t=ctx.currentTime+.04;if(step%4===0)for(const hz of chord)tone(hz,t,5,.035,musicGain);const melody=[2,1,3,2,0,2,1,3];tone(chord[melody[step%8]]*2,t,1.8,.035,musicGain,'sine');if(step%2===0)tone(chord[0]/2,t,2,.045,musicGain);step++}
function sync(){if(ctx){musicGain.gain.setTargetAtTime(config.music?.95:0,ctx.currentTime,.1);fxGain.gain.setTargetAtTime(config.effects?.55:0,ctx.currentTime,.03)}for(const k of['music','effects']){const b=document.getElementById(k==='music'?'musicToggle':'sfxToggle');if(b){b.textContent=(k==='music'?'BGM':'효과음')+' '+(config[k]?'ON':'OFF');b.setAttribute('aria-pressed',String(config[k]))}}}
async function unlock(){try{if(!pageActive)return;if(!ctx){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;ctx=new Audio();musicGain=ctx.createGain();fxGain=ctx.createGain();musicGain.connect(ctx.destination);fxGain.connect(ctx.destination);sync()}if(timer===null)timer=setInterval(music,150);if(ctx.state!=='running')await ctx.resume();if(pageActive)music()}catch{}}
function fx(kind,index=0){if(!ctx||ctx.state!=='running'||!config.effects||document.hidden)return;const t=ctx.currentTime;if(kind==='voice'){if(t-lastVoice<.1)return;lastVoice=t;tone(280+index*43,t,.075,.035,fxGain,'triangle',340+index*43);return}if(kind==='door'){if(t-lastDoor<.3)return;lastDoor=t;tone(90,t,.45,.09,fxGain,'triangle',360);tone(600,t+.25,.12,.035,fxGain);return}const sounds={click:[660,880],water:[523,784,1047],cargo:[196,294,392],photo:[1400,700,1100],repair:[220,330,440,660],arrival:[440,660,880]};const notes=sounds[kind]||sounds.click;notes.forEach((f,i)=>tone(f,t+i*.1,kind==='click'?.055:.22,kind==='click'?.05:.09,fxGain,kind==='cargo'?'triangle':'sine'))}
function toggle(k){config[k]=!config[k];sync();try{localStorage.setItem('space-cat-audio',JSON.stringify(config))}catch{}if(config[k]){if(k==='music')nextBeat=0;unlock()}}
globalThis.SpaceCatAudio={unlock,fx,toggle};document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock,{passive:true});document.addEventListener('click',e=>{unlock();if(e.target.closest('button'))fx('click')},true);document.getElementById('musicToggle').onclick=()=>toggle('music');document.getElementById('sfxToggle').onclick=()=>toggle('effects');document.addEventListener('visibilitychange',()=>{if(ctx&&!document.hidden){nextBeat=0;unlock()}});
globalThis.addEventListener('pagehide',()=>{
  pageActive=false;
  if(timer!==null)clearInterval(timer);
  timer=null;
  if(ctx?.state==='running')ctx.suspend().catch(()=>{});
});
globalThis.addEventListener('pageshow',()=>{
  if(pageActive)return;
  pageActive=true;
  if(ctx){nextBeat=0;unlock()}
});
sync();})();
