import {describe,it,expect} from 'vitest';
import {createBoard,cloneBoard,canPlacePiece,placePiece,findCompletedRows,findCompletedColumns,clearCompletedLines,rotatePiece,generatePieceSet,getAvailableMoves,hasAnyValidMove,applyPlacement,clearRegion3x3,findColorClusters,hashSeed,seededRandom,SIZE,SHAPE_LIBRARY,type Piece} from './engine';

describe('BLOCK BLOOM deterministic puzzle engine',()=>{
 it('creates an empty 8×8 board and clones without aliasing',()=>{
  const board=createBoard(),copy=cloneBoard(board);
  expect(board).toHaveLength(SIZE);expect(board[0]).toHaveLength(SIZE);
  copy[0][0]=1;expect(board[0][0]).toBeNull();
 });
 it('rejects invalid, overlapping, duplicate and out-of-bounds placements',()=>{
  const board=createBoard();
  expect(canPlacePiece(board,[[0,0],[1,0]],0,0)).toBe(true);
  expect(canPlacePiece(board,[[0,0],[1,0]],7,0)).toBe(false);
  expect(canPlacePiece(board,[[0,0]],-1,0)).toBe(false);
  expect(canPlacePiece(board,[],0,0)).toBe(false);
  expect(canPlacePiece(board,[[0,0],[0,0]],0,0)).toBe(false);
  const placed=placePiece(board,[[0,0]],0,0,2);
  expect(canPlacePiece(placed,[[0,0]],0,0)).toBe(false);
  expect(()=>placePiece(placed,[[0,0]],0,0,2)).toThrow();
 });
 it('rotates each shape into non-negative normalized coordinates',()=>{
  expect(rotatePiece([[0,0],[1,0],[2,0]])).toEqual([[0,0],[0,1],[0,2]]);
  expect(rotatePiece([[0,0],[1,0],[2,0]],2)).toEqual([[2,0],[1,0],[0,0]]);
  for(const shape of SHAPE_LIBRARY){
   const rotated=rotatePiece(shape.cells);
   expect(new Set(rotated.map(p=>p.join(','))).size).toBe(shape.cells.length);
   expect(rotated.every(([x,y])=>x>=0&&y>=0)).toBe(true);
  }
 });
 it('finds simultaneous rows and columns and counts intersections once',()=>{
  const board=createBoard();for(let x=0;x<SIZE;x++)board[0][x]=1;for(let y=0;y<SIZE;y++)board[y][0]=2;
  expect(findCompletedRows(board)).toEqual([0]);expect(findCompletedColumns(board)).toEqual([0]);
  const cleared=clearCompletedLines(board);
  expect(cleared.cleared).toBe(15);expect(cleared.board.flat().every(v=>v===null)).toBe(true);
  expect(board[0][1]).toBe(1);
 });
 it('generates three stable, unique, valid shapes for a deterministic random source',()=>{
  const pieces=generatePieceSet(()=>0.1,4);
  expect(pieces).toHaveLength(3);expect(pieces[0].id).toBe('piece-4-0');
  expect(new Set(pieces.map(p=>p.id)).size).toBe(3);
  expect(pieces.every(p=>p.cells.length>0)).toBe(true);
 });
 it('enumerates placements and detects a genuinely blocked board',()=>{
  const pieces=generatePieceSet(()=>0);
  expect(getAvailableMoves(createBoard(),pieces).length).toBeGreaterThan(0);
  expect(hasAnyValidMove(createBoard(),pieces)).toBe(true);
  const full=createBoard().map(row=>row.map(()=>0));
  expect(hasAnyValidMove(full,pieces)).toBe(false);
  expect(getAvailableMoves(full,pieces)).toHaveLength(0);
 });
 it('scores line clear and consecutive combo exactly once',()=>{
  const board=createBoard();for(let x=0;x<7;x++)board[0][x]=1;
  const dot:Piece={id:'dot',shapeId:'dot',cells:[[0,0]],color:2,used:false};
  const result=applyPlacement(board,dot,7,0,1,0);
  expect(result.lines).toBe(1);expect(result.combo).toBe(2);expect(result.score).toBe(160);
  expect(result.board[0].every(v=>v===null)).toBe(true);
 });
 it('breaks combo when a move clears no line',()=>{
  const dot:Piece={id:'d',shapeId:'dot',cells:[[0,0]],color:0,used:false};
  expect(applyPlacement(createBoard(),dot,0,0,4,60).combo).toBe(0);
 });
 it('does not apply a used piece twice',()=>{
  const piece:Piece={id:'used',shapeId:'dot',cells:[[0,0]],color:1,used:true};
  expect(()=>applyPlacement(createBoard(),piece,0,0,0,0)).toThrow();
 });
 it('clears only occupied cells in an in-bounds 3×3 Bloom Burst',()=>{
  const board=createBoard();board[1][1]=1;board[2][2]=2;board[3][3]=3;board[4][4]=4;
  const result=clearRegion3x3(board,1,1);
  expect(result.cleared).toBe(3);expect(result.board[2][2]).toBeNull();expect(result.board[4][4]).toBe(4);
  expect(()=>clearRegion3x3(board,6,6)).toThrow();
 });
 it('creates repeatable daily random streams from a seed',()=>{
  const a=seededRandom(hashSeed('2026-11-04')),b=seededRandom(hashSeed('2026-11-04'));
  expect(Array.from({length:10},a)).toEqual(Array.from({length:10},b));
 });
 it('does not declare game-over when a remaining piece fits after rotation',()=>{
  const board=createBoard();for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)board[y][x]=0;
  board[0][0]=null;board[1][0]=null;board[2][0]=null;
  const horizontal:Piece={id:'line',shapeId:'line',cells:[[0,0],[1,0],[2,0]],color:1,used:false};
  expect(getAvailableMoves(board,[horizontal]).some(move=>move.turns===1)).toBe(true);
  expect(hasAnyValidMove(board,[horizontal])).toBe(true);
 });

 it('finds only orthogonally connected groups of four or more matching colours',()=>{
  const board=createBoard();
  board[1][1]=2;board[1][2]=2;board[2][1]=2;board[2][2]=2;
  board[5][4]=3;board[6][5]=3;board[5][6]=3;board[6][7]=3;
  expect(findColorClusters(board)).toHaveLength(1);
  expect(findColorClusters(board)[0]).toHaveLength(4);
  expect(findColorClusters(board,5)).toHaveLength(0);
 });
 it('clears a four-block colour bloom and rewards it with score and bloom charge',()=>{
  const board=createBoard();
  board[2][2]=4;board[2][3]=4;board[3][2]=4;
  const dot:Piece={id:'match-dot',shapeId:'dot',cells:[[0,0]],color:4,used:false};
  const result=applyPlacement(board,dot,3,3,0,0);
  expect(result.clusters).toHaveLength(1);
  expect(result.clusterCells).toBe(4);
  expect(result.board[2][2]).toBeNull();
  expect(result.board[2][3]).toBeNull();
  expect(result.board[3][2]).toBeNull();
  expect(result.board[3][3]).toBeNull();
  expect(result.score).toBe(98);
  expect(result.bloom).toBe(24);
 });
 it('does not instantly clear a fresh piece just because its own shape has four connected cells',()=>{
  const square:Piece={id:'fresh-square',shapeId:'four-square',cells:[[0,0],[1,0],[0,1],[1,1]],color:2,used:false};
  const result=applyPlacement(createBoard(),square,2,2,0,0);
  expect(result.clusters).toHaveLength(0);
  expect(result.clusterCells).toBe(0);
  expect(result.board[2][2]).toBe(2);
  expect(result.board[2][3]).toBe(2);
  expect(result.board[3][2]).toBe(2);
  expect(result.board[3][3]).toBe(2);
 });
 it('does not treat diagonal same-colour blocks as a match',()=>{
  const board=createBoard();
  board[0][0]=1;board[1][1]=1;board[2][2]=1;board[3][3]=1;
  expect(findColorClusters(board)).toHaveLength(0);
 });
});
