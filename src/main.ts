import { createBoard, generatePieceSet, applyPlacement, getAvailableMoves, hasAnyValidMove, PALETTE, SIZE, type Board, type Piece, type Point } from './engine';
import { loadSave, saveData, todayKey, type SaveData } from './storage';
import { LEVELS, isLevelComplete, starsForLevel } from './levels';
import { audio } from './audio';
import './style.css';

type Screen='menu'|'classic'|'journey'|'daily'|'settings'|'stats'|'privacy';
interface GameState { board:Board; tray:Piece[]; score:number; combo:number; bloom:number; serial:number; selected:string|null; mode:'classic'|'level'|'daily'; level:number; moves:number; lines:number; multi:number; over:boolean; paused:boolean; }
const root=document.querySelector<HTMLDivElement>('#root')!;
const save:SaveData=loadSave();
let screen:Screen='menu',state:GameState=createGame('classic',1),toastTimer=0,history:GameState[]=[],lastActionAt=0,burstMode=false;
let drag:{pieceId:string;startX:number;startY:number;pointerId:number}|null=null;

function createGame(mode:GameState['mode'],level:number):GameState{return {board:createBoard(),tray:generatePieceSet(Math.random,0),score:0,combo:0,bloom:0,serial:0,selected:null,mode,level,moves:0,lines:0,multi:0,over:false,paused:false};}
function persist(){save.bestScore=Math.max(save.bestScore,state.mode==='classic'?state.score:0);saveData(save);}
function toast(message:string){const el=document.querySelector('#toast');if(el){el.textContent=message;el.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>el.classList.remove('show'),1700);}}
function nav(next:Screen){screen=next;render();}
function button(label:string,action:string,cls='btn'):string{return `<button class="${cls}" data-action="${action}">${label}</button>`;}
function header(title:string,sub=''){return `<header class="topbar"><button class="icon-btn" data-action="back" aria-label="Back">←</button><div><div class="eyebrow">BLOCK BLOOM</div><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div><button class="icon-btn" data-action="settings" aria-label="Settings">⚙</button></header>`;}
function render(){
 if(screen==='menu'){root.innerHTML=`<main class="shell home"><div class="sunburst"></div><div class="brand-mark">✿</div><div class="eyebrow">A LITTLE PUZZLE GARDEN</div><h1 class="wordmark">BLOCK<br/><span>BLOOM</span></h1><p class="lede">Place with purpose. Clear with joy.</p><div class="home-score"><span>PERSONAL BEST</span><strong>${save.bestScore.toLocaleString()}</strong></div><div class="menu-actions">${button('▶ &nbsp; PLAY CLASSIC','classic','btn primary')}${button('✿ &nbsp; LEVEL JOURNEY','journey','btn')}${button('☀ &nbsp; DAILY BLOOM','daily','btn')}<div class="small-actions">${button('◷ STATS','stats','btn soft')}${button('⚙ SETTINGS','settings','btn soft')}${button('ⓘ PRIVACY','privacy','btn soft')}</div></div><div class="footer-note">A fresh board. A fresh chance to bloom.</div></main><div id="toast" class="toast"></div>`;return;}
 if(screen==='settings'){root.innerHTML=`<main class="shell page">${header('Settings','Make your garden feel like yours.') }<section class="panel settings-list"><div class="setting"><div><b>Sound effects</b><small>Little notes for every good move</small></div><input type="checkbox" data-setting="sound" ${save.sound?'checked':''}></div><div class="setting"><div><b>Background music</b><small>Music is not bundled in this build</small></div><input type="checkbox" data-setting="music" ${save.music?'checked':''}></div><div class="setting"><div><b>Vibration</b><small>Short feedback on supported devices</small></div><input type="checkbox" data-setting="vibration" ${save.vibration?'checked':''}></div></section><section class="panel"><h3>How to play</h3><p>Drag a piece onto the board. Fill an entire row or column to clear it. Clear several lines together for a bigger score. Bloom Burst clears the occupied cells inside a selected 3 × 3 area once the meter is full.</p></section>${button('BACK TO GARDEN','back','btn primary')}</main>`;return;}
 if(screen==='stats'){root.innerHTML=`<main class="shell page">${header('Your garden','Every round makes you sharper.') }<div class="stat-grid"><div class="panel"><small>BEST SCORE</small><strong>${save.bestScore}</strong></div><div class="panel"><small>GAMES PLAYED</small><strong>${save.gamesPlayed}</strong></div><div class="panel"><small>LINES CLEARED</small><strong>${save.linesCleared}</strong></div><div class="panel"><small>BEST COMBO</small><strong>${save.highestCombo}×</strong></div></div>${button('BACK TO GARDEN','back','btn primary')}</main>`;return;}
 if(screen==='privacy'){root.innerHTML=`<main class="shell page">${header('Privacy','Simple by design.') }<section class="panel"><h3>Local game data</h3><p>BLOCK BLOOM stores your best score, game statistics, level stars, settings and daily challenge completion in this browser's local storage. No account or remote gameplay telemetry is enabled.</p><h3>Advertising</h3><p>No advertising SDK is enabled. Any future advertising integration must disclose the provider and obtain required consent before release.</p><h3>External resources</h3><p>The interface currently requests Google Fonts when online. The game engine itself does not need an internet connection.</p></section>${button('BACK','back','btn primary')}</main>`;return;}
 if(screen==='journey'){root.innerHTML=`<main class="shell page">${header('Level journey','Thirty tiny challenges. One growing garden.') }<div class="level-grid">${LEVELS.map(l=>{const unlocked=l.id<=save.levelUnlocked,stars=save.levelStars[l.id]||0;return `<button class="level-card ${unlocked?'':'locked'}" data-level="${l.id}" ${unlocked?'':'disabled'}><span>${String(l.id).padStart(2,'0')}</span><b>${l.name}</b><small>${unlocked?'★'.repeat(stars)+'☆'.repeat(3-stars):'🔒 LOCKED'}</small></button>`;}).join('')}</div>${button('BACK TO GARDEN','back','btn primary')}</main>`;return;}
 if(screen==='daily'){const done=save.dailyDate===todayKey();root.innerHTML=`<main class="shell page">${header('Daily bloom','One seed. One challenge. Every day.') }<section class="daily-card"><div class="daily-flower">✿</div><div class="eyebrow">TODAY'S CHALLENGE</div><h2>Make 500 points</h2><p>Build a beautiful chain of clears. You have a fresh board and three pieces at a time.</p><div class="daily-status">${done?'✓ COMPLETED TODAY':'✦ '+save.dailyStreak+' DAY STREAK'}</div>${button(done?'PLAY CLASSIC':'START DAILY CHALLENGE','start-daily','btn primary')}</section>${button('BACK TO GARDEN','back','btn soft')}</main>`;return;}
 renderGame();
}
function pieceMarkup(piece:Piece):string{
 const maxX=Math.max(...piece.cells.map(c=>c[0]))+1,maxY=Math.max(...piece.cells.map(c=>c[1]))+1;
 return `<span class="mini-grid" style="--w:${maxX};--h:${maxY}">${piece.cells.map(([x,y])=>`<i style="grid-column:${x+1};grid-row:${y+1};--block:${PALETTE[piece.color]}"></i>`).join('')}</span>`;
}
function renderGame(){
 const level=state.mode==='level'?LEVELS[state.level-1]:null;
 root.innerHTML=`<main class="shell game-shell"><header class="game-head"><button class="icon-btn" data-action="back">←</button><div><div class="eyebrow">${state.mode==='classic'?'CLASSIC MODE':state.mode==='daily'?'DAILY BLOOM':`LEVEL ${state.level} / 30`}</div><div class="score-number" id="score">${state.score.toLocaleString()}</div><small>SCORE ${level?`· TARGET ${level.target}`:''}</small></div><button class="icon-btn" data-action="pause">Ⅱ</button></header><div class="meta-row"><div class="meta-pill">✦ <b>${state.combo}</b> COMBO</div><div class="meta-pill bloom-pill"><span>✿ BLOOM</span><div class="meter"><i id="bloom-meter" style="width:${state.bloom}%"></i></div><b>${state.bloom}%</b></div><button class="burst-btn" data-action="burst" ${state.bloom<100?'disabled':''}>✺ BURST</button></div><section class="board-wrap"><div class="board" id="board" aria-label="Eight by eight puzzle board">${state.board.flatMap((row,y)=>row.map((cell,x)=>`<div class="cell ${cell===null?'':'filled'}" data-x="${x}" data-y="${y}" ${cell===null?'':`style="--block:${PALETTE[cell]}"`}></div>`)).join('')}</div></section><div class="helper">${state.paused?'Game paused. Resume when ready.':level?level.hint:'Drag a shape onto the board. Tap a shape then tap the board to place it.'}</div><div class="tray" id="tray">${state.tray.map(p=>`<button class="piece-slot ${p.used?'used':''} ${state.selected===p.id?'selected':''}" data-piece="${p.id}" ${p.used?'disabled':''} aria-label="Select shape"><span class="mini-piece">${pieceMarkup(p)}</span><small>${p.cells.length}</small></button>`).join('')}</div><div class="game-actions">${button('↶ UNDO','undo','btn soft')}${button('💡 HINT','hint','btn soft')}${button('↻ RESTART','restart','btn soft')}</div><div id="toast" class="toast"></div></main>`;
 bindGameEvents();
}
function takeSnapshot(){history.push({...state,board:state.board.map(r=>[...r]),tray:state.tray.map(p=>({...p,cells:p.cells.map(c=>[...c] as Point)}))});if(history.length>25)history.shift();}
function cellAt(clientX:number,clientY:number):{x:number;y:number}|null{
 const cells=[...document.querySelectorAll<HTMLElement>('#board .cell')];
 for(const el of cells){const r=el.getBoundingClientRect();if(clientX>=r.left&&clientX<=r.right&&clientY>=r.top&&clientY<=r.bottom)return {x:Number(el.dataset.x),y:Number(el.dataset.y)};}
 return null;
}
function bindGameEvents(){
 const board=document.querySelector<HTMLElement>('#board')!;
 board.addEventListener('pointerdown',e=>{
  const cell=(e.target as HTMLElement).closest<HTMLElement>('.cell');if(!cell||state.paused||state.over)return;
  const x=Number(cell.dataset.x),y=Number(cell.dataset.y);
  if(burstMode){activateBurstAt(x,y);return;}
  const piece=state.tray.find(p=>p.id===state.selected&&!p.used);
  if(piece)commit(piece,x,y);
 });
 document.querySelectorAll<HTMLElement>('[data-piece]').forEach(el=>{
  el.addEventListener('pointerdown',e=>{
   if(state.paused||state.over)return;
   const p=state.tray.find(v=>v.id===el.dataset.piece);if(!p||p.used)return;
   const pe=e as PointerEvent;drag={pieceId:p.id,startX:pe.clientX,startY:pe.clientY,pointerId:pe.pointerId};state.selected=p.id;
   el.classList.add('dragging');el.setPointerCapture?.(pe.pointerId);
  });
  el.addEventListener('click',()=>{if(drag)return;state.selected=el.dataset.piece!;document.querySelectorAll('.piece-slot').forEach(n=>n.classList.toggle('selected',(n as HTMLElement).dataset.piece===state.selected));});
  el.addEventListener('pointerup',e=>{
   const pe=e as PointerEvent;if(!drag||drag.pointerId!==pe.pointerId)return;
   const p=state.tray.find(v=>v.id===drag!.pieceId);
   if(p&&Math.abs(pe.clientX-drag.startX)+Math.abs(pe.clientY-drag.startY)>12){
    const point=cellAt(pe.clientX,pe.clientY);
    if(point){const minX=Math.min(...p.cells.map(c=>c[0])),minY=Math.min(...p.cells.map(c=>c[1]));commit(p,point.x-minX,point.y-minY);}
    else toast('Drop your block on the board.');
   }
   drag=null;
  });
 });
}
function commit(piece:Piece,x:number,y:number){
 if(state.paused||state.over||piece.used||!canFitAt(piece,x,y)){toast('That spot does not fit.');return;}
 const now=Date.now();if(now-lastActionAt<70)return;lastActionAt=now;
 takeSnapshot();const result=applyPlacement(state.board,piece,x,y,state.combo,state.bloom);
 state.board=result.board;state.score+=result.score;state.combo=result.combo;state.bloom=result.bloom;state.lines+=result.lines;state.multi+=result.lines>=2?1:0;state.moves++;piece.used=true;state.selected=null;
 if(result.lines){audio.play(result.lines>1?'combo':'clear');if(navigator.vibrate&&save.vibration)navigator.vibrate(result.lines>1?[20,30,30]:15);}else audio.play('place');
 if(state.tray.every(p=>p.used)){state.serial++;state.tray=generatePieceSet(Math.random,state.serial);}
 save.bestScore=Math.max(save.bestScore,state.mode==='classic'?state.score:0);save.totalScore+=result.score;save.linesCleared+=result.lines;save.highestCombo=Math.max(save.highestCombo,state.combo);
 if(state.mode==='daily'&&state.score>=500&&save.dailyDate!==todayKey()){save.dailyDate=todayKey();save.dailyStreak++;toast('Daily bloom complete! ✿');}
 if(state.mode==='level'){
  const level=LEVELS[state.level-1],stats={score:state.score,lines:state.lines,combo:state.combo,multi:state.multi};
  if(isLevelComplete(level,stats)){const stars=starsForLevel(level,stats);save.levelStars[state.level]=Math.max(save.levelStars[state.level]||0,stars);save.levelUnlocked=Math.max(save.levelUnlocked,Math.min(30,state.level+1));state.over=true;}
  else if(state.moves>=level.moves)state.over=true;
 }
 if(!hasAnyValidMove(state.board,state.tray))state.over=true;
 persist();renderGame();if(state.over)showEnd();
}
function canFitAt(piece:Piece,x:number,y:number):boolean{return piece.cells.every(([dx,dy])=>x+dx<SIZE&&y+dy<SIZE&&x+dx>=0&&y+dy>=0&&state.board[y+dy]?.[x+dx]===null);}
function activateBurstAt(x:number,y:number){
 if(state.bloom<100||!burstMode){toast('Bloom Burst is not ready.');return;}
 if(x+3>SIZE||y+3>SIZE){toast('Choose a 3 × 3 area fully on the board.');return;}
 const cells:Array<[number,number]>=[];
 for(let yy=y;yy<y+3;yy++)for(let xx=x;xx<x+3;xx++)if(state.board[yy][xx]!==null)cells.push([xx,yy]);
 if(!cells.length){toast('Choose an area with blocks inside.');return;}
 takeSnapshot();for(const [xx,yy] of cells)state.board[yy][xx]=null;
 const bonus=cells.length*15;state.score+=bonus;state.bloom=0;state.combo=0;burstMode=false;state.moves++;
 save.totalScore+=bonus;save.bestScore=Math.max(save.bestScore,state.mode==='classic'?state.score:0);persist();audio.play('bloom');if(navigator.vibrate&&save.vibration)navigator.vibrate([25,35,50]);renderGame();toast(`Bloom Burst! +${bonus} ✿`);
}
function showEnd(){
 const won=state.mode==='level'&&save.levelStars[state.level]>0,daily=state.mode==='daily'&&save.dailyDate===todayKey();
 const title=won?'Garden grown!':daily?'Daily bloom complete!':'No more moves',message=won?'You cleared the challenge. The next level is ready.':daily?'A lovely score. Come back tomorrow for a fresh challenge.':'That board gave you a proper puzzle. Fancy another round?';
 const layer=document.createElement('div');layer.className='modal-backdrop';layer.innerHTML=`<section class="modal"><div class="modal-flower">${won||daily?'✿':'☘'}</div><div class="eyebrow">${won?'LEVEL COMPLETE':daily?'DAILY COMPLETE':'ROUND COMPLETE'}</div><h2>${title}</h2><p>${message}</p><div class="end-score">${state.score.toLocaleString()}<small>POINTS</small></div><button class="btn primary" data-modal="again">${won&&state.level<30?'NEXT LEVEL':'PLAY AGAIN'}</button><button class="btn soft" data-modal="home">GARDEN HOME</button></section>`;
 root.append(layer);layer.querySelector('[data-modal="again"]')!.addEventListener('click',()=>{layer.remove();state=createGame(won&&state.level<30?'level':state.mode,won&&state.level<30?state.level+1:state.level);history=[];burstMode=false;renderGame();});
 layer.querySelector('[data-modal="home"]')!.addEventListener('click',()=>{layer.remove();nav('menu');});
}
root.addEventListener('click',e=>{
 const target=(e.target as HTMLElement).closest<HTMLElement>('[data-action],[data-level]');if(!target)return;
 if(target.dataset.level){const level=Number(target.dataset.level);state=createGame('level',level);history=[];screen='classic';burstMode=false;renderGame();return;}
 const action=target.dataset.action;
 if(action==='classic'||action==='restart'){state=createGame('classic',1);history=[];burstMode=false;screen='classic';if(action==='classic')save.gamesPlayed++;renderGame();}
 else if(action==='journey')nav('journey');else if(action==='daily')nav('daily');
 else if(action==='start-daily'){if(save.dailyDate===todayKey()){toast('Today’s challenge is already complete.');return;}state=createGame('daily',1);history=[];burstMode=false;screen='classic';save.gamesPlayed++;renderGame();}
 else if(action==='settings')nav('settings');else if(action==='stats')nav('stats');else if(action==='privacy')nav('privacy');else if(action==='back'){burstMode=false;nav('menu');}
 else if(action==='pause'){state.paused=!state.paused;renderGame();}
 else if(action==='undo'){const prev=history.pop();if(prev){state=prev;burstMode=false;renderGame();}else toast('No move to undo yet.');}
 else if(action==='hint'){if(state.paused||state.over)return;const moves=getAvailableMoves(state.board,state.tray);if(!moves.length){toast('No open placements remain.');return;}const move=moves[0];state.selected=move.pieceId;document.querySelectorAll('.piece-slot').forEach(el=>el.classList.toggle('selected',(el as HTMLElement).dataset.piece===move.pieceId));toast(`Try column ${move.x+1}, row ${move.y+1}.`);}
 else if(action==='burst'){if(state.bloom<100){toast('Fill the Bloom meter first.');return;}burstMode=true;state.selected=null;toast('Tap the top-left cell of an open 3 × 3 area.');}
});
root.addEventListener('change',e=>{
 const el=e.target as HTMLInputElement;if(!el.dataset.setting)return;
 const key=el.dataset.setting as 'sound'|'music'|'vibration';save[key]=el.checked;saveData(save);audio.setEnabled(save.sound);
});
audio.setEnabled(save.sound);
render();
