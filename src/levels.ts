export interface Level { id:number; name:string; objective:'score'|'lines'|'combo'|'multi'; target:number; moves:number; difficulty:1|2|3; hint:string; }
const names=['First Sprout','Petal Steps','Fresh Start','Twin Bloom','Corner Garden','Growing Together','Color Parade','The Long Stem','Little Garden','Triple Treat'];
export const LEVELS:Level[]=Array.from({length:30},(_,i)=> {
 const id=i+1,kind:Level['objective']=id%7===0?'multi':id%5===0?'combo':id%3===0?'lines':'score';
 return {id,name:names[i%names.length],objective:kind,target:kind==='score'?180+id*35:kind==='lines'?2+Math.floor(id/4):kind==='combo'?2+Math.floor(id/8):2,moves:kind==='score'?12:10+Math.floor(id/10),difficulty:id<8?1:id<20?2:3,hint:kind==='multi'?'Clear two lines in one placement':kind==='combo'?'Keep clearing lines on consecutive turns':kind==='lines'?'Complete rows or columns':'Place blocks and build your score'};
});
export function isLevelComplete(level:Level,stats:{score:number;lines:number;combo:number;multi:number}):boolean {
 return level.objective==='score'?stats.score>=level.target:level.objective==='lines'?stats.lines>=level.target:level.objective==='combo'?stats.combo>=level.target:stats.multi>=level.target;
}
export function starsForLevel(level:Level,stats:{score:number;lines:number;combo:number;multi:number}):number {
 if(!isLevelComplete(level,stats))return 0;
 const metric=level.objective==='score'?stats.score/level.target:level.objective==='lines'?stats.lines/level.target:level.objective==='combo'?stats.combo/level.target:stats.multi/level.target;
 return metric>=1.8?3:metric>=1.3?2:1;
}
