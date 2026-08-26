package com.metamovidas.sherzod.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.changedToUpIgnoreConsumed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.min
import coil.compose.AsyncImage
import com.metamovidas.sherzod.engine.Cell
import com.metamovidas.sherzod.engine.Piece
import com.metamovidas.sherzod.engine.PieceColor
import com.metamovidas.sherzod.engine.Pos
import com.metamovidas.sherzod.engine.Puzzle
import com.metamovidas.sherzod.ui.theme.Accent
import com.metamovidas.sherzod.ui.theme.Blocked
import com.metamovidas.sherzod.ui.theme.DarkSq
import com.metamovidas.sherzod.ui.theme.Frame
import com.metamovidas.sherzod.ui.theme.GoalRed
import com.metamovidas.sherzod.ui.theme.LightSq
import com.metamovidas.sherzod.ui.theme.TokenDark
import com.metamovidas.sherzod.ui.theme.TokenLight
import kotlin.math.floor
import kotlin.math.roundToInt

fun pieceAsset(piece: Piece): String {
    val c = if (piece.color == PieceColor.W) "w" else "b"
    return "file:///android_asset/pieces/$c${piece.kind.name.lowercase()}.svg"
}

private fun cellAt(x: Float, y: Float, sqPx: Float, rows: Int, cols: Int): Pos? {
    if (sqPx <= 0f) return null
    val c = floor(x / sqPx).toInt()
    val r = floor(y / sqPx).toInt()
    if (r !in 0 until rows || c !in 0 until cols) return null
    return Pos(r, c)
}

@Composable
fun ChessBoard(
    puzzle: Puzzle,
    board: List<List<Cell>>,
    selected: Pos?,
    legal: List<Pos>,
    interactive: Boolean,
    onSelect: (Pos) -> Unit,
    modifier: Modifier = Modifier,
    onDrop: (Pos, Pos) -> Unit = { from, to ->
        if (from == to) onSelect(from) else {
            onSelect(from)
            onSelect(to)
        }
    },
) {
    val legalSet = remember(legal) { legal.toSet() }
    val onSelectLatest = rememberUpdatedState(onSelect)
    val onDropLatest = rememberUpdatedState(onDrop)
    val boardLatest = rememberUpdatedState(board)

    BoxWithConstraints(modifier = modifier, contentAlignment = Alignment.Center) {
        val sq = min(maxWidth / puzzle.cols, maxHeight / puzzle.rows)
        val boardW = sq * puzzle.cols
        val boardH = sq * puzzle.rows
        var drag by remember { mutableStateOf<DragState?>(null) }
        val density = LocalDensity.current
        val sqPx = with(density) { sq.toPx() }

        Box(
            Modifier
                .size(boardW, boardH)
                .shadow(18.dp, RoundedCornerShape(sq * 0.18f), clip = false)
                .clip(RoundedCornerShape(sq * 0.18f))
                .background(Frame)
                .pointerInput(interactive, puzzle.cols, puzzle.rows, sqPx) {
                    if (!interactive || sqPx <= 0f) return@pointerInput
                    val slop = viewConfiguration.touchSlop
                    awaitEachGesture {
                        val down = awaitFirstDown(requireUnconsumed = false)
                        val start = cellAt(
                            down.position.x,
                            down.position.y,
                            sqPx,
                            puzzle.rows,
                            puzzle.cols,
                        ) ?: return@awaitEachGesture
                        val startPiece = boardLatest.value.getOrNull(start.r)?.getOrNull(start.c)?.piece
                        var pointer = down.position
                        var dragging = false

                        while (true) {
                            val event = awaitPointerEvent()
                            val change = event.changes.firstOrNull { it.id == down.id } ?: break

                            if (change.changedToUpIgnoreConsumed()) {
                                val dest = cellAt(
                                    pointer.x,
                                    pointer.y,
                                    sqPx,
                                    puzzle.rows,
                                    puzzle.cols,
                                )
                                drag = null
                                when {
                                    dragging && startPiece != null && dest != null && dest != start ->
                                        onDropLatest.value(start, dest)
                                    dest != null && dragging && startPiece == null ->
                                        onSelectLatest.value(dest)
                                    else ->
                                        onSelectLatest.value(start)
                                }
                                change.consume()
                                break
                            }

                            if (change.pressed) {
                                pointer = change.position
                                if (!dragging && (pointer - down.position).getDistance() >= slop) {
                                    dragging = true
                                    if (startPiece != null) {
                                        drag = DragState(start, pointer)
                                    }
                                }
                                if (dragging && startPiece != null) {
                                    drag = DragState(start, pointer)
                                    change.consume()
                                }
                            } else {
                                drag = null
                                break
                            }
                        }
                    }
                },
        ) {
            board.forEachIndexed { r, row ->
                row.forEachIndexed { c, cell ->
                    val pos = Pos(r, c)
                    val isLegal = pos in legalSet
                    val gap = sq * 0.04f
                    val inner = sq - gap
                    val radius = inner * 0.14f
                    val bg = when {
                        cell.blocked -> Blocked
                        cell.red || cell.target -> GoalRed
                        (r + c) % 2 == 0 -> LightSq
                        else -> DarkSq
                    }
                    Box(
                        Modifier
                            .size(inner)
                            .offset {
                                IntOffset(
                                    (sq * c + gap / 2).roundToPx(),
                                    (sq * r + gap / 2).roundToPx(),
                                )
                            }
                            .shadow(3.dp, RoundedCornerShape(radius), clip = false)
                            .clip(RoundedCornerShape(radius))
                            .background(bg)
                            .then(
                                if (selected == pos) Modifier.border(width = sq * 0.05f, color = Accent, shape = RoundedCornerShape(radius))
                                else if (isLegal && cell.piece != null) Modifier.border(width = sq * 0.05f, color = Accent.copy(alpha = 0.35f), shape = RoundedCornerShape(radius))
                                else Modifier,
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (isLegal && cell.piece == null) {
                            Box(
                                Modifier
                                    .size(sq * 0.18f)
                                    .background(Accent.copy(alpha = 0.35f), CircleShape),
                            )
                        }
                        val piece = cell.piece
                        val hiding = drag?.from == pos
                        if (piece != null && !hiding) {
                            PieceToken(piece, inner * 0.78f)
                        }
                    }
                }
            }
            val ghost = drag
            if (ghost != null) {
                val piece = board[ghost.from.r][ghost.from.c].piece
                if (piece != null) {
                    val px = sqPx
                    val token = sq * 0.78f
                    Box(
                        Modifier
                            .size(token)
                            .offset {
                                IntOffset(
                                    (ghost.point.x - with(density) { token.toPx() } / 2).roundToInt(),
                                    (ghost.point.y - with(density) { token.toPx() } / 2).roundToInt(),
                                )
                            }
                            .graphicsLayer { alpha = 0.94f },
                    ) {
                        PieceToken(piece, token)
                    }
                }
            }
        }
    }
}

@Composable
private fun PieceToken(piece: Piece, size: androidx.compose.ui.unit.Dp) {
    val light = piece.color == PieceColor.W
    Box(
        Modifier
            .size(size)
            .shadow(8.dp, CircleShape, clip = false)
            .clip(CircleShape)
            .background(if (light) TokenLight else TokenDark),
        contentAlignment = Alignment.Center,
    ) {
        AsyncImage(
            model = pieceAsset(piece),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(0.72f),
            contentScale = ContentScale.Fit,
        )
    }
}

private data class DragState(val from: Pos, val point: Offset)
