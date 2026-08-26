package com.metamovidas.sherzod.engine

private fun inBounds(board: List<List<Cell>>, r: Int, c: Int): Boolean =
    r >= 0 && c >= 0 && r < board.size && c < board[0].size

private fun pathClear(board: List<List<Cell>>, from: Pos, to: Pos): Boolean {
    val dr = Integer.signum(to.r - from.r)
    val dc = Integer.signum(to.c - from.c)
    if (dr == 0 && dc == 0) return true
    var r = from.r + dr
    var c = from.c + dc
    var steps = 0
    while (r != to.r || c != to.c) {
        if (!inBounds(board, r, c)) return false
        val cell = board[r][c]
        if (cell.blocked || cell.piece != null) return false
        r += dr
        c += dc
        if (++steps > 32) return false
    }
    return true
}

private fun captureAllowed(puzzle: Puzzle, mover: Piece, victim: Piece?): Boolean {
    if (victim == null) return true
    if (victim.color == mover.color) return false
    return puzzle.captures.any { it.attacker == mover.kind && it.victim == victim.kind }
}

fun isLegalMove(puzzle: Puzzle, board: List<List<Cell>>, from: Pos, to: Pos): Boolean {
    if (from == to) return false
    if (!inBounds(board, to.r, to.c)) return false
    val origin = board[from.r][from.c]
    val dest = board[to.r][to.c]
    val piece = origin.piece ?: return false
    if (dest.blocked) return false
    if (!captureAllowed(puzzle, piece, dest.piece)) return false
    val dr = to.r - from.r
    val dc = to.c - from.c
    val adr = kotlin.math.abs(dr)
    val adc = kotlin.math.abs(dc)
    return when (piece.kind) {
        PieceKind.P -> {
            val dir = if (piece.color == PieceColor.W) -1 else 1
            dr == dir && dc == 0 && dest.piece == null
        }
        PieceKind.R -> (dr == 0 || dc == 0) && pathClear(board, from, to)
        PieceKind.B -> adr == adc && pathClear(board, from, to)
        PieceKind.Q -> (dr == 0 || dc == 0 || adr == adc) && pathClear(board, from, to)
        PieceKind.N -> (adr == 2 && adc == 1) || (adr == 1 && adc == 2)
        PieceKind.K -> adr <= 1 && adc <= 1
    }
}

fun legalMoves(puzzle: Puzzle, board: List<List<Cell>>, from: Pos): List<Pos> {
    val moves = mutableListOf<Pos>()
    for (r in board.indices) {
        for (c in board[r].indices) {
            val to = Pos(r, c)
            if (isLegalMove(puzzle, board, from, to)) moves.add(to)
        }
    }
    return moves
}

fun applyMove(board: List<List<Cell>>, from: Pos, to: Pos): Pair<List<List<Cell>>, Piece?> {
    val next = cloneBoard(board).map { it.toMutableList() }.toMutableList()
    val piece = next[from.r][from.c].piece
    val captured = next[to.r][to.c].piece
    next[to.r][to.c] = next[to.r][to.c].copy(piece = piece)
    next[from.r][from.c] = next[from.r][from.c].copy(piece = null)
    return next to captured
}

fun groupsOnRed(board: List<List<Cell>>): PieceKind? {
    val onRed = mutableListOf<PieceKind>()
    var redCount = 0
    for (row in board) {
        for (cell in row) {
            if (!cell.red) continue
            redCount += 1
            cell.piece?.let { onRed.add(it.kind) }
        }
    }
    if (redCount == 0 || onRed.size != redCount) return null
    val first = onRed.first()
    return if (onRed.all { it == first }) first else null
}

fun pieceOnTarget(board: List<List<Cell>>, kind: PieceKind, color: PieceColor): Boolean =
    board.any { row ->
        row.any { cell ->
            cell.target && cell.piece?.kind == kind && cell.piece.color == color
        }
    }

fun pieceExists(board: List<List<Cell>>, kind: PieceKind, color: PieceColor): Boolean =
    board.any { row -> row.any { it.piece?.kind == kind && it.piece?.color == color } }
