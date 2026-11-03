export type Objective='score'|'lines'|'combo'|'multi';
export interface Level {
 id:number;
 name:string;
 chapter:1|2|3;
 chapterName:string;
 objective:Objective;
 target:number;
 moves:number;
 difficulty:1|2|3;
 hint:string;
}
type LevelSeed=Omit<Level,'id'|'chapter'|'chapterName'|'difficulty'>;
const chapters=['First Light','Wild Grove','Moon Garden'];
const seeds:LevelSeed[]=[
 {name:'A New Beginning',objective:'score',target:220,moves:12,hint:'Use small shapes to build an early score'},
 {name:'Straight Lines',objective:'lines',target:2,moves:10,hint:'Complete two full rows or columns'},
 {name:'Sunlit Steps',objective:'score',target:360,moves:12,hint:'Place every shape carefully and keep space open'},
 {name:'Twin Petals',objective:'combo',target:2,moves:12,hint:'Clear a line on two consecutive placements'},
 {name:'Crossroads',objective:'lines',target:3,moves:11,hint:'Look for placements that finish both a row and a column'},
 {name:'Golden Hour',objective:'score',target:520,moves:13,hint:'Larger pieces give more placement points'},
 {name:'First Double Bloom',objective:'multi',target:1,moves:12,hint:'Finish at least two lines in one placement'},
 {name:'Garden Path',objective:'lines',target:4,moves:12,hint:'Protect open lanes for long pieces'},
 {name:'Warm Current',objective:'combo',target:2,moves:12,hint:'Keep your line clears back-to-back'},
 {name:'First Harvest',objective:'score',target:750,moves:14,hint:'Balance quick points with line-clear bonuses'},

 {name:'Into the Grove',objective:'lines',target:4,moves:13,hint:'Create a lane before the board gets crowded'},
 {name:'Canopy Builder',objective:'score',target:900,moves:13,hint:'Use the whole board without sealing pockets'},
 {name:'Threefold Rhythm',objective:'combo',target:3,moves:14,hint:'Plan three consecutive line-clearing turns'},
 {name:'Branching Paths',objective:'multi',target:1,moves:12,hint:'Set up a row and a column to complete together'},
 {name:'Fern Maze',objective:'lines',target:5,moves:14,hint:'Think one piece ahead before filling a gap'},
 {name:'Emerald Run',objective:'score',target:1100,moves:15,hint:'Use line bonuses to accelerate your score'},
 {name:'Steady Bloom',objective:'combo',target:3,moves:15,hint:'A non-clearing move resets your combo'},
 {name:'Grove Symphony',objective:'multi',target:2,moves:16,hint:'Create two separate multi-line clears'},
 {name:'Deep Roots',objective:'lines',target:6,moves:15,hint:'Keep the middle columns flexible'},
 {name:'Wildflower Crown',objective:'score',target:1350,moves:17,hint:'Long pieces can score well when you preserve straight lanes'},

 {name:'Blue Dusk',objective:'combo',target:4,moves:17,hint:'Chain four line-clearing turns without a break'},
 {name:'Silver Stream',objective:'lines',target:7,moves:17,hint:'Read the tray as a three-piece sequence'},
 {name:'Moonlit Cross',objective:'multi',target:2,moves:16,hint:'A single placement can clear rows and columns together'},
 {name:'Night Garden',objective:'score',target:1650,moves:18,hint:'Build score steadily and avoid isolated empty cells'},
 {name:'Lunar Rhythm',objective:'combo',target:4,moves:18,hint:'Rotate pieces to preserve the combo route'},
 {name:'Starlight Rows',objective:'lines',target:8,moves:18,hint:'Every line matters. Avoid closing the central lanes'},
 {name:'Celestial Bloom',objective:'multi',target:3,moves:20,hint:'Set up three high-value multi-line clears'},
 {name:'Orbit Keeper',objective:'score',target:1950,moves:20,hint:'Use Bloom Burst as a tactical board reset'},
 {name:'Last Constellation',objective:'combo',target:5,moves:21,hint:'Keep your focus through five consecutive clears'},
 {name:'The Grand Bloom',objective:'multi',target:3,moves:22,hint:'Finish the journey with deliberate multi-line setups'}
];
export const LEVELS:Level[]=seeds.map((seed,index)=>{
 const id=index+1,chapter=(Math.floor(index/10)+1) as 1|2|3;
 return {...seed,id,chapter,chapterName:chapters[chapter-1],difficulty:chapter};
});
export function isLevelComplete(level:Level,stats:{score:number;lines:number;combo:number;multi:number}):boolean{
 return level.objective==='score'?stats.score>=level.target:
  level.objective==='lines'?stats.lines>=level.target:
  level.objective==='combo'?stats.combo>=level.target:stats.multi>=level.target;
}
export function starsForLevel(level:Level,stats:{score:number;lines:number;combo:number;multi:number}):number{
 if(!isLevelComplete(level,stats))return 0;
 const metric=level.objective==='score'?stats.score/level.target:
  level.objective==='lines'?stats.lines/level.target:
  level.objective==='combo'?stats.combo/level.target:stats.multi/level.target;
 return metric>=1.8?3:metric>=1.3?2:1;
}
