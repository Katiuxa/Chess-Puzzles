import type { Cell, Piece, PieceKind, Pos, Puzzle } from "./types";
import { cloneBoard } from "./types";

export function inBounds(board: Cell[][], r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < board.length && c < board[0].length;
}

function pathClear(board: Cell[][], from: Pos, to: Pos): boolean {
  const dr = Math.sign(to.r - from.r);
  const dc = Math.sign(to.c - from.c);
  if (dr === 0 && dc === 0) return true;
  let r = from.r + dr;
  let c = from.c + dc;
  let steps = 0;
  while (r !== to.r || c !== to.c) {
    if (!inBounds(board, r, c)) return false;
    const cell = board[r][c];
    if (cell.blocked || cell.piece) return false;
    r += dr;
    c += dc;
    if (++steps > 32) return false;
  }
  return true;
}

function captureAllowed(
  puzzle: Puzzle,
  mover: Piece,
  victim: Piece | null,
): boolean {
  if (!victim) return true;
  if (victim.color === mover.color) return false;
  return puzzle.captures.some(
    (rule) => rule.attacker === mover.kind && rule.victim === victim.kind,
  );
}

export function isLegalMove(
  puzzle: Puzzle,
  board: Cell[][],
  from: Pos,
  to: Pos,
): boolean {
  if (from.r === to.r && from.c === to.c) return false;
  if (!inBounds(board, to.r, to.c)) return false;

  const origin = board[from.r][from.c];
  const dest = board[to.r][to.c];
  const piece = origin.piece;
  if (!piece || dest.blocked) return false;
  if (!captureAllowed(puzzle, piece, dest.piece)) return false;

  const dr = to.r - from.r;
  const dc = to.c - from.c;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  switch (piece.kind) {
    case "P": {
      const dir = piece.color === "w" ? -1 : 1;
      return dr === dir && dc === 0 && !dest.piece;
    }
    case "R":
      return (dr === 0 || dc === 0) && pathClear(board, from, to);
    case "B":
      return adr === adc && pathClear(board, from, to);
    case "Q":
      return (
        (dr === 0 || dc === 0 || adr === adc) && pathClear(board, from, to)
      );
    case "N":
      return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
    case "K":
      return adr <= 1 && adc <= 1;
    default:
      return false;
  }
}

export function legalMoves(
  puzzle: Puzzle,
  board: Cell[][],
  from: Pos,
): Pos[] {
  const moves: Pos[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const to = { r, c };
      if (isLegalMove(puzzle, board, from, to)) moves.push(to);
    }
  }
  return moves;
}

export function applyMove(
  board: Cell[][],
  from: Pos,
  to: Pos,
): { board: Cell[][]; captured: Piece | null } {
  const next = cloneBoard(board);
  const piece = next[from.r][from.c].piece;
  const captured = next[to.r][to.c].piece;
  next[to.r][to.c].piece = piece;
  next[from.r][from.c].piece = null;
  return { board: next, captured };
}

export function groupsOnRed(board: Cell[][]): PieceKind | null {
  const onRed: PieceKind[] = [];
  let redCount = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell.red) continue;
      redCount += 1;
      if (cell.piece) onRed.push(cell.piece.kind);
    }
  }
  if (redCount === 0 || onRed.length !== redCount) return null;
  const first = onRed[0];
  return onRed.every((k) => k === first) ? first : null;
}

export function pieceOnTarget(
  board: Cell[][],
  kind: PieceKind,
  color: Piece["color"],
): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (
        cell.target &&
        cell.piece?.kind === kind &&
        cell.piece.color === color
      ) {
        return true;
      }
    }
  }
  return false;
}

export function pieceExists(
  board: Cell[][],
  kind: PieceKind,
  color: Piece["color"],
): boolean {
  return board.some((row) =>
    row.some((cell) => cell.piece?.kind === kind && cell.piece.color === color),
  );
}
