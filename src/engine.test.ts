import {describe,it,expect} from 'vitest';
import {createBoard,cloneBoard,canPlacePiece,placePiece,findCompletedRows,findCompletedColumns,clearCompletedLines,rotatePiece,generatePieceSet,getAvailableMoves,hasAnyValidMove,applyPlacement,SIZE} from './engine';
describe('BLOCK BLOOM engine',()=>{
 it('creates an empty 8x8 board and clones independently',()=>{const b=createBoard(),c=cloneBoard(b);expect(b).toHaveLength(8);expect(b[0]).toHaveLength(8);c[0][0]=1;expect(b[0][0]).toBeNull();});
 it('validates bounds and overlaps',()=>{const b=createBoard();expect(canPlacePiece(b,[[0,0],[1,0]],0,0)).toBe(true);expect(canPlacePiece(b,[[0,0]],7,0)).toBe(true);expect(canPlacePiece(b,[[0,0],[1,0]],7,0)).toBe(false);const n=placePiece(b,[[0,0]],0,0,2);expect(canPlacePiece(n,[[0,0]],0,0)).toBe(false);});
 it('rejects malformed and empty shapes',()=>{const b=createBoard();expect(canPlacePiece(b,[],0,0)).toBe(false);expect(canPlacePiece(b,[[0,0]],-1,0)).toBe(false);});
 it('rotates coordinates into normalized positive space',()=>{expect(rotatePiece([[0,0],[1,0],[2,0]])).toEqual([[2,0],[2,1],[2,2]]);});
 it('finds and clears one row and one column, counting intersections once',()=>{const b=createBoard();for(let x=0;x<SIZE;x++)b[0][x]=1;for(let y=0;y<SIZE;y++)b[y][0]=2;expect(findCompletedRows(b)).toEqual([0]);expect(findCompletedColumns(b)).toEqual([0]);const c=clearCompletedLines(b);expect(c.cleared).toBe(15);expect(c.board.every(r=>r.every(v=>v===null))).toBe(true);});
 it('generates three pieces deterministically when random is seeded',()=>{const rand=()=>0.1,p=generatePieceSet(rand,4);expect(p).toHaveLength(3);expect(p[0].id).toBe('p-4-0');expect(p.every(x=>x.cells.length>0)).toBe(true);});
 it('enumerates valid moves and detects game over',()=>{const b=createBoard(),p=generatePieceSet(()=>0);expect(getAvailableMoves(b,p).length).toBeGreaterThan(0);expect(hasAnyValidMove(b,p)).toBe(true);const full=b.map(r=>r.map(()=>0));expect(hasAnyValidMove(full,p)).toBe(false);});
 it('applies placement, clears lines and calculates combo score once',()=>{const b=createBoard();for(let x=0;x<7;x++)b[0][x]=1;const piece={id:'test',shapeId:'dot',cells:[[0,0]] as [number,number][],color:2,used:false};const r=applyPlacement(b,piece,7,0,1,0);expect(r.lines).toBe(1);expect(r.combo).toBe(2);expect(r.score).toBe(160);expect(r.board[0].every(v=>v===null)).toBe(true);});
});
