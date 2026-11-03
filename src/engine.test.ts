import { describe, it, expect } from 'vitest';
import { createBoard, cloneBoard, canPlacePiece, placePiece, findCompletedRows, findCompletedColumns, clearCompletedLines, rotatePiece, generatePieceSet, getAvailableMoves, hasAnyValidMove, applyPlacement, SIZE, SHAPE_LIBRARY, type Piece } from './engine';

describe('BLOCK BLOOM deterministic engine', () => {
  it('creates an empty 8×8 board and clones without aliasing', () => {
    const b=createBoard(), c=cloneBoard(b);
    expect(b).toHaveLength(SIZE); expect(b[0]).toHaveLength(SIZE);
    c[0][0]=1; expect(b[0][0]).toBeNull();
  });
  it('rejects out-of-bounds, overlap, negative and empty placements', () => {
    const b=createBoard();
    expect(canPlacePiece(b,[[0,0],[1,0]],0,0)).toBe(true);
    expect(canPlacePiece(b,[[0,0],[1,0]],7,0)).toBe(false);
    expect(canPlacePiece(b,[[0,0]],-1,0)).toBe(false);
    expect(canPlacePiece(b,[],0,0)).toBe(false);
    const n=placePiece(b,[[0,0]],0,0,2);
    expect(canPlacePiece(n,[[0,0]],0,0)).toBe(false);
    expect(()=>placePiece(n,[[0,0]],0,0,2)).toThrow();
  });
  it('normalizes rotations and preserves unique cells', () => {
    const shape:[[number,number],[number,number],[number,number]]=[[0,0],[1,0],[2,0]];
    expect(rotatePiece(shape)).toEqual([[2,0],[2,1],[2,2]]);
    expect(rotatePiece(shape,2)).toEqual([[2,2],[1,2],[0,2]]);
    for(const s of SHAPE_LIBRARY) expect(new Set(rotatePiece(s.cells).map(p=>p.join(','))).size).toBe(s.cells.length);
  });
  it('detects rows, columns and counts intersections only once', () => {
    const b=createBoard();
    for(let x=0;x<SIZE;x++) b[0][x]=1;
    for(let y=0;y<SIZE;y++) b[y][0]=2;
    expect(findCompletedRows(b)).toEqual([0]); expect(findCompletedColumns(b)).toEqual([0]);
    const r=clearCompletedLines(b);
    expect(r.cleared).toBe(15); expect(r.board.flat().every(v=>v===null)).toBe(true);
    expect(b[0][1]).toBe(1);
  });
  it('generates three valid, independently identified pieces deterministically', () => {
    const p=generatePieceSet(()=>0.1,4);
    expect(p).toHaveLength(3); expect(p[0].id).toBe('p-4-0');
    expect(new Set(p.map(x=>x.id)).size).toBe(3);
    expect(p.every(x=>x.cells.length>0 && x.cells.every(([a,b])=>a>=0&&b>=0))).toBe(true);
  });
  it('enumerates legal moves and detects a blocked board', () => {
    const p=generatePieceSet(()=>0);
    expect(getAvailableMoves(createBoard(),p).length).toBeGreaterThan(0);
    expect(hasAnyValidMove(createBoard(),p)).toBe(true);
    const full=createBoard().map(row=>row.map(()=>0));
    expect(hasAnyValidMove(full,p)).toBe(false);
    expect(getAvailableMoves(full,p)).toHaveLength(0);
  });
  it('clears a line and scores placement, line, and consecutive combo exactly once', () => {
    const b=createBoard(); for(let x=0;x<7;x++) b[0][x]=1;
    const dot:Piece={id:'test',shapeId:'dot',cells:[[0,0]],color:2,used:false};
    const r=applyPlacement(b,dot,7,0,1,0);
    expect(r.lines).toBe(1); expect(r.combo).toBe(2); expect(r.score).toBe(160);
    expect(r.board[0].every(v=>v===null)).toBe(true);
  });
  it('breaks a combo after a non-clearing placement', () => {
    const dot:Piece={id:'d',shapeId:'dot',cells:[[0,0]],color:0,used:false};
    expect(applyPlacement(createBoard(),dot,0,0,4,60).combo).toBe(0);
  });
});