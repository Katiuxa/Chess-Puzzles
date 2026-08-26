package com.metamovidas.sherzod.engine

enum class MoveResult { Ignored, Selected, Moved, Captured, Won, Deselected }

class Game(val puzzle: Puzzle) {
    var board: List<List<Cell>> = cloneBoard(puzzle.board)
        private set
    var selected: Pos? = null
        private set
    var legal: List<Pos> = emptyList()
        private set
    private val history = ArrayDeque<Snapshot>()
    var moves: Int = 0
        private set
    var seconds: Int = 0
    var won: Boolean = false
        private set
    var lastCapture: Boolean = false
        private set
    val phases: MutableSet<PieceKind> = mutableSetOf()

    init {
        syncPhases()
    }

    fun select(pos: Pos): MoveResult {
        if (won) return MoveResult.Ignored
        val cell = board.getOrNull(pos.r)?.getOrNull(pos.c) ?: return MoveResult.Ignored
        if (cell.blocked) return MoveResult.Ignored
        val current = selected
        if (current != null && isLegalMove(puzzle, board, current, pos)) {
            return move(current, pos)
        }
        if (cell.piece != null) {
            selected = pos
            legal = legalMoves(puzzle, board, pos)
            return MoveResult.Selected
        }
        deselect()
        return MoveResult.Deselected
    }

    fun drop(from: Pos, to: Pos): MoveResult {
        if (won) return MoveResult.Ignored
        if (from == to) return select(from)
        val origin = board.getOrNull(from.r)?.getOrNull(from.c) ?: return MoveResult.Ignored
        if (origin.piece == null) return select(to)
        val dest = board.getOrNull(to.r)?.getOrNull(to.c) ?: return select(from)
        if (dest.blocked) return select(from)
        if (isLegalMove(puzzle, board, from, to)) {
            return move(from, to)
        }
        return select(to)
    }

    fun deselect() {
        selected = null
        legal = emptyList()
    }

    private fun move(from: Pos, to: Pos): MoveResult {
        history.addLast(
            Snapshot(
                board = cloneBoard(board),
                phases = phases.toSet(),
                lastCapture = lastCapture,
                moves = moves,
            ),
        )
        val (next, captured) = applyMove(board, from, to)
        board = next
        lastCapture = captured != null
        moves += 1
        deselect()
        syncPhases()
        if (checkWin(captured)) {
            won = true
            return MoveResult.Won
        }
        return if (captured != null) MoveResult.Captured else MoveResult.Moved
    }

    fun undo(): Boolean {
        if (won || history.isEmpty()) return false
        val snap = history.removeLast()
        board = snap.board
        phases.clear()
        phases.addAll(snap.phases)
        lastCapture = snap.lastCapture
        moves = snap.moves
        deselect()
        return true
    }

    fun reset() {
        board = cloneBoard(puzzle.board)
        history.clear()
        moves = 0
        seconds = 0
        won = false
        lastCapture = false
        phases.clear()
        deselect()
        syncPhases()
    }

    fun tick() {
        if (!won && moves > 0) seconds += 1
    }

    private fun syncPhases() {
        val win = puzzle.win
        if (win !is WinKind.GroupsOnRed) return
        val group = groupsOnRed(board)
        if (group != null && group in win.groups) phases.add(group)
    }

    private fun checkWin(captured: Piece?): Boolean = when (val win = puzzle.win) {
        is WinKind.Capture ->
            captured?.kind == win.victim && !pieceExists(board, win.victim, PieceColor.B)
        is WinKind.PieceOnTarget ->
            pieceOnTarget(board, win.kind, win.color)
        is WinKind.GroupsOnRed ->
            win.groups.all { it in phases }
    }

    private data class Snapshot(
        val board: List<List<Cell>>,
        val phases: Set<PieceKind>,
        val lastCapture: Boolean,
        val moves: Int,
    )
}

fun formatTime(seconds: Int): String {
    val m = seconds / 60
    val s = seconds % 60
    return "%02d:%02d".format(m, s)
}
