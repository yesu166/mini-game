type SoundName='place'|'clear'|'combo'|'bloom'|'win'|'over'|'tap';
type AudioWindow=Window&{webkitAudioContext?:typeof AudioContext};

class AudioManager{
 private context:AudioContext|null=null;
 private enabled=true;
 private musicEnabled=false;
 private musicNodes:OscillatorNode[]=[];
 private musicGain:GainNode|null=null;

 private ensureContext():AudioContext|null{
  try{
   const Constructor=window.AudioContext||(window as AudioWindow).webkitAudioContext;
   if(!Constructor)return null;
   this.context??=new Constructor();
   if(this.context.state==='suspended')void this.context.resume();
   return this.context;
  }catch{return null;}
 }
 setEnabled(value:boolean){this.enabled=value;}
 setMusicEnabled(value:boolean){
  this.musicEnabled=value;
  const context=this.ensureContext();if(!context)return;
  if(!value){this.stopMusic();return;}
  if(this.musicNodes.length)return;
  const gain=context.createGain();gain.gain.setValueAtTime(.0001,context.currentTime);
  gain.gain.setTargetAtTime(.018,context.currentTime,.9);gain.connect(context.destination);this.musicGain=gain;
  const notes=[110,164.81,220,329.63];
  this.musicNodes=notes.map((frequency,index)=>{
   const osc=context.createOscillator();osc.type=index===3?'sine':'triangle';osc.frequency.value=frequency;osc.detune.value=(index-1.5)*3;
   const voice=context.createGain();voice.gain.value=index===3?.12:.25;osc.connect(voice);voice.connect(gain);osc.start();return osc;
  });
 }
 private stopMusic(){
  const context=this.context;
  if(context&&this.musicGain){this.musicGain.gain.setTargetAtTime(.0001,context.currentTime,.12);}
  for(const node of this.musicNodes){try{node.stop((context?.currentTime??0)+.5);}catch{/* Already stopped. */}}
  this.musicNodes=[];this.musicGain=null;
 }
 play(name:SoundName){
  if(!this.enabled)return;
  const context=this.ensureContext();if(!context)return;
  const presets:Record<SoundName,{notes:number[];duration:number;wave:OscillatorType;volume:number}>={
   place:{notes:[310,465],duration:.13,wave:'triangle',volume:.085},
   clear:{notes:[520,660,790],duration:.23,wave:'sine',volume:.11},
   combo:{notes:[520,660,790,1046],duration:.32,wave:'triangle',volume:.12},
   bloom:{notes:[392,523,659,784,1046],duration:.48,wave:'sine',volume:.13},
   win:{notes:[523,659,784,1046],duration:.48,wave:'triangle',volume:.12},
   over:{notes:[220,196,164],duration:.32,wave:'sine',volume:.09},
   tap:{notes:[430],duration:.08,wave:'triangle',volume:.05}
  };
  const preset=presets[name],now=context.currentTime;
  preset.notes.forEach((frequency,index)=>{
   const start=now+index*(name==='place'?.012:.045);
   const osc=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();
   osc.type=preset.wave;osc.frequency.setValueAtTime(frequency,start);
   if(name==='place'||name==='clear'||name==='combo'||name==='bloom')osc.frequency.exponentialRampToValueAtTime(frequency*1.015,start+preset.duration*.5);
   filter.type='lowpass';filter.frequency.value=name==='bloom'?3800:2400;
   gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(preset.volume/(1+index*.35),start+.012);
   gain.gain.exponentialRampToValueAtTime(.0001,start+preset.duration);
   osc.connect(filter);filter.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+preset.duration+.02);
  });
 }
}
export const audio=new AudioManager();
