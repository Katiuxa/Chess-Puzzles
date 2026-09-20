export type Color = "w" | "b";
export type PieceKind = "K" | "Q" | "R" | "B" | "N" | "P";

export interface Piece {
  kind: PieceKind;
  color: Color;
}

export interface Cell {
  piece: Piece | null;
  blocked: boolean;
  /** Capture-target or destination square. */
  target: boolean;
  /** Four-square goal pads. */
  red: boolean;
}

export interface Pos {
  r: number;
  c: number;
}

export type WinKind =
  | { type: "piece-on-target"; kind: PieceKind; color: Color }
  | {
      type: "piece-on-target-restored";
      kind: PieceKind;
      color: Color;
      /** Playable cells in these rows must be filled with that kind (order within the row free). */
      homeRows: Array<{ row: number; kind: PieceKind }>;
    }
  | { type: "capture"; attacker: PieceKind; victim: PieceKind }
  | { type: "groups-on-red"; groups: PieceKind[] };

export type Palette = "gold" | "olive";

export interface Puzzle {
  id: string;
  par: number;
  year: number;
  rows: number;
  cols: number;
  palette: Palette;
  win: WinKind;
  /** Only these captures are legal. Empty = none. */
  captures: Array<{ attacker: PieceKind; victim: PieceKind }>;
  board: Cell[][];
}

export const KINDS: Record<string, PieceKind> = {
  K: "K",
  Q: "Q",
  R: "R",
  B: "B",
  N: "N",
  P: "P",
};

/** Compact layout: uppercase white, lowercase black, x blocked, . empty, * empty target, # red empty */
export function parseBoard(rows: string[]): Cell[][] {
  return rows.map((row) =>
    [...row].map((ch) => {
      if (ch === "x") {
        return { piece: null, blocked: true, target: false, red: false };
      }
      if (ch === "#") {
        return { piece: null, blocked: false, target: true, red: true };
      }
      if (ch === "*") {
        return { piece: null, blocked: false, target: true, red: false };
      }
      if (ch === ".") {
        return { piece: null, blocked: false, target: false, red: false };
      }
      const color: Color = ch === ch.toUpperCase() ? "w" : "b";
      const kind = ch.toUpperCase() as PieceKind;
      return {
        piece: { kind, color },
        blocked: false,
        target: false,
        red: false,
      };
    }),
  );
}

export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      piece: cell.piece ? { ...cell.piece } : null,
    })),
  );
}

export function samePos(a: Pos, b: Pos): boolean {
  return a.r === b.r && a.c === b.c;
}
