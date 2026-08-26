package com.metamovidas.sherzod.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val SkyA = Color(0xFFFFF4EA)
val SkyB = Color(0xFFF0E9FF)
val SkyC = Color(0xFFE7F6FF)
val Paper = SkyA
val Ink = Color(0xFF2B2440)
val Muted = Color(0xFF7A7390)
val Line = Color(0x1A503C78)
val LightSq = Color(0xFFF0D9B5)
val DarkSq = Color(0xFFB58863)
val GoalRed = Color(0xFFC4453C)
val Accent = Color(0xFF6A5CFF)
val Coral = Color(0xFFFF7A6A)
val Teal = Color(0xFF2EC4B6)
val Violet = Color(0xFF9B7DFF)
val Gold = Color(0xFFF0B429)
val Frame = Color(0xFF3C2A1C)
val CardBg = Color(0xE6FFFFFF)
val TokenLight = Color(0xFFFFE9D4)
val TokenDark = Color(0xFF3B3158)
val Blocked = Color(0xFF24180F)

private val colors = lightColorScheme(
    primary = Accent,
    onPrimary = Color.White,
    background = SkyA,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
)

val TitleStyle = TextStyle(
    fontFamily = FontFamily.Serif,
    fontWeight = FontWeight.Bold,
    fontSize = 40.sp,
    lineHeight = 44.sp,
    color = Ink,
    letterSpacing = (-0.8).sp,
)

fun puzzleTint(id: String): Color = when (id) {
    "rook-sacrifice" -> Coral
    "black-pawn" -> Teal
    "four-square" -> Violet
    else -> Gold
}

@Composable
fun SherzodTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, content = content)
}
