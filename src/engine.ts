export const SIZE = 8;
export type Cell = number | null;
export type Board = Cell[][];
export type Point = [number, number];
export interface Shape { id: string; cells: Point[]; weight: number }
export interface Piece { id: string; shapeId: string; cells: Point[]; color: number; used: boolean }
export interface ClearResult { rows: number[]; columns: number[]; cleared: number; board: Board }
export interface PlacementResult { board: Board; cleared: number; rows: number[]; columns: number[]; lines: number; score: number; combo: number; bloom: number }
export const PALETTE = ['#ff6b75','#ffc95c','#36d7ad','#5e9cff','#a486f5','#ff82c7','#ff995f'] as const;

const SHAPES: Shape[] = [
  {id:'dot',cells:[[0,0]],weight:4},
  {id:'domino-h',cells:[[0,0],[1,0]],weight:3},{id:'domino-v',cells:[[0,0],[0,1]],weight:3},
  {id:'tri-line',cells:[[0,0],[1,0],[2,0]],weight:3},{id:'tri-corner',cells:[[0,0],[0,1],[1,1]],weight:3},{id:'tri-corner-r',cells:[[1,0],[0,1],[1,1]],weight:3},
  {id:'four-line',cells:[[0,0],[1,0],[2,0],[3,0]],weight:3},{id:'four-square',cells:[[0,0],[1,0],[0,1],[1,1]],weight:3},
  {id:'four-l',cells:[[0,0],[0,1],[0,2],[1,2]],weight:2},{id:'four-l-r',cells:[[1,0],[1,1],[0,2],[1,2]],weight:2},
  {id:'four-t',cells:[[0,0],[1,0],[2,0],[1,1]],weight:2},{id:'four-z',cells:[[0,0],[1,0],[1,1],[2,1]],weight:2},{id:'four-s',cells:[[1,0],[2,0],[0,1],[1,1]],weight:2},
  {id:'five-line',cells:[[0,0],[1,0],[2,0],[3,0],[4,0]],weight:1},{id:'five-l',cells:[[0,0],[0,1],[0,2],[0,3],[1,3]],weight:2},
  {id:'five-j',cells:[[1,0],[1,1],[1,2],[1,3],[0,3]],weight:2},{id:'five-t',cells:[[0,0],[1,0],[2,0],[1,1],[1,2]],weight:2},
  {id:'five-plus',cells:[[1,0],[0,1],[1,1],[2,1],[1,2]],weight:1},{id:'five-z',cells:[[0,0],[1,0],[1,1],[2,1],[2,2]],weight:2},
  {id:'five-stair',cells:[[0,0],[0,1],[1,1],[1,2],[2,2]],weight:2},{id:'five-corner',cells:[[0,0],[1,0],[0,1],[0,2],[1,2]],weight:2},
  {id:'six-rectangle',cells:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]],weight:1},
  {id:'six-u',cells:[[0,0],[2,0],[0,1],[1,1],[2,1],[0,2]],weight:1},
  {id:'six-wide',cells:[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1]],weight:1},
  {id:'seven-c',cells:[[0,0],[1,0],[2,0],[0,1],[0,2],[1,2],[2,2]],weight:1},
  {id:'nine-square',cells:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]],weight:1}
];
export const SHAPE_LIBRARY: readonly Shape[] = SHAPES;

export function createBoard(): Board {
  return Array.from({length:SIZE},()=>Array<Cell>(SIZE).fill(null));
}
export function cloneBoard(board: Board): Board { return board.map(row=>[...row]); }

export function rotatePiece(cells: readonly Point[], turns=1): Point[] {
  let out=cells.map(([x,y])=>[x,y] as Point);
  for(let i=0;i<((turns%4)+4)%4;i++){
    const rotated=out.map(([x,y])=>[-y,x] as Point);
    const minX=Math.min(...rotated.map(p=>p[0])),minY=Math.min(...rotated.map(p=>p[1]));
    out=rotated.map(([x,y])=>[x-minX,y-minY] as Point);
  }
  return out;
}

export function canPlacePiece(board:Board,cells:readonly Point[],x:number,y:number):boolean{
  if(!Array.isArray(board)||board.length!==SIZE||board.some(row=>!Array.isArray(row)||row.length!==SIZE))return false;
  if(!cells.length||!Number.isInteger(x)||!Number.isInteger(y))return false;
  const seen=new Set<string>();
  for(const point of cells){
    if(!Array.isArray(point)||point.length!==2)return false;
    const [dx,dy]=point;
    if(!Number.isInteger(dx)||!Number.isInteger(dy)||dx<0||dy<0)return false;
    const key=dx+','+dy;
    if(seen.has(key))return false;
    seen.add(key);
    const bx=x+dx,by=y+dy;
    if(bx<0||by<0||bx>=SIZE||by>=SIZE||board[by][bx]!==null)return false;
  }
  return true;
}

export function placePiece(board:Board,cells:readonly Point[],x:number,y:number,color:number):Board{
  if(!canPlacePiece(board,cells,x,y))throw new Error('Invalid piece placement');
  const next=cloneBoard(board);
  for(const [dx,dy] of cells)next[y+dy][x+dx]=color;
  return next;
}
export function findCompletedRows(board:Board):number[]{return board.map((row,i)=>row.every(cell=>cell!==null)?i:-1).filter(i=>i>=0);}
export function findCompletedColumns(board:Board):number[]{return Array.from({length:SIZE},(_,x)=>x).filter(x=>board.every(row=>row[x]!==null));}
export function findCompletedLines(board:Board):{rows:number[];columns:number[]}{return {rows:findCompletedRows(board),columns:findCompletedColumns(board)};}

export function clearCompletedLines(board:Board):ClearResult{
  const {rows,columns}=findCompletedLines(board),clearedKeys=new Set<string>();
  for(const y of rows)for(let x=0;x<SIZE;x++)clearedKeys.add(x+','+y);
  for(const x of columns)for(let y=0;y<SIZE;y++)clearedKeys.add(x+','+y);
  const next=cloneBoard(board);
  for(const key of clearedKeys){const [x,y]=key.split(',').map(Number);next[y][x]=null;}
  return {rows,columns,cleared:clearedKeys.size,board:next};
}
export function calculateScore(pieceCells:number,lineCount:number,combo:number):number{
  return pieceCells*10+(lineCount?lineCount*100+Math.max(0,lineCount-1)*75:0)+(lineCount?Math.max(0,combo-1)*50:0);
}
export function calculateCombo(previous:number,lineCount:number):number{return lineCount>0?previous+1:0;}

export interface AvailableMove { pieceId:string; x:number; y:number; turns:number }
export function getAvailableMoves(board:Board,pieces:readonly Piece[]):AvailableMove[]{
  const moves:AvailableMove[]=[];
  for(const piece of pieces.filter(p=>!p.used)){
    const seen=new Set<string>();
    for(let turns=0;turns<4;turns++){
      const orientation=rotatePiece(piece.cells,turns);
      const signature=orientation.map(([x,y])=>x+','+y).sort().join(';');
      if(seen.has(signature))continue;
      seen.add(signature);
      for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)
        if(canPlacePiece(board,orientation,x,y))moves.push({pieceId:piece.id,x,y,turns});
    }
  }
  return moves;
}
export function hasAnyValidMove(board:Board,pieces:readonly Piece[]):boolean{return getAvailableMoves(board,pieces).length>0;}

export function generatePieceSet(random:()=>number=Math.random,serial=0):Piece[]{
  const total=SHAPES.reduce((sum,shape)=>sum+shape.weight,0);
  return Array.from({length:3},(_,index)=>{
    let roll=Math.min(0.999999999,Math.max(0,random()))*total,shape=SHAPES[0];
    for(const candidate of SHAPES){roll-=candidate.weight;if(roll<0){shape=candidate;break;}}
    return {id:'piece-'+serial+'-'+index,shapeId:shape.id,cells:shape.cells.map(([x,y])=>[x,y] as Point),color:Math.floor(Math.min(.999999,Math.max(0,random()))*PALETTE.length),used:false};
  });
}

export function clearRegion3x3(board:Board,x:number,y:number):{board:Board;cleared:number;cells:Point[]}{
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+3>SIZE||y+3>SIZE)throw new Error('Bloom Burst region must fit inside the board');
  const next=cloneBoard(board),cells:Point[]=[];
  for(let yy=y;yy<y+3;yy++)for(let xx=x;xx<x+3;xx++)if(next[yy][xx]!==null){next[yy][xx]=null;cells.push([xx,yy]);}
  return {board:next,cleared:cells.length,cells};
}

export function applyPlacement(board:Board,piece:Piece,x:number,y:number,combo:number,bloom:number):PlacementResult{
  if(piece.used)throw new Error('Piece has already been used');
  const placed=placePiece(board,piece.cells,x,y,piece.color),result=clearCompletedLines(placed),lines=result.rows.length+result.columns.length;
  const nextCombo=calculateCombo(combo,lines),gain=lines*20;
  return {board:result.board,cleared:result.cleared,rows:result.rows,columns:result.columns,lines,score:calculateScore(piece.cells.length,lines,nextCombo),combo:nextCombo,bloom:Math.min(100,bloom+gain)};
}

export function seededRandom(seed:number):()=>number{
  let value=seed>>>0;
  return ()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296;};
}
export function hashSeed(value:string):number{
  let hash=2166136261;
  for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
