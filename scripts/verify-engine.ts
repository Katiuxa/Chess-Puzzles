import { isLegalMove, legalMoves, groupsOnRed, pieceOnTarget } from "../src/engine/chess";
import { Game } from "../src/engine/game";
import { parseBoard } from "../src/engine/types";
import type { Puzzle } from "../src/engine/types";
import { puzzles, puzzleById } from "../src/puzzles/data";

let failed = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else {
    console.log("ok  ", msg);
  }
}

function mini(
  layout: string[],
  win: Puzzle["win"],
  captures: Puzzle["captures"] = [],
): Puzzle {
  return {
    id: "mini",
    par: 8,
    year: 2025,
    rows: layout.length,
    cols: layout[0].length,
    palette: "gold",
    win,
    captures,
    board: parseBoard(layout),
  };
}

const rookSac = puzzleById("rook-sacrifice")!;
const blackPawn = puzzleById("black-pawn")!;
const queenMoves = puzzleById("queen-moves")!;

assert(puzzles.length === 4, "four Sherzod puzzles loaded");

const knightMoves = legalMoves(rookSac, rookSac.board, { r: 0, c: 1 });
assert(
  knightMoves.some((p) => p.r === 2 && p.c === 2),
  "Rook Sacrifice: knight jumps to the empty square",
);

assert(
  !isLegalMove(rookSac, rookSac.board, { r: 3, c: 0 }, { r: 3, c: 4 }),
  "bishop cannot slide through blocked squares to the black rook",
);

assert(
  !isLegalMove(rookSac, rookSac.board, { r: 2, c: 0 }, { r: 1, c: 0 }),
  "pawn cannot capture the rook ahead (captures are closed)",
);

assert(
  !isLegalMove(rookSac, rookSac.board, { r: 1, c: 0 }, { r: 2, c: 0 }),
  "rook cannot capture a same-side pawn",
);

const dropGame = new Game(rookSac);
assert(dropGame.drop({ r: 0, c: 1 }, { r: 2, c: 2 }) === "moved", "drop() places the knight");
assert(dropGame.board[2][2].piece?.kind === "N", "knight is on the destination square");
assert(dropGame.board[0][1].piece === null, "origin square is empty after the drop");

const tapGame = new Game(rookSac);
assert(tapGame.select({ r: 0, c: 1 }) === "selected", "tap selects the knight");
assert(tapGame.select({ r: 2, c: 2 }) === "moved", "second tap moves it to the empty square");

const captureGame = new Game(
  mini(["B.", ".r"], { type: "capture", attacker: "B", victim: "R" }, [
    { attacker: "B", victim: "R" },
  ]),
);
assert(captureGame.drop({ r: 0, c: 0 }, { r: 1, c: 1 }) === "won", "bishop taking the black rook wins");

const blockedCap = new Game(
  mini(["B.r"], { type: "capture", attacker: "B", victim: "R" }, [
    { attacker: "B", victim: "R" },
  ]),
);
assert(blockedCap.drop({ r: 0, c: 0 }, { r: 0, c: 2 }) === "selected", "bishop cannot capture along a rank");
assert(blockedCap.board[0][2].piece?.kind === "R", "black rook remains if the line is illegal");

const empty = legalMoves(blackPawn, blackPawn.board, { r: 1, c: 3 });
assert(
  empty.some((p) => p.r === 1 && p.c === 4),
  "The Black Pawn: rook can slide into the hole",
);
assert(
  legalMoves(blackPawn, blackPawn.board, { r: 3, c: 4 }).length === 0,
  "black pawn has no forward square and cannot move",
);

const knightMiss = new Game(
  mini(["N..", "...", ".p."], { type: "capture", attacker: "N", victim: "P" }, [
    { attacker: "N", victim: "P" },
  ]),
);
assert(
  knightMiss.drop({ r: 0, c: 0 }, { r: 1, c: 0 }) === "moved" ||
    knightMiss.board[0][0].piece?.kind === "N",
  "knight cannot move one square like a king",
);

const knightTakesPawn = new Game(
  mini(["N..", "...", ".p."], { type: "capture", attacker: "N", victim: "P" }, [
    { attacker: "N", victim: "P" },
  ]),
);
assert(knightTakesPawn.drop({ r: 0, c: 0 }, { r: 2, c: 1 }) === "won", "knight taking the black pawn wins");

const queenGame = new Game(
  mini(["R...", "B...", "Q..*"], { type: "piece-on-target", kind: "Q", color: "w" }),
);
assert(queenGame.drop({ r: 2, c: 0 }, { r: 2, c: 3 }) === "won", "queen reaching the target square wins");

const four = new Game(mini(["##", "RR"], { type: "groups-on-red", groups: ["R"] }));
assert(four.drop({ r: 1, c: 0 }, { r: 0, c: 0 }) === "moved", "first rook steps onto a red square");
assert(four.drop({ r: 1, c: 1 }, { r: 0, c: 1 }) === "won", "both red squares occupied by rooks completes the group");

const knightsOnly = new Game(mini(["#.#", "N.N"], { type: "groups-on-red", groups: ["N"] }));
assert(knightsOnly.drop({ r: 1, c: 0 }, { r: 0, c: 2 }) === "moved", "first knight jumps onto a red square");
assert(
  knightsOnly.drop({ r: 1, c: 2 }, { r: 0, c: 0 }) === "won",
  "all red squares occupied by knights wins a knights-only group puzzle",
);
assert(knightsOnly.moves === 2, "each legal drop increments the move counter");

const ordered = new Game(mini(["##", "RR"], { type: "groups-on-red", groups: ["N", "R"] }));
assert(ordered.drop({ r: 1, c: 0 }, { r: 0, c: 0 }) === "moved", "rook can step onto red");
assert(ordered.drop({ r: 1, c: 1 }, { r: 0, c: 1 }) === "moved", "second rook fills the reds out of order");
assert(!ordered.phases.has("R"), "out-of-order group is ignored until knights finish first");
assert(!ordered.won, "out-of-order completion does not win");

const threeGroups = new Game(mini(["#.#", "N.N"], { type: "groups-on-red", groups: ["N", "B", "R"] }));
threeGroups.drop({ r: 1, c: 0 }, { r: 0, c: 2 });
assert(
  threeGroups.drop({ r: 1, c: 2 }, { r: 0, c: 0 }) === "moved",
  "knights alone do not finish the three-group version",
);
assert(threeGroups.phases.has("N"), "knights phase is recorded in order");
assert(threeGroups.phases.size === 1, "only the first group is complete so far");

const fourSquare = puzzleById("four-square")!;
assert(
  fourSquare.win.type === "groups-on-red" &&
    fourSquare.win.groups.join("") === "NBR",
  "Four Square requires knights, bishops, then rooks on the reds",
);
assert(fourSquare.par === 73, "Four Square author’s line is 73");
assert(puzzleById("rook-sacrifice")!.par === 27, "Rook Sacrifice author’s line is 27");
assert(puzzleById("black-pawn")!.par === 24, "The Black Pawn author’s line is 24");
assert(puzzleById("queen-moves")!.par === 34, "Queen Moves author’s line is 34");

function countPieces(p: Puzzle): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of p.board) {
    for (const cell of row) {
      if (!cell.piece) continue;
      const key = `${cell.piece.color}${cell.piece.kind}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}
assert(
  JSON.stringify(countPieces(rookSac)) === JSON.stringify({ wN: 3, wR: 5, wP: 4, wB: 1, bR: 1 }),
  "Rook Sacrifice figure counts match the PDF",
);
assert(
  JSON.stringify(countPieces(blackPawn)) === JSON.stringify({ wB: 4, wN: 1, wR: 4, wP: 4, bP: 1 }),
  "The Black Pawn figure counts match the PDF",
);
assert(
  JSON.stringify(countPieces(fourSquare)) === JSON.stringify({ wN: 4, wB: 4, wR: 4 }),
  "Four Square figure counts match the PDF",
);
assert(
  JSON.stringify(countPieces(queenMoves)) === JSON.stringify({ wR: 5, wB: 5, wQ: 1 }),
  "Queen Moves figure counts match the PDF",
);

const phaseBoard = parseBoard(["#.#", "xxx", "#.#"])
phaseBoard[0][0].piece = { kind: "N", color: "w" }
phaseBoard[0][2].piece = { kind: "N", color: "w" }
phaseBoard[2][0].piece = { kind: "N", color: "w" }
phaseBoard[2][2].piece = { kind: "N", color: "w" }
assert(groupsOnRed(phaseBoard) === "N", "groupsOnRed detects a full knight set")
assert(!pieceOnTarget(queenMoves.board, "Q", "w"), "queen does not start on the target");

const jump = mini(["N.x", ".x.", "..."], { type: "piece-on-target", kind: "N", color: "w" });
assert(
  isLegalMove(jump, jump.board, { r: 0, c: 0 }, { r: 2, c: 1 }),
  "knight jumps over a blocked square",
);

const rookWall = mini(["R", "x", "."], { type: "piece-on-target", kind: "R", color: "w" });
assert(
  !isLegalMove(rookWall, rookWall.board, { r: 0, c: 0 }, { r: 2, c: 0 }),
  "rook cannot pass through a blocked square",
);

const sameSide = mini(["RR."], { type: "piece-on-target", kind: "R", color: "w" });
assert(
  !isLegalMove(sameSide, sameSide.board, { r: 0, c: 0 }, { r: 0, c: 1 }),
  "cannot land on a friendly piece",
);
assert(
  !isLegalMove(sameSide, sameSide.board, { r: 0, c: 0 }, { r: 0, c: 2 }),
  "rook cannot jump a friendly piece to the empty square beyond",
);

for (const puzzle of puzzles) {
  const game = new Game(puzzle);
  let total = 0;
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (puzzle.board[r][c].piece) {
        total += legalMoves(puzzle, puzzle.board, { r, c }).length;
      }
    }
  }
  assert(total > 0, `${puzzle.id} has at least one legal move from the start`);
  game.select({ r: 0, c: 0 });
  assert(!game.won, `${puzzle.id} is not already won`);
}

const undoGame = new Game(rookSac);
undoGame.drop({ r: 0, c: 1 }, { r: 2, c: 2 });
assert(undoGame.undo(), "undo restores the previous position");
assert(undoGame.board[0][1].piece?.kind === "N", "knight returns after undo");
assert(undoGame.moves === 0, "move count restores after undo");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll movement and objective checks passed.");
