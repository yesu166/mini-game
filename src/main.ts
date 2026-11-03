import { createBoard, generatePieceSet, applyPlacement, clearRegion3x3, getAvailableMoves, hasAnyValidMove, hashSeed, PALETTE, rotatePiece, SHAPE_LIBRARY, SIZE, type Board, type Piece, type Point } from './engine';
import { clearSession, loadSave, loadSession, saveData, saveSession, todayKey, type SaveData } from './storage';
import { LEVELS, isLevelComplete, starsForLevel } from './levels';
import { audio } from './audio';
import './style.css';

type Screen='menu'|'classic'|'journey'|'daily'|'settings'|'stats'|'privacy';
interface HistoryEntry { game:GameState; save:Pick<SaveData,'bestScore'|'totalScore'|'gamesPlayed'|'linesCleared'|'highestCombo'|'levelUnlocked'|'levelStars'|'dailyDate'|'dailyStreak'>; }
interface GameState { sessionDate:string|null; board:Board; tray:Piece[]; rngSeed:number; score:number; combo:number; bloom:number; serial:number; selected:string|null; mode:'classic'|'level'|'daily'; level:number; moves:number; lines:number; multi:number; over:boolean; paused:boolean; }
const root=document.querySelector<HTMLDivElement>('#root')!;
const save:SaveData=loadSave();
let screen:Screen='menu',state:GameState=createGame('classic',1),toastTimer=0,history:HistoryEntry[]=[],lastActionAt=0,burstMode=false,burstPreview:{x:number;y:number}|null=null,hasSavedRound=false;
let drag:{pieceId:string;startX:number;startY:number;pointerId:number;grabX:number;grabY:number;moved:boolean}|null=null;
let pointerListenersReady=false,audioUnlocked=false;
const clearFx=new Set<string>();
let clearFxToken=0;

function createGame(mode:GameState['mode'],level:number):GameState{
 const seed=mode==='daily'?hashSeed('block-bloom:'+todayKey()):mode==='level'?hashSeed('block-bloom-level:'+level):((Math.random()*0xffffffff)>>>0);
 const game:GameState={sessionDate:mode==='daily'?todayKey():null,board:createBoard(),tray:[],rngSeed:seed,score:0,combo:0,bloom:0,serial:0,selected:null,mode,level,moves:0,lines:0,multi:0,over:false,paused:false};
 game.tray=generatePieceSet(()=>nextRandom(game),0);
 return game;
}
function nextRandom(game:GameState):number{
 game.rngSeed=(game.rngSeed*1664525+1013904223)>>>0;
 return game.rngSeed/4294967296;
}
function persist(){
 save.bestScore=Math.max(save.bestScore,state.mode==='classic'?state.score:0);
 saveData(save);
 if(state.over){clearSession();hasSavedRound=false;}
 else {saveSession({...state,selected:null,paused:false});hasSavedRound=true;}
}
function restoreGameSession(value:unknown):GameState|null{
 if(!value||typeof value!=='object')return null;
 const candidate=value as Partial<GameState>;
 if(!(['classic','level','daily'] as const).includes(candidate.mode as 'classic'|'level'|'daily'))return null;
 if(candidate.over===true||typeof candidate.level!=='number'||!Number.isInteger(candidate.level)||candidate.level<1||candidate.level>30)return null;
 if(candidate.mode==='daily'&&candidate.sessionDate!==todayKey())return null;
 const board=candidate.board;
 if(!Array.isArray(board)||board.length!==SIZE)return null;
 if(board.some(row=>!Array.isArray(row)||row.length!==SIZE||row.some(cell=>cell!==null&&(typeof cell!=='number'||!Number.isInteger(cell)||cell<0||cell>=PALETTE.length))))return null;
 const tray=candidate.tray;
 if(!Array.isArray(tray)||tray.length!==3)return null;
 const pieceIds=new Set<string>();
 const validPieces=tray.every(piece=>{
  if(!piece||typeof piece!=='object')return false;
  const p=piece as Piece;
  if(typeof p.id!=='string'||pieceIds.has(p.id)||typeof p.shapeId!=='string'||!SHAPE_LIBRARY.some(shape=>shape.id===p.shapeId))return false;
  pieceIds.add(p.id);
  if(typeof p.color!=='number'||!Number.isInteger(p.color)||p.color<0||p.color>=PALETTE.length||typeof p.used!=='boolean'||!Array.isArray(p.cells)||!p.cells.length)return false;
  const seen=new Set<string>();
  return p.cells.every(point=>{
   if(!Array.isArray(point)||point.length!==2||typeof point[0]!=='number'||typeof point[1]!=='number'||!Number.isInteger(point[0])||!Number.isInteger(point[1])||point[0]<0||point[1]<0||point[0]>=SIZE||point[1]>=SIZE)return false;
   const key=point[0]+','+point[1];if(seen.has(key))return false;seen.add(key);return true;
  });
 });
 if(!validPieces)return null;
 const numericFields:unknown[]=[candidate.rngSeed,candidate.score,candidate.combo,candidate.serial,candidate.moves,candidate.lines,candidate.multi,candidate.bloom];
 if(numericFields.some(value=>typeof value!=='number'||!Number.isSafeInteger(value)||value<0))return null;
 if(Number(candidate.bloom)>100)return null;
 if(candidate.sessionDate!==null&&typeof candidate.sessionDate!=='string')return null;
 const restored:GameState={
  sessionDate:candidate.sessionDate??null,
  board:(board as Board).map(row=>[...row]),
  tray:(tray as Piece[]).map(piece=>({...piece,cells:piece.cells.map(([x,y])=>[x,y] as Point)})),
  rngSeed:Number(candidate.rngSeed)>>>0,
  score:Number(candidate.score),
  combo:Number(candidate.combo),
  bloom:Number(candidate.bloom),
  serial:Number(candidate.serial),
  selected:null,
  mode:candidate.mode as GameState['mode'],
  level:Number(candidate.level),
  moves:Number(candidate.moves),
  lines:Number(candidate.lines),
  multi:Number(candidate.multi),
  over:false,
  paused:false
 };
 return hasAnyValidMove(restored.board,restored.tray)||restored.bloom>=100?restored:null;
}
const storedRound=loadSession();
const recoveredRound=restoreGameSession(storedRound);
if(recoveredRound){state=recoveredRound;hasSavedRound=true;}else if(storedRound!==null){clearSession();}
function toast(message:string){const el=document.querySelector('#toast');if(el){el.textContent=message;el.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>el.classList.remove('show'),1700);}}
function nav(next:Screen){screen=next;render();}
function button(label:string,action:string,cls='btn'):string{return `<button class="${cls}" data-action="${action}">${label}</button>`;}
function header(title:string,sub=''){return `<header class="topbar"><button class="icon-btn" data-action="back" aria-label="Back">←</button><div><div class="eyebrow">BLOCK BLOOM</div><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div><button class="icon-btn" data-action="settings" aria-label="Settings">⚙</button></header>`;}
function render(){
 if(screen==='menu'){root.innerHTML=`<main class="shell home"><div class="sunburst"></div><div class="brand-mark">✿</div><div class="eyebrow">A LITTLE PUZZLE GARDEN</div><h1 class="wordmark">BLOCK<br/><span>BLOOM</span></h1><p class="lede">Place with purpose. Clear with joy.</p><div class="home-score"><span>PERSONAL BEST</span><strong>${save.bestScore.toLocaleString()}</strong></div><div class="menu-actions">${hasSavedRound?button('↻ &nbsp; CONTINUE ROUND','continue','btn primary'):''}${button('▶ &nbsp; PLAY CLASSIC','classic','btn primary')}${button('✿ &nbsp; LEVEL JOURNEY','journey','btn')}${button('☀ &nbsp; DAILY BLOOM','daily','btn')}<div class="small-actions">${button('◷ STATS','stats','btn soft')}${button('⚙ SETTINGS','settings','btn soft')}${button('ⓘ PRIVACY','privacy','btn soft')}</div></div><div class="footer-note">A fresh board. A fresh chance to bloom.</div></main><div id="toast" class="toast"></div>`;return;}
 if(screen==='settings'){root.innerHTML=`<main class="shell page">${header('Settings','Make your garden feel like yours.') }<section class="panel settings-list"><div class="setting"><div><b>Sound effects</b><small>Little notes for every good move</small></div><input type="checkbox" data-setting="sound" ${save.sound?'checked':''}></div><div class="setting"><div><b>Background music</b><small>Soft ambient synth, only when enabled</small></div><input type="checkbox" data-setting="music" ${save.music?'checked':''}></div><div class="setting"><div><b>Vibration</b><small>Short feedback on supported devices</small></div><input type="checkbox" data-setting="vibration" ${save.vibration?'checked':''}></div></section><section class="panel"><h3>How to play</h3><p>Drag a piece onto the board. Fill an entire row or column to clear it. Clear several lines together for a bigger score. Bloom Burst clears the occupied cells inside a selected 3 × 3 area once the meter is full.</p></section>${button('BACK TO GARDEN','back','btn primary')}</main>`;return;}
 if(screen==='stats'){root.innerHTML=`<main class="shell page">${header('Your garden','Every round makes you sharper.') }<div class="stat-grid"><div class="panel"><small>BEST SCORE</small><strong>${save.bestScore.toLocaleString()}</strong></div><div class="panel"><small>TOTAL POINTS</small><strong>${save.totalScore.toLocaleString()}</strong></div><div class="panel"><small>GAMES PLAYED</small><strong>${save.gamesPlayed}</strong></div><div class="panel"><small>LINES CLEARED</small><strong>${save.linesCleared}</strong></div><div class="panel"><small>BEST COMBO</small><strong>${save.highestCombo}×</strong></div><div class="panel"><small>DAILY STREAK</small><strong>${save.dailyStreak} ✦</strong></div></div>${button('BACK TO GARDEN','back','btn primary')}</main>`;return;}
 if(screen==='privacy'){root.innerHTML=`<main class="shell page">${header('Privacy','Simple by design.') }<section class="panel"><h3>Local game data</h3><p>BLOCK BLOOM stores your best score, game statistics, level stars, settings and daily challenge completion in this browser's local storage. No account or remote gameplay telemetry is enabled.</p><h3>Advertising</h3><p>No advertising SDK is enabled. Any future advertising integration must disclose the provider and obtain required consent before release.</p><h3>External resources</h3><p>The interface currently requests Google Fonts when online. The game engine itself does not need an internet connection.</p></section>${button('BACK','back','btn primary')}</main>`;return;}
 if(screen==='journey'){root.innerHTML=`<main class="shell page">${header('Level journey','Thirty tiny challenges. One growing garden.') }<div class="level-grid">${LEVELS.map(l=>{const unlocked=l.id<=save.levelUnlocked,stars=save.levelStars[l.id]||0,chapterHead=[1,11,21].includes(l.id)?`<div class="chapter-heading"><span>CHAPTER ${String(l.chapter).padStart(2,'0')}</span><b>${l.chapterName}</b></div>`:'';return chapterHead+`<button class="level-card ${unlocked?'':'locked'}" data-level="${l.id}" ${unlocked?'':'disabled'}><span>${String(l.id).padStart(2,'0')}</span><b>${l.name}</b><em>${l.objective.toUpperCase()} · ${l.target}</em><small>${unlocked?'★'.repeat(stars)+'☆'.repeat(3-stars):'🔒 LOCKED'}</small></button>`;}).join('')}</div>${button('BACK TO GARDEN','back','btn primary')}</main>`;return;}
 if(screen==='daily'){const done=save.dailyDate===todayKey();root.innerHTML=`<main class="shell page">${header('Daily bloom','One seed. One challenge. Every day.') }<section class="daily-card"><div class="daily-flower">✿</div><div class="eyebrow">TODAY'S CHALLENGE</div><h2>Make 500 points</h2><p>Build a beautiful chain of clears. You have a fresh board and three pieces at a time.</p><div class="daily-status">${done?'✓ COMPLETED TODAY':'✦ '+save.dailyStreak+' DAY STREAK'}</div>${done?button('PLAY CLASSIC','classic','btn primary'):button('START DAILY CHALLENGE','start-daily','btn primary')}</section>${button('BACK TO GARDEN','back','btn soft')}</main>`;return;}
 renderGame();
}
function pieceMarkup(piece:Piece):string{
 const maxX=Math.max(...piece.cells.map(c=>c[0]))+1,maxY=Math.max(...piece.cells.map(c=>c[1]))+1;
 return `<span class="mini-grid" style="--w:${maxX};--h:${maxY}">${piece.cells.map(([x,y])=>`<i data-px="${x}" data-py="${y}" style="grid-column:${x+1};grid-row:${y+1};--block:${PALETTE[piece.color]}"></i>`).join('')}</span>`;
}
function renderGame(){
 if(state.over){clearSession();hasSavedRound=false;}else{saveSession({...state,selected:null,paused:false});hasSavedRound=true;}
 const level=state.mode==='level'?LEVELS[state.level-1]:null;
 root.innerHTML=`<main class="shell game-shell"><header class="game-head"><button class="icon-btn" data-action="back">←</button><div><div class="eyebrow">${state.mode==='classic'?'CLASSIC MODE':state.mode==='daily'?'DAILY BLOOM':'LEVEL '+state.level+' / 30 · '+(level?.chapterName??'')}</div><div class="score-number" id="score">${state.score.toLocaleString()}</div><small>${level?level.objective.toUpperCase()+' · '+level.target+' TARGET · '+state.moves+'/'+level.moves+' MOVES':state.mode==='daily'?'500 POINT DAILY GOAL':'ENDLESS SCORE'}</small></div><button class="icon-btn" data-action="pause">Ⅱ</button></header><div class="meta-row"><div class="meta-pill">✦ <b>${state.combo}</b> COMBO</div><div class="meta-pill bloom-pill"><span>✿ BLOOM</span><div class="meter"><i id="bloom-meter" style="width:${state.bloom}%"></i></div><b>${state.bloom}%</b></div><button class="burst-btn" data-action="burst" ${state.bloom<100?'disabled':''}>✺ BURST</button></div><section class="board-wrap"><div class="board" id="board" aria-label="Eight by eight puzzle board">${state.board.flatMap((row,y)=>row.map((cell,x)=>`<div class="cell ${cell===null?'':'filled'} ${clearFx.has(x+','+y)?'clear-fx':''} ${burstMode&&burstPreview&&x>=burstPreview.x&&x<burstPreview.x+3&&y>=burstPreview.y&&y<burstPreview.y+3?'burst-target':''}" data-x="${x}" data-y="${y}" ${cell===null?'':`style="--block:${PALETTE[cell]}"`}></div>`)).join('')}</div></section>${burstMode?'<div class="burst-confirm-bar"><span>✦ 3 × 3 TARGET</span><button class="btn primary" data-action="confirm-burst" '+(burstPreview?'':'disabled')+'>CLEAR REGION</button><button class="btn soft" data-action="cancel-burst">CANCEL</button></div>':''}<div class="helper">${state.paused?'Game paused. Resume when ready.':level?level.hint:'Drag a shape onto the board. Tap a shape then tap the board to place it.'}</div><div class="tray" id="tray">${state.tray.map(p=>`<button class="piece-slot ${p.used?'used':''} ${state.selected===p.id?'selected':''}" data-piece="${p.id}" ${p.used?'disabled':''} aria-label="Select shape"><span class="mini-piece">${pieceMarkup(p)}</span><small>${p.cells.length}</small></button>`).join('')}</div><div class="game-actions">${button('↶ UNDO','undo','btn soft')}${button('↻ ROTATE','rotate','btn soft')}${button('💡 HINT','hint','btn soft')}${button('↻ RESET','restart','btn soft')}</div><div id="toast" class="toast"></div></main>`;
 if(state.paused){
  const layer=document.createElement('div');layer.className='modal-backdrop pause-backdrop';
  layer.innerHTML='<section class="modal pause-modal"><div class="modal-flower">Ⅱ</div><div class="eyebrow">TAKE A BREATH</div><h2>Garden paused</h2><p>Your board is safe. Take a moment, then come back for the next move.</p><button class="btn primary" data-pause="resume">RESUME GAME</button><button class="btn soft" data-pause="restart">RESTART ROUND</button><button class="btn soft" data-pause="home">GARDEN HOME</button></section>';
  root.append(layer);
  layer.querySelector('[data-pause="resume"]')?.addEventListener('click',()=>{state.paused=false;renderGame();});
  layer.querySelector('[data-pause="restart"]')?.addEventListener('click',()=>{state=createGame(state.mode,state.level);history=[];burstMode=false;burstPreview=null;renderGame();});
  layer.querySelector('[data-pause="home"]')?.addEventListener('click',()=>{state.paused=false;burstMode=false;nav('menu');});
 }
 const boardWrap=document.querySelector<HTMLElement>('.board-wrap');
 if(boardWrap){
  boardWrap.addEventListener('pointermove',event=>{
   if(event.pointerType!=='mouse'||drag)return;
   const rect=boardWrap.getBoundingClientRect();
   const nx=(event.clientX-rect.left)/rect.width-.5;
   const ny=(event.clientY-rect.top)/rect.height-.5;
   boardWrap.style.setProperty('--tilt-x',(nx*2.1).toFixed(2)+'deg');
   boardWrap.style.setProperty('--tilt-y',(-ny*2.1).toFixed(2)+'deg');
  });
  boardWrap.addEventListener('pointerleave',()=>{
   boardWrap.style.setProperty('--tilt-x','0deg');
   boardWrap.style.setProperty('--tilt-y','0deg');
  });
 }
 bindGameEvents();
}
function takeSnapshot(){
 history.push({
  game:{...state,board:state.board.map(r=>[...r]),tray:state.tray.map(p=>({...p,cells:p.cells.map(c=>[...c] as Point)}))},
  save:{bestScore:save.bestScore,totalScore:save.totalScore,gamesPlayed:save.gamesPlayed,linesCleared:save.linesCleared,highestCombo:save.highestCombo,levelUnlocked:save.levelUnlocked,levelStars:{...save.levelStars},dailyDate:save.dailyDate,dailyStreak:save.dailyStreak}
 });
 if(history.length>25)history.shift();
}
function restoreSnapshot(entry:HistoryEntry){
 state=entry.game;
 Object.assign(save,entry.save,{levelStars:{...entry.save.levelStars}});
 burstMode=false;burstPreview=null;persist();renderGame();
}
function applyClearFx(rows:number[],columns:number[]){
 clearFx.clear();
 for(const y of rows)for(let x=0;x<SIZE;x++)clearFx.add(x+','+y);
 for(const x of columns)for(let y=0;y<SIZE;y++)clearFx.add(x+','+y);
 const token=++clearFxToken;
 window.setTimeout(()=>{
  if(token!==clearFxToken)return;
  document.querySelectorAll('.cell.clear-fx').forEach(cell=>cell.classList.remove('clear-fx'));
  clearFx.clear();
 },520);
}
function showScoreFx(points:number,lines:number,kind:'score'|'burst'='score'){
 const wrap=document.querySelector<HTMLElement>('.board-wrap');if(!wrap)return;
 const popup=document.createElement('div');
 popup.className='score-pop'+(kind==='burst'?' burst-pop':lines>1?' combo-pop':'');
 popup.textContent=(kind==='burst'?'✦ BLOOM +':'+')+points.toLocaleString()+(lines>1?'  /  '+lines+' LINES':lines===1?'  /  LINE':'');
 wrap.append(popup);window.setTimeout(()=>popup.remove(),900);
 if(lines===0&&kind!=='burst')return;
 for(let i=0;i<14;i++){
  const particle=document.createElement('i');particle.className='bloom-particle';
  const angle=(Math.PI*2*i)/14+(Math.random()-.5)*.24,distance=38+Math.random()*54;
  particle.style.setProperty('--tx',Math.cos(angle)*distance+'px');
  particle.style.setProperty('--ty',Math.sin(angle)*distance+'px');
  particle.style.setProperty('--scale',(0.55+Math.random()*.9).toString());
  wrap.append(particle);window.setTimeout(()=>particle.remove(),820);
 }
}
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
  if(burstMode){selectBurstRegion(x,y);return;}
  const piece=state.tray.find(p=>p.id===state.selected&&!p.used);
  if(piece)commit(piece,x,y);
 });
 document.querySelectorAll<HTMLElement>('[data-piece]').forEach(el=>{
  el.addEventListener('pointerdown',e=>{
   if(state.paused||state.over||burstMode)return;
   const p=state.tray.find(v=>v.id===el.dataset.piece);if(!p||p.used)return;
   const pe=e as PointerEvent;
   const source=(pe.target as HTMLElement).closest<HTMLElement>('[data-px]');
   drag={pieceId:p.id,startX:pe.clientX,startY:pe.clientY,pointerId:pe.pointerId,grabX:Number(source?.dataset.px??p.cells[0][0]),grabY:Number(source?.dataset.py??p.cells[0][1]),moved:false};
   state.selected=p.id;
   document.querySelectorAll('.piece-slot').forEach(n=>n.classList.toggle('selected',(n as HTMLElement).dataset.piece===p.id));
   el.classList.add('dragging');
   pe.preventDefault();
  });
 });
 if(!pointerListenersReady){
  window.addEventListener('pointermove',handlePointerMove,{passive:true});
  window.addEventListener('pointerup',handlePointerUp);
  window.addEventListener('pointercancel',handlePointerCancel);
  pointerListenersReady=true;
 }
}
function clearBoardPreview(){
 document.querySelectorAll('.cell.preview-valid,.cell.preview-invalid,.cell.burst-target').forEach(el=>el.classList.remove('preview-valid','preview-invalid','burst-target'));
}
function updateBoardPreview(clientX:number,clientY:number){
 clearBoardPreview();
 const point=cellAt(clientX,clientY);if(!point)return;
 if(burstMode){
  for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){
   const cell=document.querySelector<HTMLElement>('.cell[data-x="'+(point.x+dx)+'"][data-y="'+(point.y+dy)+'"]');
   if(cell&&point.x+2<SIZE&&point.y+2<SIZE)cell.classList.add('burst-target');
  }
  return;
 }
 if(!drag)return;
 const piece=state.tray.find(p=>p.id===drag!.pieceId);if(!piece)return;
 const originX=point.x-drag.grabX,originY=point.y-drag.grabY;
 const valid=canFitAt(piece,originX,originY);
 for(const [dx,dy] of piece.cells){
  const cell=document.querySelector<HTMLElement>('.cell[data-x="'+(originX+dx)+'"][data-y="'+(originY+dy)+'"]');
  if(cell)cell.classList.add(valid?'preview-valid':'preview-invalid');
 }
}
function handlePointerMove(e:PointerEvent){
 if(!drag||drag.pointerId!==e.pointerId)return;
 if(!drag.moved&&Math.abs(e.clientX-drag.startX)+Math.abs(e.clientY-drag.startY)>7){
  drag.moved=true;
  document.querySelector('[data-piece="'+drag.pieceId+'"]')?.classList.add('dragging');
 }
 if(drag.moved)updateBoardPreview(e.clientX,e.clientY);
}
function handlePointerUp(e:PointerEvent){
 if(!drag||drag.pointerId!==e.pointerId)return;
 const active=drag;drag=null;
 document.querySelector('[data-piece="'+active.pieceId+'"]')?.classList.remove('dragging');
 clearBoardPreview();
 if(active.moved){
  const point=cellAt(e.clientX,e.clientY);
  if(point){
   const piece=state.tray.find(p=>p.id===active.pieceId);
   if(piece)commit(piece,point.x-active.grabX,point.y-active.grabY);
  }else toast('Drop your piece on the board.');
 }else{
  state.selected=active.pieceId;
  document.querySelectorAll('.piece-slot').forEach(n=>n.classList.toggle('selected',(n as HTMLElement).dataset.piece===state.selected));
 }
}
function handlePointerCancel(e:PointerEvent){
 if(!drag||drag.pointerId!==e.pointerId)return;
 document.querySelector('[data-piece="'+drag.pieceId+'"]')?.classList.remove('dragging');
 drag=null;clearBoardPreview();
}
function commit(piece:Piece,x:number,y:number){
 if(state.paused||state.over||piece.used||!canFitAt(piece,x,y)){toast('That spot does not fit.');return;}
 const now=Date.now();if(now-lastActionAt<70)return;lastActionAt=now;
 takeSnapshot();const result=applyPlacement(state.board,piece,x,y,state.combo,state.bloom);
 state.board=result.board;state.score+=result.score;state.combo=result.combo;state.bloom=result.bloom;state.lines+=result.lines;state.multi+=result.lines>=2?1:0;state.moves++;piece.used=true;state.selected=null;
 if(result.lines){applyClearFx(result.rows,result.columns);audio.play(result.lines>1?'combo':'clear');if(navigator.vibrate&&save.vibration)navigator.vibrate(result.lines>1?[20,30,30]:15);}else audio.play('place');
 if(state.tray.every(p=>p.used)){state.serial++;state.tray=generatePieceSet(()=>nextRandom(state),state.serial);}
 save.bestScore=Math.max(save.bestScore,state.mode==='classic'?state.score:0);save.totalScore+=result.score;save.linesCleared+=result.lines;save.highestCombo=Math.max(save.highestCombo,state.combo);
 if(state.mode==='daily'&&state.score>=500&&save.dailyDate!==todayKey()){
  const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
  save.dailyStreak=save.dailyDate===todayKey(yesterday)?save.dailyStreak+1:1;
  save.dailyDate=todayKey();toast('Daily bloom complete! ✿');
 }
 if(state.mode==='level'){
  const level=LEVELS[state.level-1],stats={score:state.score,lines:state.lines,combo:state.combo,multi:state.multi};
  if(isLevelComplete(level,stats)){const stars=starsForLevel(level,stats);save.levelStars[state.level]=Math.max(save.levelStars[state.level]||0,stars);save.levelUnlocked=Math.max(save.levelUnlocked,Math.min(30,state.level+1));state.over=true;}
  else if(state.moves>=level.moves)state.over=true;
 }
 if(!hasAnyValidMove(state.board,state.tray)&&state.bloom<100)state.over=true;
 persist();renderGame();showScoreFx(result.score,result.lines);if(state.over)showEnd();
}
function canFitAt(piece:Piece,x:number,y:number):boolean{return piece.cells.every(([dx,dy])=>x+dx<SIZE&&y+dy<SIZE&&x+dx>=0&&y+dy>=0&&state.board[y+dy]?.[x+dx]===null);}
function selectBurstRegion(x:number,y:number){
 if(x+3>SIZE||y+3>SIZE){toast('Choose a 3 × 3 area fully on the board.');return;}
 const candidate=clearRegion3x3(state.board,x,y);
 if(!candidate.cleared){toast('Choose an area with blocks inside.');return;}
 burstPreview={x,y};renderGame();toast(candidate.cleared+' blocks selected. Confirm the Bloom Burst.');
}
function activateBurstAt(x:number,y:number){
 if(state.bloom<100||!burstMode){toast('Bloom Burst is not ready.');return;}
 if(x+3>SIZE||y+3>SIZE){toast('Choose a 3 × 3 area fully on the board.');return;}
 const result=clearRegion3x3(state.board,x,y);
 if(!result.cleared){toast('Choose an area with blocks inside.');return;}
 takeSnapshot();state.board=result.board;
 const bonus=result.cleared*15;state.score+=bonus;state.bloom=0;state.combo=0;burstMode=false;burstPreview=null;state.moves++;
 save.totalScore+=bonus;save.bestScore=Math.max(save.bestScore,state.mode==='classic'?state.score:0);
 if(state.mode==='level'&&state.moves>=LEVELS[state.level-1].moves)state.over=!isLevelComplete(LEVELS[state.level-1],{score:state.score,lines:state.lines,combo:state.combo,multi:state.multi});
 if(!hasAnyValidMove(state.board,state.tray))state.over=true;
 persist();audio.play('bloom');
 if(navigator.vibrate&&save.vibration)navigator.vibrate([25,35,50]);
 renderGame();showScoreFx(bonus,0,'burst');toast('Bloom Burst! +'+bonus+' ✿');if(state.over)showEnd();
}
function showEnd(){
 const won=state.mode==='level'&&save.levelStars[state.level]>0,daily=state.mode==='daily'&&save.dailyDate===todayKey();
 const title=won?'Garden grown!':daily?'Daily bloom complete!':'No more moves',message=won?'You cleared the challenge. The next level is ready.':daily?'A lovely score. Come back tomorrow for a fresh challenge.':'That board gave you a proper puzzle. Fancy another round?';
 const layer=document.createElement('div');layer.className='modal-backdrop';layer.innerHTML=`<section class="modal"><div class="modal-flower">${won||daily?'✿':'☘'}</div><div class="eyebrow">${won?'LEVEL COMPLETE':daily?'DAILY COMPLETE':'ROUND COMPLETE'}</div><h2>${title}</h2><p>${message}</p><div class="end-score">${state.score.toLocaleString()}<small>POINTS</small></div><button class="btn primary" data-modal="again">${won&&state.level<30?'NEXT LEVEL':'PLAY AGAIN'}</button><button class="btn soft" data-modal="home">GARDEN HOME</button></section>`;
 root.append(layer);layer.querySelector('[data-modal="again"]')!.addEventListener('click',()=>{layer.remove();state=createGame(won&&state.level<30?'level':state.mode,won&&state.level<30?state.level+1:state.level);history=[];burstMode=false;burstPreview=null;renderGame();});
 layer.querySelector('[data-modal="home"]')!.addEventListener('click',()=>{layer.remove();nav('menu');});
}
root.addEventListener('click',e=>{
 const target=(e.target as HTMLElement).closest<HTMLElement>('[data-action],[data-level]');if(!target)return;
 if(target.dataset.level){const level=Number(target.dataset.level);state=createGame('level',level);history=[];save.gamesPlayed++;persist();screen='classic';burstMode=false;renderGame();return;}
 const action=target.dataset.action;
 if(action==='continue'){state.paused=false;state.selected=null;history=[];burstMode=false;burstPreview=null;screen='classic';renderGame();}
 else if(action==='classic'||action==='restart'){const mode=action==='restart'?state.mode:'classic',level=action==='restart'?state.level:1;state=createGame(mode,level);history=[];burstMode=false;burstPreview=null;screen='classic';if(action==='classic')save.gamesPlayed++;persist();renderGame();}
 else if(action==='journey')nav('journey');else if(action==='daily')nav('daily');
 else if(action==='start-daily'){if(save.dailyDate===todayKey()){toast('Today’s challenge is already complete.');return;}state=createGame('daily',1);history=[];burstMode=false;screen='classic';save.gamesPlayed++;persist();renderGame();}
 else if(action==='settings')nav('settings');else if(action==='stats')nav('stats');else if(action==='privacy')nav('privacy');else if(action==='back'){burstMode=false;burstPreview=null;nav('menu');}
 else if(action==='pause'){state.paused=!state.paused;renderGame();}
 else if(action==='undo'){const prev=history.pop();if(prev)restoreSnapshot(prev);else toast('No move to undo yet.');}
 else if(action==='rotate'){if(state.paused||state.over)return;burstMode=false;burstPreview=null;const piece=state.tray.find(p=>p.id===state.selected&&!p.used);if(!piece){toast('Select a piece first.');return;}piece.cells=rotatePiece(piece.cells);renderGame();toast('Piece rotated.');}
 else if(action==='confirm-burst'){if(!burstPreview){toast('Choose a 3 × 3 region first.');return;}activateBurstAt(burstPreview.x,burstPreview.y);}
 else if(action==='cancel-burst'){burstMode=false;burstPreview=null;renderGame();}
 else if(action==='hint'){if(state.paused||state.over)return;burstMode=false;burstPreview=null;const moves=getAvailableMoves(state.board,state.tray);if(!moves.length){toast('No open placements remain.');return;}const move=moves[0],hintPiece=state.tray.find(p=>p.id===move.pieceId);if(hintPiece&&move.turns>0){hintPiece.cells=rotatePiece(hintPiece.cells,move.turns);renderGame();}state.selected=move.pieceId;document.querySelectorAll('.piece-slot').forEach(el=>el.classList.toggle('selected',(el as HTMLElement).dataset.piece===move.pieceId));toast(`Try column ${move.x+1}, row ${move.y+1}.`);}
 else if(action==='burst'){if(state.bloom<100){toast('Fill the Bloom meter first.');return;}burstMode=true;burstPreview=null;state.selected=null;renderGame();toast('Tap a 3 × 3 area on the board to preview it.');}
});
root.addEventListener('change',e=>{
 const el=e.target as HTMLInputElement;if(!el.dataset.setting)return;
 const key=el.dataset.setting as 'sound'|'music'|'vibration';save[key]=el.checked;saveData(save);audio.setEnabled(save.sound);audio.setMusicEnabled(save.music);
});
audio.setEnabled(save.sound);
render();
window.addEventListener('pointerdown',()=>{if(audioUnlocked)return;audioUnlocked=true;if(save.music)audio.setMusicEnabled(true);},{once:true,passive:true});
window.addEventListener('keydown',e=>{
 if(screen!=='classic'||e.repeat||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
 if(e.key==='Escape'){e.preventDefault();state.paused=!state.paused;renderGame();}
 else if((e.key==='r'||e.key==='R')&&!state.paused&&!state.over){const piece=state.tray.find(p=>p.id===state.selected&&!p.used);if(piece){piece.cells=rotatePiece(piece.cells);renderGame();}}
 else if(e.key==='Backspace'&&!state.paused){e.preventDefault();const previous=history.pop();if(previous)restoreSnapshot(previous);}
});
if(import.meta.env.PROD&&'serviceWorker' in navigator){
 window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});
}
