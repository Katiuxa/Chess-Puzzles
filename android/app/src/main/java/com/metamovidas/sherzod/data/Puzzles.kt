package com.metamovidas.sherzod.data

import com.metamovidas.sherzod.engine.CaptureRule
import com.metamovidas.sherzod.engine.PieceColor
import com.metamovidas.sherzod.engine.PieceKind
import com.metamovidas.sherzod.engine.Puzzle
import com.metamovidas.sherzod.engine.WinKind
import com.metamovidas.sherzod.engine.parseBoard

private fun puzzle(
    id: String,
    par: Int,
    rows: Int,
    cols: Int,
    win: WinKind,
    captures: List<CaptureRule>,
    layout: List<String>,
) = Puzzle(
    id = id,
    par = par,
    year = 2025,
    rows = rows,
    cols = cols,
    win = win,
    captures = captures,
    board = parseBoard(layout),
)

val puzzles: List<Puzzle> = listOf(
    puzzle(
        id = "rook-sacrifice",
        par = 27,
        rows = 4,
        cols = 5,
        win = WinKind.Capture(PieceKind.B, PieceKind.R),
        captures = listOf(CaptureRule(PieceKind.B, PieceKind.R)),
        layout = listOf("xNNNx", "RRRRR", "PP.PP", "Bxxxr"),
    ),
    puzzle(
        id = "black-pawn",
        par = 24,
        rows = 4,
        cols = 5,
        win = WinKind.Capture(PieceKind.N, PieceKind.P),
        captures = listOf(CaptureRule(PieceKind.N, PieceKind.P)),
        layout = listOf("BBBBN", "RRRR.", "PPPPx", "xxxxp"),
    ),
    puzzle(
        id = "four-square",
        par = 73,
        rows = 5,
        cols = 4,
        win = WinKind.GroupsOnRed(listOf(PieceKind.N, PieceKind.B, PieceKind.R)),
        captures = emptyList(),
        layout = listOf("#xx#", "NNNN", "BBBB", "RRRR", "#xx#"),
    ),
    puzzle(
        id = "queen-moves",
        par = 34,
        rows = 3,
        cols = 5,
        win = WinKind.PieceOnTarget(PieceKind.Q, PieceColor.W),
        captures = emptyList(),
        layout = listOf("RRRRR", "BBBBB", "Qxxx*"),
    ),
)

fun puzzleById(id: String): Puzzle? = puzzles.find { it.id == id }
