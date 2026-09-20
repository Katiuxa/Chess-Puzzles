import type { Cell, Piece, PieceKind, Pos, Puzzle } from "./types";
import { cloneBoard } from "./types";
import {
  applyMove,
  groupsOnRed,
  isLegalMove,
  legalMoves,
  pieceExists,
  pieceOnTarget,
  rowFilledWith,
} from "./chess";

export class Game {
  readonly puzzle: Puzzle;
  board: Cell[][];
  selected: Pos | null = null;
  legal: Pos[] = [];
  history: Array<{
    board: Cell[][];
    phases: PieceKind[];
    lastCapture: boolean;
    moves: number;
  }> = [];
  moves = 0;
  seconds = 0;
  won = false;
  lastCapture = false;
  phases = new Set<PieceKind>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(puzzle: Puzzle) {
    this.puzzle = puzzle;
    this.board = cloneBoard(puzzle.board);
    this.syncPhases();
  }

  select(pos: Pos): "ignored" | "selected" | "moved" | "captured" | "won" | "deselected" {
    if (this.won) return "ignored";
    const cell = this.board[pos.r]?.[pos.c];
    if (!cell || cell.blocked) return "ignored";

    if (this.selected && isLegalMove(this.puzzle, this.board, this.selected, pos)) {
      return this.move(this.selected, pos);
    }

    if (cell.piece) {
      this.selected = pos;
      this.legal = legalMoves(this.puzzle, this.board, pos);
      return "selected";
    }

    this.deselect();
    return "deselected";
  }

  drop(from: Pos, to: Pos): ReturnType<Game["select"]> {
    if (this.won) return "ignored";
    if (from.r === to.r && from.c === to.c) return this.select(from);
    const origin = this.board[from.r]?.[from.c];
    if (!origin?.piece) return this.select(to);
    const dest = this.board[to.r]?.[to.c];
    if (!dest || dest.blocked) return this.select(from);
    if (isLegalMove(this.puzzle, this.board, from, to)) {
      return this.move(from, to);
    }
    return this.select(to);
  }

  deselect(): void {
    this.selected = null;
    this.legal = [];
  }

  private move(from: Pos, to: Pos): "moved" | "captured" | "won" {
    this.history.push({
      board: cloneBoard(this.board),
      phases: [...this.phases],
      lastCapture: this.lastCapture,
      moves: this.moves,
    });
    const { board, captured } = applyMove(this.board, from, to);
    this.board = board;
    this.lastCapture = Boolean(captured);
    this.moves += 1;
    this.startTimer();
    this.deselect();
    this.syncPhases();
    if (this.checkWin(captured)) {
      this.won = true;
      this.stopTimer();
      return "won";
    }
    return captured ? "captured" : "moved";
  }

  undo(): boolean {
    if (this.history.length === 0) return false;
    const prev = this.history.pop();
    if (!prev) return false;
    this.board = prev.board;
    this.phases = new Set(prev.phases);
    this.lastCapture = prev.lastCapture;
    this.moves = prev.moves;
    this.won = false;
    this.deselect();
    if (this.moves > 0) this.startTimer();
    return true;
  }

  reset(): void {
    this.stopTimer();
    this.board = cloneBoard(this.puzzle.board);
    this.history = [];
    this.moves = 0;
    this.seconds = 0;
    this.won = false;
    this.lastCapture = false;
    this.phases = new Set();
    this.deselect();
    this.syncPhases();
  }

  startTimer(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      this.seconds += 1;
    }, 1000);
  }

  stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private syncPhases(): void {
    if (this.puzzle.win.type !== "groups-on-red") return;
    const group = groupsOnRed(this.board);
    if (!group) return;
    // Any complete set of 4 matching pieces on the reds counts, in any order.
    if (this.puzzle.win.groups.includes(group)) {
      this.phases.add(group);
    }
  }

  private checkWin(captured: Piece | null): boolean {
    const win = this.puzzle.win;
    if (win.type === "capture") {
      return (
        captured?.kind === win.victim &&
        !pieceExists(this.board, win.victim, "b")
      );
    }
    if (win.type === "piece-on-target") {
      return pieceOnTarget(this.board, win.kind, win.color);
    }
    if (win.type === "piece-on-target-restored") {
      if (!pieceOnTarget(this.board, win.kind, win.color)) return false;
      return win.homeRows.every(({ row, kind }) =>
        rowFilledWith(this.board, row, kind),
      );
    }
    if (win.type === "groups-on-red") {
      return win.groups.every((g) => this.phases.has(g));
    }
    return false;
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
