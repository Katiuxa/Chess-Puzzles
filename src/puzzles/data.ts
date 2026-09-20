import type { Puzzle } from "../engine/types";
import { parseBoard } from "../engine/types";

/**
 * Source of truth: Sherzod Khaydarbekov 2025 PDF booklets
 * (Rook Sacrifice, The Black Pawn, 4 Square, Queen Moves).
 *
 * Layout glyphs: uppercase=white, lowercase=black,
 * x=blocked architecture, .=empty, *=destination, #=red goal pad.
 */
function puzzle(
  partial: Omit<Puzzle, "board"> & { layout: string[] },
): Puzzle {
  const { layout, ...rest } = partial;
  return { ...rest, board: parseBoard(layout) };
}

export const puzzles: Puzzle[] = [
  // Rook Sacrifice — capture black rook with bishop; author’s line 27.
  // Figures: 1 Bishop, 4 Pawns, 3 Knights, 6 Rooks (5 white + 1 black).
  puzzle({
    id: "rook-sacrifice",
    par: 27,
    year: 2025,
    rows: 4,
    cols: 5,
    palette: "gold",
    win: { type: "capture", attacker: "B", victim: "R" },
    captures: [{ attacker: "B", victim: "R" }],
    layout: ["xNNNx", "RRRRR", "PP.PP", "Bxxxr"],
  }),

  // The Black Pawn — capture black pawn with knight; author’s line 24.
  // Figures: 4 Bishops, 4 Rooks, 4 Pawns, 1 Knight, 1 black Pawn.
  puzzle({
    id: "black-pawn",
    par: 24,
    year: 2025,
    rows: 4,
    cols: 5,
    palette: "gold",
    win: { type: "capture", attacker: "N", victim: "P" },
    captures: [{ attacker: "N", victim: "P" }],
    layout: ["BBBBN", "RRRR.", "PPPPx", "xxxxp"],
  }),

  // 4 Square — fill the 4 red squares with each piece type (any order); author’s line 73.
  // Figures: 4 Knights, 4 Bishops, 4 Rooks. Each completed set on the reds is remembered.
  puzzle({
    id: "four-square",
    par: 73,
    year: 2025,
    rows: 5,
    cols: 4,
    palette: "gold",
    win: { type: "groups-on-red", groups: ["N", "B", "R"] },
    captures: [],
    layout: ["#xx#", "NNNN", "BBBB", "RRRR", "#xx#"],
  }),

  // Queen Moves — queen on the empty square AND formation restored:
  // a full rook row on top, a full bishop row below; author’s line 34.
  // Figures: 1 Queen, 5 Bishops, 5 Rooks.
  puzzle({
    id: "queen-moves",
    par: 34,
    year: 2025,
    rows: 3,
    cols: 5,
    palette: "gold",
    win: {
      type: "piece-on-target-restored",
      kind: "Q",
      color: "w",
      homeRows: [
        { row: 0, kind: "R" },
        { row: 1, kind: "B" },
      ],
    },
    captures: [],
    layout: ["RRRRR", "BBBBB", "Qxxx*"],
  }),
];

export function puzzleById(id: string): Puzzle | undefined {
  return puzzles.find((p) => p.id === id);
}
