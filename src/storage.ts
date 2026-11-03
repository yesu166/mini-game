export interface SaveData { version:1; bestScore:number; totalScore:number; gamesPlayed:number; linesCleared:number; highestCombo:number; levelUnlocked:number; levelStars:Record<number,number>; dailyDate:string|null; dailyStreak:number; sound:boolean; music:boolean; vibration:boolean; theme:string; }
export const DEFAULT_SAVE:SaveData={version:1,bestScore:0,totalScore:0,gamesPlayed:0,linesCleared:0,highestCombo:0,levelUnlocked:1,levelStars:{},dailyDate:null,dailyStreak:0,sound:true,music:false,vibration:true,theme:'cream'};
const KEY='block-bloom-save-v1';
export function loadSave(storage:Storage=localStorage):SaveData {
  try { const raw=storage.getItem(KEY); if(!raw)return {...DEFAULT_SAVE,levelStars:{}}; const value=JSON.parse(raw) as Partial<SaveData>;
    if(value.version!==1)return {...DEFAULT_SAVE,levelStars:{}};
    return {...DEFAULT_SAVE,...value,levelStars:value.levelStars&&typeof value.levelStars==='object'?value.levelStars:{}} as SaveData;
  } catch { return {...DEFAULT_SAVE,levelStars:{}}; }
}
export function saveData(data:SaveData,storage:Storage=localStorage):boolean {
  try { storage.setItem(KEY,JSON.stringify(data));return true; } catch { return false; }
}
export function todayKey(date=new Date()):string {
  return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
