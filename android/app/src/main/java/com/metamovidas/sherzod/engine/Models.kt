package com.metamovidas.sherzod.engine

enum class PieceColor { W, B }
enum class PieceKind { K, Q, R, B, N, P }

data class Piece(val kind: PieceKind, val color: PieceColor)

data class Cell(
    val piece: Piece? = null,
    val blocked: Boolean = false,
    val target: Boolean = false,
    val red: Boolean = false,
)

data class Pos(val r: Int, val c: Int)

sealed class WinKind {
    data class PieceOnTarget(val kind: PieceKind, val color: PieceColor) : WinKind()
    data class Capture(val attacker: PieceKind, val victim: PieceKind) : WinKind()
    data class GroupsOnRed(val groups: List<PieceKind>) : WinKind()
}

data class CaptureRule(val attacker: PieceKind, val victim: PieceKind)

data class Puzzle(
    val id: String,
    val par: Int,
    val year: Int,
    val rows: Int,
    val cols: Int,
    val win: WinKind,
    val captures: List<CaptureRule>,
    val board: List<List<Cell>>,
)

fun parseBoard(rows: List<String>): List<List<Cell>> =
    rows.map { row ->
        row.map { ch ->
            when (ch) {
                'x' -> Cell(blocked = true)
                '#' -> Cell(target = true, red = true)
                '*' -> Cell(target = true)
                '.' -> Cell()
                else -> {
                    val color = if (ch.isUpperCase()) PieceColor.W else PieceColor.B
                    val kind = PieceKind.valueOf(ch.uppercaseChar().toString())
                    Cell(piece = Piece(kind, color))
                }
            }
        }
    }

fun cloneBoard(board: List<List<Cell>>): List<List<Cell>> =
    board.map { row -> row.map { it.copy(piece = it.piece?.copy()) } }
