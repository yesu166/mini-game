import Phaser from 'phaser';
import { createBoard, generatePieceSet, applyPlacement, getAvailableMoves, hasAnyValidMove, PALETTE, SIZE, type Board, type Piece, type Point } from './engine';
import { loadSave, saveData, todayKey, type SaveData } from './storage';
import { LEVELS, isLevelComplete, starsForLevel } from './levels';
import { audio } from './audio';
import './style.css';

type Screen='menu'|'classic'|'journey'|'daily'|'settings'|'stats'|'privacy';
interface GameState { board:Board; tray:Piece[]; score:number; combo:number; bloom:number; serial:number; selected:string|null; mode:'classic'|'level'|'daily'; level:number; moves:number; lines:number; multi:number; over:boolean; paused:boolean; }
const root=document.querySelector<HTMLDivElement>('#root')!;
const save:SaveData=loadSave();
let screen:Screen='menu',state:GameState=createGame('classic',1),phaser:Phaser.Game|null=null,drag:{pieceId:string;pointerId:number}|null=null,toastTimer=0;
function createGame(mode:GameState['mode'],level:number):GameState{return {board:createBoard(),tray:generatePieceSet(Math.random,0),score:0,combo:0,bloom:0,serial:0,selected:null,mode,level,moves:0,lines:0,multi:0,over:false,paused:false};}
function persist(){save.bestScore=Math.max(save.bestScore,state.mode==='classic'?state.score:0);save.totalScore+=0;saveData(save);}
function toast(message:string){const el=document.querySelector('#toast');if(el){el.textContent=message;el.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>el.classList.remove('show'),1700);}}
function nav(next:Screen){screen=next;render();}
function button(label:string,action:string,cls='btn'):string{return `<button class="${cls}" data-action="${action}">${label}</button>`;}
function header(title:string,sub=''){return `<header class="topbar"><button class="icon-btn" data-action="back" aria-label="Back">←</button><div><div class="eyebrow">BLOCK BLOOM</div><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div><button class="icon-btn" data-action="settings" aria-label="Settings">⚙</button></header>`;}
function render(){
 if(phaser){phaser.destroy(true);phaser=null;}
 if(screen==='menu'){root.innerHTML=`<main class="shell home"><div class="sunburst"></div><div class="brand-mark">✿</div><div class="eyebrow">A LITTLE PUZZLE GARDEN</div><h1 class="wordmark">BLOCK<br/><span>BLOOM</span></h1><p class="lede">Place with purpose. Clear with joy.</p><div class="home-score"><span>PERSONAL BEST</span><strong>${save.bestScore.toLocaleString()}</strong></div><div class="menu-actions">${button('▶ &nbsp; PLAY CLASSIC','classic','btn primary')}${button('✿ &nbsp; LEVEL JOURNEY','journey','btn')}${button('☀ &nbsp; DAILY BLOOM','daily','btn')}
<div class="small-actions">${button('◷ STATS','stats','btn soft')}${button('⚙ SETTINGS','settings','btn soft')}</div></div><div class="footer-note">A fresh board. A fresh chance to bloom.</div></main><div id="toast" class="toast"></div>`;return;}
 if(screen==='settings'){root.innerHTML=`<main class="shell page">${header('Settings','Make your garden feel like yours.') }<section class="panel settings-list"><div class="setting"><div><b>Sound effects</b><small>Little notes for every good move</small></div><input type="checkbox" data-setting="sound" ${save.sound?'checked':''}></div><div class="setting"><div><b>Background music</b><small>Music is optional and currently not bundled</small></div><input type="checkbox" data-setting="music" ${save.music?'checked':''}></div><div class="setting"><div><b>Vibration</b><small>Short feedback on supported devices</small></div><input type="checkbox" data-setting="vibration" ${save.vibration?'checked':''}></div></section><section class="panel"><h3>How to play</h3><p>Drag all three shapes onto the 8 × 8 board. Complete a full row or column to clear it. Lines that bloom together score bigger. Keep at least one piece placeable.</p></section>${button('BACK TO GARDEN','back','btn primary')}</main>`;return;}
 if(screen==='stats'){root.innerHTML=`<main class="shell page">${header('Your garden','Every round makes you sharper.') }<div class="stat-grid"><div class="panel"><small>BEST SCORE</small><strong>${save.bestScore}</strong></div><div class="panel"><small>GAMES PLAYED</small><strong>${save.gamesPlayed}</strong></div><div class="panel"><small>LINES CLEARED</small><strong>${save.linesCleared}</strong></div><div class="panel"><small>BEST COMBO</small><strong>${save.highestCombo}×</strong></div></div>${button('BACK TO GARDEN','back','btn primary')}</main>`;return;}
 if(screen==='privacy'){root.innerHTML=`<main class="shell page">${header('Privacy','Simple by design.') }<section class="panel"><h3>Local game data</h3><p>BLOCK BLOOM stores your best score, game statistics, level stars, settings and daily challenge completion in this browser's local storage. This initial version does not create an account or send gameplay data to a server.</p><h3>Advertising</h3><p>No advertising SDK is enabled in this build. A no-op ad service is provided so gameplay never depends on ads. Any future advertising integration must disclose the provider and obtain any required consent before release.</p><h3>Contact</h3><p>No contact form or personal-data collection is enabled.</p></section>${button('BACK','back','btn primary')}</main>`;return;}
 if(screen==='journey'){root.innerHTML=`<main class="shell page">${header('Level journey','Thirty tiny challenges. One growing garden.') }<div class="level-grid">${LEVELS.map(l=>{const unlocked=l.id<=save.levelUnlocked,stars=save.levelStars[l.id]||0;return `<button class="level-card ${unlocked?'':'locked'}" data-level="${l.id}" ${unlocked?'':'disabled'}><span>${String(l.id).padStart(2,'0')}</span><b>${l.name}</b><small>${unlocked?'★'.repeat(stars)+'☆'.repeat(3-stars):'🔒 LOCKED'}</small></button>`;}).join('')}</div>${button('BACK TO GARDEN','back','btn primary')}</main>`;return;}
 if(screen==='daily'){const done=save.dailyDate===todayKey();root.innerHTML=`<main class="shell page">${header('Daily bloom','One seed. One challenge. Every day.') }<section class="daily-card"><div class="daily-flower">✿</div><div class="eyebrow">TODAY'S CHALLENGE</div><h2>Make 500 points</h2><p>Build a beautiful chain of clears. You have a fresh board and three pieces at a time.</p><div class="daily-status">${done?'✓ COMPLETED TODAY':'✦ '+save.dailyStreak+' DAY STREAK'}</div>${button(done?'PLAY CLASSIC':'START DAILY CHALLENGE','start-daily','btn primary')}</section>${button('BACK TO GARDEN','back','btn soft')}</main>`;return;}
 renderGame();
}
function renderGame(){
 root.innerHTML=`<main class="shell game-shell"><header class="game-head"><button class="icon-btn" data-action="back">←</button><div><div class="eyebrow">${state.mode==='classic'?'CLASSIC MODE':state.mode==='daily'?'DAILY BLOOM':`LEVEL ${state.level} / 30`}</div><div class="score-number" id="score">${state.score.toLocaleString()}</div><small>SCORE</small></div><button class="icon-btn" data-action="pause">Ⅱ</button></header><div class="meta-row"><div class="meta-pill">✦ <b id="combo">${state.combo}</b> COMBO</div><div class="meta-pill bloom-pill"><span>✿ BLOOM</span><div class="meter"><i id="bloom-meter" style="width:${state.bloom}%"></i></div><b id="bloom-value">${state.bloom}%</b></div><button class="burst-btn" data-action="burst" ${state.bloom<100?'disabled':''}>✺ BURST</button></div><section class="board-wrap"><div class="board" id="board" aria-label="Eight by eight puzzle board">${state.board.flatMap((row,y)=>row.map((cell,x)=>`<div class="cell ${cell===null?'':'filled'}" data-x="${x}" data-y="${y}" ${cell===null?'':`style="--block:${PALETTE[cell]}"`}></div>`)).join('')}</div><div class="board-glow"></div></section><div class="helper" id="helper">${state.mode==='level'?LEVELS[state.level-1].hint:'Drag a shape onto the board. Fill a line to clear it.'}</div><div class="tray" id="tray">${state.tray.map(p=>`<button class="piece-slot ${p.used?'used':''} ${state.selected===p.id?'selected':''}" data-piece="${p.id}" ${p.used?'disabled':''} aria-label="Select shape"><span class="mini-piece">${pieceMarkup(p)}</span><small>${p.cells.length}</small></button>`).join('')}</div><div class="game-actions">${button('↶ UNDO','undo','btn soft')}${button('💡 HINT','hint','btn soft')}${button('↻ RESTART','restart','btn soft')}</div><div id="toast" class="toast"></div></main>`;
 bindBoard();
}
function pieceMarkup(piece:Piece):string{
 const maxX=Math.max(...piece.cells.map(c=>c[0]))+1,maxY=Math.max(...piece.cells.map(c=>c[1]))+1;
 return `<span class="mini-grid" style="--w:${maxX};--h:${maxY}">${piece.cells.map(([x,y])=>`<i style="grid-column:${x+1};grid-row:${y+1};--block:${PALETTE[piece.color]}"></i>`).join('')}</span>`;
}
let history:GameState[]=[];
function snapshot(){history.push({...state,board:state.board.map(r=>[...r]),tray:state.tray.map(p=>({...p,cells:p.cells.map(c=>[...c] as Point)}))});if(history.length>20)history.shift();}
function bindBoard(){
 const board=document.querySelector('#board')!;
 board.addEventListener('pointerdown',e=>{const target=(e.target as HTMLElement).closest<HTMLElement>('.cell');if(!target||!state.selected)return;const piece=state.tray.find(p=>p.id===state.selected);if(!piece)return;const x=Number(target.dataset.x),y=Number(target.dataset.y);if(!canFitAt(piece,x,y)){toast('That spot is occupied.');return;}commit(piece,x,y);});
 document.querySelectorAll<HTMLElement>('[data-piece]').forEach(el=>{
  el.addEventListener('pointerdown',e=>{const id=el.dataset.piece!;const p=state.tray.find(v=>v.id===id);if(!p||p.used)return;drag={pieceId:id,pointerId:(e as PointerEvent).pointerId};state.selected=id;el.classList.add('dragging');});
  el.addEventListener('click',()=>{state.selected=el.dataset.piece!;document.querySelectorAll('.piece-slot').forEach(n=>n.classList.toggle('selected',(n as HTMLElement).dataset.piece===state.selected));});
 });
 document.addEventListener('pointerup',onPointerUp,{once:true});
}
function canFitAt(piece:Piece,x:number,y:number):boolean{return piece.cells.every(([dx,dy])=>x+dx<SIZE&&y+dy<SIZE&&x+dx>=0&&y+dy>=0&&state.board[y+dy]?.[x+dx]===null);}
function onPointerUp(e:PointerEvent){if(!drag||drag.pointerId!==e.pointerId){drag=null;return;}const el=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('.cell');if(el){const p=state.tray.find(v=>v.id===drag!.pieceId);if(p){const x=Number(el.dataset.x),y=Number(el.dataset.y);const minX=Math.min(...p.cells.map(c=>c[0])),minY=Math.min(...p.cells.map(c=>c[1]));const ox=Math.max(0,Math.floor(p.cells.length>4?0:0));commit(p,x-minX+ox,y-minY);}}drag=null;}
function commit(piece:Piece,x:number,y:number){
 if(state.over||piece.used)return;if(!canFitAt(piece,x,y)){toast('Not quite. Find an open patch.');return;}
 snapshot();const result=applyPlacement(state.board,piece,x,y,state.combo,state.bloom);state.board=result.board;state.score+=result.score;state.combo=result.combo;state.bloom=result.bloom;state.lines+=result.lines;state.multi+=result.lines>=2?1:0;state.moves++;piece.used=true;state.selected=null;audio.play(result.lines?'clear':'place');
 if(state.tray.every(p=>p.used)){state.serial++;state.tray=generatePieceSet(Math.random,state.serial);}
 if(state.mode==='classic')save.bestScore=Math.max(save.bestScore,state.score);
 save.totalScore+=result.score;save.linesCleared+=result.lines;save.highestCombo=Math.max(save.highestCombo,state.combo);
 if(state.mode==='daily'&&state.score>=500){save.dailyDate=todayKey();save.dailyStreak++;toast('Daily bloom complete! ✿');}
 if(state.mode==='level'){
  const level=LEVELS[state.level-1],stats={score:state.score,lines:state.lines,combo:state.combo,multi:state.multi};
  if(isLevelComplete(level,stats)){const stars=starsForLevel(level,stats);save.levelStars[state.level]=Math.max(save.levelStars[state.level]||0,stars);save.levelUnlocked=Math.max(save.levelUnlocked,Math.min(30,state.level+1));state.over=true;toast(`Level complete! ${stars} stars ✦`);}
  if(state.moves>=level.moves&&!state.over)state.over=true;
 }
 if(!hasAnyValidMove(state.board,state.tray))state.over=true;
 persist();renderGame();
 if(state.over)showEnd();
}
function showEnd(){
 const won=state.mode==='level'&&save.levelStars[state.level]>0;const title=won?'Garden grown!':'No more moves';const message=won?'You cleared the challenge. The next level is ready.':'That board is full of possibilities you found. Fancy another round?';
 const layer=document.createElement('div');layer.className='modal-backdrop';layer.innerHTML=`<section class="modal"><div class="modal-flower">${won?'✿':'☘'}</div><div class="eyebrow">${won?'LEVEL COMPLETE':'ROUND COMPLETE'}</div><h2>${title}</h2><p>${message}</p><div class="end-score">${state.score.toLocaleString()}<small>POINTS</small></div><button class="btn primary" data-modal="again">${won?'NEXT LEVEL':'PLAY AGAIN'}</button><button class="btn soft" data-modal="home">GARDEN HOME</button></section>`;
 root.append(layer);layer.querySelector('[data-modal="again"]')!.addEventListener('click',()=>{layer.remove();if(won&&state.level<30){state=createGame('level',state.level+1);}else state=createGame(state.mode,state.level);history=[];renderGame();});
 layer.querySelector('[data-modal="home"]')!.addEventListener('click',()=>{layer.remove();nav('menu');});
}
root.addEventListener('click',e=>{
 const target=(e.target as HTMLElement).closest<HTMLElement>('[data-action],[data-level]');if(!target)return;
 if(target.dataset.level){const level=Number(target.dataset.level);state=createGame('level',level);history=[];screen='classic';renderGame();return;}
 const action=target.dataset.action;
 if(action==='classic'||action==='restart'){state=createGame('classic',1);history=[];screen='classic';if(action==='classic')save.gamesPlayed++;renderGame();}
 else if(action==='journey')nav('journey');
 else if(action==='daily'){nav('daily');}
 else if(action==='start-daily'){state=createGame('daily',1);history=[];screen='classic';renderGame();}
 else if(action==='settings')nav('settings');else if(action==='stats')nav('stats');else if(action==='back')nav('menu');
 else if(action==='pause'){state.paused=!state.paused;toast(state.paused?'Paused':'Back in the garden');}
 else if(action==='undo'){const prev=history.pop();if(prev){state=prev;renderGame();}else toast('No move to undo yet.');}
 else if(action==='hint'){const moves=getAvailableMoves(state.board,state.tray);if(!moves.length){toast('No open placements remain.');return;}const move=moves[0];state.selected=move.pieceId;document.querySelectorAll('.piece-slot').forEach(el=>el.classList.toggle('selected',(el as HTMLElement).dataset.piece===move.pieceId));toast(`Try placing this piece near column ${move.x+1}, row ${move.y+1}.`);}
 else if(action==='burst'){if(state.bloom<100){toast('Fill the Bloom meter first.');return;}toast('Tap a 3 × 3 area to bloom it.');state.selected='__burst__';}
});
root.addEventListener('change',e=>{
 const el=e.target as HTMLInputElement;if(!el.dataset.setting)return;
 const key=el.dataset.setting as 'sound'|'music'|'vibration';save[key]=el.checked;saveData(save);audio.setEnabled(save.sound);
});
function start(){audio.setEnabled(save.sound);render();phaser=new Phaser.Game({type:Phaser.HEADLESS,width:1,height:1,scene:{create(){}}});}
start();
