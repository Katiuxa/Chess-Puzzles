package com.metamovidas.sherzod.ui

import android.app.Application
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.metamovidas.sherzod.data.puzzleById
import com.metamovidas.sherzod.data.puzzles
import com.metamovidas.sherzod.engine.Game
import com.metamovidas.sherzod.engine.MoveResult
import com.metamovidas.sherzod.engine.Pos
import com.metamovidas.sherzod.engine.Puzzle
import com.metamovidas.sherzod.engine.WinKind
import com.metamovidas.sherzod.engine.formatTime
import com.metamovidas.sherzod.i18n.Dict
import com.metamovidas.sherzod.i18n.Lang
import com.metamovidas.sherzod.i18n.dictionaries
import com.metamovidas.sherzod.i18n.fmt
import com.metamovidas.sherzod.sfx.Sfx
import com.metamovidas.sherzod.sfx.SfxPlayer
import com.metamovidas.sherzod.ui.theme.Accent
import com.metamovidas.sherzod.ui.theme.CardBg
import com.metamovidas.sherzod.ui.theme.Ink
import com.metamovidas.sherzod.ui.theme.Line
import com.metamovidas.sherzod.ui.theme.Muted
import com.metamovidas.sherzod.ui.theme.Paper
import com.metamovidas.sherzod.ui.theme.SkyA
import com.metamovidas.sherzod.ui.theme.SkyB
import com.metamovidas.sherzod.ui.theme.SkyC
import com.metamovidas.sherzod.ui.theme.TitleStyle
import com.metamovidas.sherzod.ui.theme.puzzleTint
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

sealed class Screen {
    data object Home : Screen()
    data object About : Screen()
    data class Play(val id: String) : Screen()
}

class AppViewModel(app: Application) : AndroidViewModel(app) {
    private val prefs = app.getSharedPreferences("sherzod", 0)
    var lang by mutableStateOf(
        Lang.fromId(prefs.getString("lang", null))
            .let { stored ->
                if (prefs.contains("lang")) stored
                else Lang.fromSystem(app.resources.configuration.locales[0].language)
            },
    )
        private set

    val copy: Dict get() = dictionaries.getValue(lang)
    val sfx = SfxPlayer(app)

    fun updateLang(next: Lang) {
        lang = next
        prefs.edit().putString("lang", next.id).apply()
    }

    override fun onCleared() {
        sfx.release()
        super.onCleared()
    }
}

class PlayViewModel(puzzle: Puzzle) : ViewModel() {
    val game = Game(puzzle)
    var revision by mutableIntStateOf(0)
        private set

    init {
        viewModelScope.launch {
            while (isActive) {
                delay(1000)
                val before = game.seconds
                game.tick()
                if (game.seconds != before) revision++
            }
        }
    }

    fun bump() { revision++ }
}

@Composable
fun SherzodApp(vm: AppViewModel = viewModel()) {
    var screen by remember { mutableStateOf<Screen>(Screen.Home) }
    val copy = vm.copy

    Box(
        Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(SkyA, SkyB, SkyC)))
            .windowInsetsPadding(WindowInsets.statusBars)
            .windowInsetsPadding(WindowInsets.navigationBars),
    ) {
        Column(Modifier.fillMaxSize()) {
            TopBar(
                copy = copy,
                lang = vm.lang,
                screen = screen,
                onLang = vm::updateLang,
                onHome = { screen = Screen.Home },
                onAbout = { screen = Screen.About },
            )
            when (val s = screen) {
                Screen.Home -> HomeScreen(copy) { screen = Screen.Play(it) }
                Screen.About -> AboutScreen(copy)
                is Screen.Play -> {
                    val puzzle = puzzleById(s.id)
                    if (puzzle == null) {
                        screen = Screen.Home
                    } else {
                        BackHandler { screen = Screen.Home }
                        PlayScreen(
                            puzzle = puzzle,
                            copy = copy,
                            sfx = vm.sfx,
                            onBack = { screen = Screen.Home },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TopBar(
    copy: Dict,
    lang: Lang,
    screen: Screen,
    onLang: (Lang) -> Unit,
    onHome: () -> Unit,
    onAbout: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            "Sherzod",
            color = Ink,
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp,
            modifier = Modifier.clickable(onClick = onHome),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(
                copy.navPuzzles,
                color = if (screen !is Screen.About) Ink else Muted,
                fontSize = 14.sp,
                modifier = Modifier.clickable(onClick = onHome),
            )
            Text(
                copy.navAbout,
                color = if (screen is Screen.About) Ink else Muted,
                fontSize = 14.sp,
                modifier = Modifier.clickable(onClick = onAbout),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Lang.entries.forEach { item ->
                    Text(
                        item.native,
                        color = if (item == lang) Ink else Muted,
                        fontWeight = if (item == lang) FontWeight.Bold else FontWeight.Normal,
                        fontSize = 12.sp,
                        modifier = Modifier.clickable { onLang(item) },
                    )
                }
            }
        }
    }
}

@Composable
private fun HomeScreen(copy: Dict, onPlay: (String) -> Unit) {
    val width = LocalConfiguration.current.screenWidthDp
    val cols = if (width >= 700) 2 else 1
    Column(Modifier.fillMaxSize()) {
        Text(
            copy.homeTitle,
            style = TitleStyle,
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .padding(top = 12.dp)
                .border(3.dp, Ink, RoundedCornerShape(24.dp))
                .background(CardBg, RoundedCornerShape(24.dp))
                .padding(horizontal = 28.dp, vertical = 14.dp),
            textAlign = TextAlign.Center,
        )
        Text(
            copy.homeLede,
            color = Muted,
            fontSize = 16.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 28.dp, vertical = 10.dp),
        )
        LazyVerticalGrid(
            columns = GridCells.Fixed(cols),
            contentPadding = PaddingValues(horizontal = 18.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.weight(1f),
        ) {
            items(puzzles, key = { it.id }) { puzzle ->
                val text = copy.puzzles.getValue(puzzle.id)
                val tint = puzzleTint(puzzle.id)
                val index = puzzles.indexOf(puzzle) + 1
                Column(
                    Modifier
                        .shadow(12.dp, RoundedCornerShape(28.dp), clip = false)
                        .clip(RoundedCornerShape(28.dp))
                        .background(CardBg)
                        .clickable { onPlay(puzzle.id) }
                        .padding(16.dp),
                ) {
                    ChessBoard(
                        puzzle = puzzle,
                        board = puzzle.board,
                        selected = null,
                        legal = emptyList(),
                        interactive = false,
                        onSelect = {},
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp),
                    )
                    Column(
                        Modifier
                            .padding(top = 12.dp)
                            .fillMaxWidth()
                            .border(2.dp, tint, RoundedCornerShape(18.dp))
                            .background(tint.copy(alpha = 0.16f), RoundedCornerShape(18.dp))
                            .padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                Modifier
                                    .clip(RoundedCornerShape(50))
                                    .background(tint)
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                            ) {
                                Text("$index", color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Bold)
                            }
                            Text("${puzzle.par} ${copy.moves.lowercase()}", color = tint, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                        Text(
                            text.title,
                            fontFamily = FontFamily.Serif,
                            fontWeight = FontWeight.Bold,
                            fontSize = 22.sp,
                            color = Ink,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                        Text(text.goal, color = Muted, fontSize = 15.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
                    }
                    Text(
                        copy.play,
                        color = androidx.compose.ui.graphics.Color.White,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .align(Alignment.CenterHorizontally)
                            .padding(top = 12.dp)
                            .clip(RoundedCornerShape(50))
                            .background(Ink)
                            .padding(horizontal = 18.dp, vertical = 8.dp),
                    )
                }
            }
        }
        Text(
            copy.footer,
            color = Muted,
            fontSize = 12.sp,
            modifier = Modifier.padding(18.dp),
        )
    }
}

@Composable
private fun AboutScreen(copy: Dict) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp, vertical = 12.dp),
    ) {
        Text(copy.aboutEyebrow, color = Accent, fontSize = 13.sp)
        Text("Sherzod Khaydarbekov", style = TitleStyle, modifier = Modifier.padding(top = 6.dp))
        Text(
            copy.aboutLede,
            color = Muted,
            fontFamily = FontFamily.Serif,
            fontSize = 18.sp,
            modifier = Modifier.padding(top = 12.dp),
        )
        Spacer(Modifier.height(28.dp))
        val blocks = listOf(
            copy.aboutRuleTitle to copy.aboutRule,
            copy.aboutLineTitle to copy.aboutLine,
            copy.aboutEditionTitle to copy.aboutEdition,
        )
        blocks.forEach { (title, body) ->
            Text(title, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Ink)
            Text(body, color = Muted, fontFamily = FontFamily.Serif, fontSize = 16.sp, modifier = Modifier.padding(top = 6.dp, bottom = 18.dp))
        }
        Text("${copy.contact} ${copy.email}", color = Muted, fontFamily = FontFamily.Serif, fontSize = 15.sp)
        Spacer(Modifier.height(24.dp))
        Text(copy.footer, color = Muted, fontSize = 12.sp)
    }
}

@Composable
private fun PlayScreen(puzzle: Puzzle, copy: Dict, sfx: SfxPlayer, onBack: () -> Unit) {
    val playVm: PlayViewModel = viewModel(
        key = puzzle.id,
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = PlayViewModel(puzzle) as T
        },
    )
    val game = playVm.game
    val revision = playVm.revision
    val text = copy.puzzles.getValue(puzzle.id)
    val width = LocalConfiguration.current.screenWidthDp
    val landscape = LocalConfiguration.current.orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE
    val twoPane = width >= 840 || (landscape && width >= 600)

    fun playResult(result: MoveResult) {
        when (result) {
            MoveResult.Selected -> sfx.play(Sfx.Select)
            MoveResult.Moved -> sfx.play(Sfx.Move)
            MoveResult.Captured, MoveResult.Won -> {
                if (game.lastCapture) sfx.play(Sfx.Capture) else sfx.play(Sfx.Move)
            }
            else -> Unit
        }
        playVm.bump()
    }

    fun handle(pos: Pos) {
        playResult(game.select(pos))
    }

    fun handleDrop(from: Pos, to: Pos) {
        playResult(game.drop(from, to))
    }

    Column(
        Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
    ) {
        Text(
            "← ${copy.back}",
            color = Muted,
            fontSize = 14.sp,
            modifier = Modifier
                .padding(vertical = 8.dp)
                .clickable(onClick = onBack),
        )
        if (twoPane) {
            Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                PlayBoardColumn(puzzle, game, copy, ::handle, ::handleDrop, Modifier.weight(1.2f), playVm)
                PlayMeta(puzzle, text, copy, game, Modifier.weight(0.9f))
            }
        } else {
            Column(Modifier.fillMaxSize()) {
                Column(
                    Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        fmt(copy.authorLine, mapOf("par" to puzzle.par)),
                        color = Accent,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text.title,
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 28.sp,
                        color = Ink,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .padding(top = 6.dp)
                            .border(3.dp, Ink, RoundedCornerShape(20.dp))
                            .background(CardBg, RoundedCornerShape(20.dp))
                            .padding(horizontal = 18.dp, vertical = 8.dp),
                    )
                    Text(
                        text.goal,
                        color = Muted,
                        fontSize = 16.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 8.dp, bottom = 8.dp),
                    )
                }
                PlayBoardColumn(puzzle, game, copy, ::handle, ::handleDrop, Modifier.weight(1f), playVm)
                PlayMeta(puzzle, text, copy, game, Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 12.dp))
            }
        }
    }

    if (revision >= 0 && game.won) {
        VictoryDialog(puzzle, game, copy, onAgain = {
            game.reset()
            playVm.bump()
        }, onBack = onBack)
    }
}

@Composable
private fun PlayBoardColumn(
    puzzle: Puzzle,
    game: Game,
    copy: Dict,
    onSelect: (Pos) -> Unit,
    onDrop: (Pos, Pos) -> Unit,
    modifier: Modifier,
    playVm: PlayViewModel,
) {
    val revision = playVm.revision
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        ChessBoard(
            puzzle = puzzle,
            board = game.board,
            selected = game.selected,
            legal = game.legal,
            interactive = !game.won && revision >= 0,
            onSelect = onSelect,
            onDrop = onDrop,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 8.dp),
        )
        Row(
            Modifier.fillMaxWidth().padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Stat(game.moves.toString(), copy.moves)
            Stat(formatTime(game.seconds), copy.time)
            Stat(puzzle.par.toString(), copy.par)
            Text(copy.undo, color = Ink, modifier = Modifier
                .border(1.dp, Line, RoundedCornerShape(50.dp))
                .clickable { game.undo(); playVm.bump() }
                .padding(horizontal = 12.dp, vertical = 8.dp))
            Text(copy.reset, color = Ink, modifier = Modifier
                .border(1.dp, Line, RoundedCornerShape(50.dp))
                .clickable { game.reset(); playVm.bump() }
                .padding(horizontal = 12.dp, vertical = 8.dp))
        }
    }
}

@Composable
private fun PlayMeta(
    puzzle: Puzzle,
    text: com.metamovidas.sherzod.i18n.PuzzleCopy,
    copy: Dict,
    game: Game,
    modifier: Modifier,
) {
    Column(modifier.verticalScroll(rememberScrollState())) {
        Text(text.instruction, color = Muted, fontFamily = FontFamily.Serif, fontSize = 16.sp)
        val win = puzzle.win
        if (win is WinKind.GroupsOnRed) {
            Spacer(Modifier.height(16.dp))
            Text(copy.groupsPlaced, color = Accent, fontSize = 13.sp)
            win.groups.forEach { g ->
                val done = g in game.phases
                Text(
                    copy.groups[g] ?: g.name,
                    color = if (done) Accent else Muted,
                    modifier = Modifier.padding(top = 6.dp),
                )
            }
        }
    }
}

@Composable
private fun Stat(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Ink)
        Text(label, color = Muted, fontSize = 11.sp)
    }
}

@Composable
private fun VictoryDialog(
    puzzle: Puzzle,
    game: Game,
    copy: Dict,
    onAgain: () -> Unit,
    onBack: () -> Unit,
) {
    Box(
        Modifier
            .fillMaxSize()
            .background(Ink.copy(alpha = 0.4f))
            .clickable(enabled = false) {},
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier
                .fillMaxWidth(0.86f)
                .clip(RoundedCornerShape(28.dp))
                .background(Paper)
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(if (game.moves <= puzzle.par) copy.onPar else copy.solved, color = Accent, fontSize = 13.sp)
            Text(copy.complete, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 24.sp, color = Ink, textAlign = TextAlign.Center)
            Text(
                fmt(copy.victoryLine, mapOf("moves" to game.moves, "time" to formatTime(game.seconds), "par" to puzzle.par)),
                color = Muted,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp),
            )
            Row(Modifier.padding(top = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    copy.playAgain,
                    color = Paper,
                    modifier = Modifier
                        .background(Ink, RoundedCornerShape(50.dp))
                        .clickable(onClick = onAgain)
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                )
                Text(
                    copy.allPuzzles,
                    color = Ink,
                    modifier = Modifier
                        .border(1.dp, Line, RoundedCornerShape(50.dp))
                        .clickable(onClick = onBack)
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                )
            }
        }
    }
}
