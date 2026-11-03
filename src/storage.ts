export interface SaveData {
 version:1;
 bestScore:number;
 totalScore:number;
 gamesPlayed:number;
 linesCleared:number;
 highestCombo:number;
 levelUnlocked:number;
 levelStars:Record<number,number>;
 dailyDate:string|null;
 dailyStreak:number;
 sound:boolean;
 music:boolean;
 vibration:boolean;
 theme:string;
}
export const DEFAULT_SAVE:SaveData={
 version:1,bestScore:0,totalScore:0,gamesPlayed:0,linesCleared:0,highestCombo:0,
 levelUnlocked:1,levelStars:{},dailyDate:null,dailyStreak:0,sound:true,music:false,vibration:true,theme:'midnight'
};
const KEY='block-bloom-save-v1';
const safeNumber=(value:unknown,fallback:number,min=0,max=Number.MAX_SAFE_INTEGER):number=>
 typeof value==='number'&&Number.isFinite(value)?Math.min(max,Math.max(min,Math.floor(value))):fallback;

function freshSave():SaveData{return {...DEFAULT_SAVE,levelStars:{}};}
export function loadSave(storage?:Storage):SaveData{
 try{
  const target=storage??(typeof localStorage!=='undefined'?localStorage:undefined);
  if(!target)return freshSave();
  const raw=target.getItem(KEY);if(!raw)return freshSave();
  const value=JSON.parse(raw) as Partial<SaveData>;
  if(!value||value.version!==1||typeof value!=='object')return freshSave();
  const stars:Record<number,number>={};
  if(value.levelStars&&typeof value.levelStars==='object'){
   for(const [key,star] of Object.entries(value.levelStars)){
    const id=Number(key),rating=safeNumber(star,0,0,3);
    if(Number.isInteger(id)&&id>=1&&id<=30)stars[id]=rating;
   }
  }
  const dailyDate=typeof value.dailyDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.dailyDate)?value.dailyDate:null;
  return {
   version:1,bestScore:safeNumber(value.bestScore,0),totalScore:safeNumber(value.totalScore,0),
   gamesPlayed:safeNumber(value.gamesPlayed,0),linesCleared:safeNumber(value.linesCleared,0),
   highestCombo:safeNumber(value.highestCombo,0),levelUnlocked:safeNumber(value.levelUnlocked,1,1,30),
   levelStars:stars,dailyDate,dailyStreak:safeNumber(value.dailyStreak,0),
   sound:typeof value.sound==='boolean'?value.sound:DEFAULT_SAVE.sound,
   music:typeof value.music==='boolean'?value.music:DEFAULT_SAVE.music,
   vibration:typeof value.vibration==='boolean'?value.vibration:DEFAULT_SAVE.vibration,
   theme:'midnight'
  };
 }catch{return freshSave();}
}
export function saveData(data:SaveData,storage?:Storage):boolean{
 try{
  const target=storage??(typeof localStorage!=='undefined'?localStorage:undefined);
  if(!target)return false;
  target.setItem(KEY,JSON.stringify(data));return true;
 }catch{return false;}
}
export function todayKey(date=new Date()):string{
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}

const SESSION_KEY='block-bloom-session-v1';
export function loadSession(storage?:Storage):unknown|null{
 try{
  const target=storage??(typeof localStorage!=='undefined'?localStorage:undefined);
  if(!target)return null;
  const raw=target.getItem(SESSION_KEY);if(!raw)return null;
  const value=JSON.parse(raw) as {version?:number;session?:unknown};
  return value&&value.version===1&&'session' in value?value.session:null;
 }catch{return null;}
}
export function saveSession<T>(session:T,storage?:Storage):boolean{
 try{
  const target=storage??(typeof localStorage!=='undefined'?localStorage:undefined);
  if(!target)return false;
  target.setItem(SESSION_KEY,JSON.stringify({version:1,session}));return true;
 }catch{return false;}
}
export function clearSession(storage?:Storage):boolean{
 try{
  const target=storage??(typeof localStorage!=='undefined'?localStorage:undefined);
  if(!target)return false;
  target.removeItem(SESSION_KEY);return true;
 }catch{return false;}
}
