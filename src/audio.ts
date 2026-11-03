type SoundName='place'|'clear'|'combo'|'bloom'|'win'|'over'|'tap';
class AudioManager {
 private context:AudioContext|null=null;
 private enabled=true;
 setEnabled(value:boolean){this.enabled=value;}
 play(name:SoundName){
  if(!this.enabled)return;
  try {
   const Ctx=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!Ctx)return;
   this.context??=new Ctx();
   if(this.context.state==='suspended')void this.context.resume();
   const frequencies:Record<SoundName,number>={place:280,clear:520,combo:740,bloom:980,win:660,over:170,tap:400};
   const osc=this.context.createOscillator(),gain=this.context.createGain();
   osc.type=name==='over'?'sine':'triangle';osc.frequency.value=frequencies[name];
   gain.gain.setValueAtTime(0.0001,this.context.currentTime);gain.gain.exponentialRampToValueAtTime(0.11,this.context.currentTime+.012);gain.gain.exponentialRampToValueAtTime(0.0001,this.context.currentTime+.16);
   osc.connect(gain);gain.connect(this.context.destination);osc.start();osc.stop(this.context.currentTime+.17);
  } catch { /* Audio is an optional enhancement. */ }
 }
}
export const audio=new AudioManager();
