import type { PieceKind } from "./engine/types";

export type Lang = "es" | "fr" | "en" | "ru";

export const LANGS: { id: Lang; native: string }[] = [
  { id: "es", native: "Español" },
  { id: "en", native: "English" },
  { id: "fr", native: "Français" },
  { id: "ru", native: "Русский" },
];

type PuzzleCopy = {
  title: string;
  goal: string;
  instruction: string;
};

type Dict = {
  metaTitle: string;
  metaDescription: string;
  metaAbout: string;
  homeTitle: string;
  play: string;
  homeLede: string;
  level: string;
  navPuzzles: string;
  navAbout: string;
  language: string;
  soundOn: string;
  soundOff: string;
  gallery: string;
  howToPlay: string;
  howObjectiveTitle: string;
  howObjectiveBody: string;
  howRulesTitle: string;
  howRulesBody: string;
  homeCredit: string;
  footer: string;
  minMoves: string;
  back: string;
  authorLine: string;
  moves: string;
  time: string;
  par: string;
  undo: string;
  reset: string;
  playAgain: string;
  allPuzzles: string;
  onPar: string;
  solved: string;
  complete: string;
  victoryLine: string;
  piecesPlaced: string;
  bestAttempt: string;
  bestAttemptEmpty: string;
  blocked: string;
  square: string;
  white: string;
  black: string;
  pieces: Record<PieceKind, string>;
  groups: Record<"N" | "B" | "R", string>;
  aboutEyebrow: string;
  aboutLede: string;
  aboutRuleTitle: string;
  aboutRule: string;
  aboutLineTitle: string;
  aboutLine: string;
  aboutEditionTitle: string;
  aboutEdition: string;
  contact: string;
  puzzles: Record<string, PuzzleCopy>;
};

const en: Dict = {
  metaTitle: "Chess Puzzles — Sherzod Khaydarbekov",
  metaDescription:
    "Original single-player chess compositions by Sherzod Khaydarbekov. Standard moves. One objective.",
  metaAbout: "About — Sherzod Khaydarbekov",
  homeTitle: "Chess Puzzles",
  homeLede: "Four quiet studies. Soft moves. One elegant objective.",
  play: "Play",
  level: "Level",
  navPuzzles: "Puzzles",
  navAbout: "About",
  language: "Language",
  soundOn: "Unmute sound",
  soundOff: "Mute sound",
  gallery: "Puzzles",
  howToPlay: "How to play",
  howObjectiveTitle: "Objective & mechanics",
  howObjectiveBody:
    "Your mission is to solve the objective on each board. Every puzzle uses a special board with blocked squares or obstacles.",
  howRulesTitle: "Rules",
  howRulesBody:
    "Pieces move with classic chess moves (the knight’s leap, the bishop’s diagonals, or the rook’s straight lines).",
  homeCredit: "Made with ❤️ by Metamovidas",
  footer: "Puzzles by Sherzod Khaydarbekov",
  minMoves: "Minimum {{par}} moves",
  back: "All puzzles",
  authorLine: "Author’s line {{par}} moves",
  moves: "Moves",
  time: "Time",
  par: "Par",
  undo: "Undo",
  reset: "Reset",
  playAgain: "Play again",
  allPuzzles: "All puzzles",
  onPar: "On or under par",
  solved: "Solved",
  complete: "Composition complete.",
  victoryLine: "{{moves}} moves · {{time}} · author’s line {{par}}",
  piecesPlaced: "Pieces placed",
  bestAttempt: "Best attempt: {{moves}} moves",
  bestAttemptEmpty: "Best attempt: —",
  blocked: "Blocked",
  square: "Row {{r}}, column {{c}}",
  white: "White",
  black: "Black",
  pieces: { K: "King", Q: "Queen", R: "Rook", B: "Bishop", N: "Knight", P: "Pawn" },
  groups: { N: "Knights", B: "Bishops", R: "Rooks" },
  aboutEyebrow: "The designer",
  aboutLede:
    "Wooden chess studies from Tashkent. Each puzzle is a physical composition: a shaped board, a closed set of pieces, and a single task solved by orthodox chess movement.",
  aboutRuleTitle: "The rule",
  aboutRule:
    "Pieces move exactly as they do in chess. Occupied squares cannot be captured — except where the composition names a capture as the objective. Blocked cells are part of the board’s architecture, not empty space.",
  aboutLineTitle: "The line",
  aboutLine:
    "Each study publishes an author’s solution length. You may take a longer path. Reaching the objective is the work; matching par is the craft.",
  aboutEditionTitle: "This edition",
  aboutEdition:
    "Four compositions from 2025, translated to the browser without altering their geometry or rules. Physical originals remain the designer’s work.",
  contact: "Questions about the compositions:",
  puzzles: {
    "rook-sacrifice": {
      title: "Rook Sacrifice",
      goal: "Capture the black rook with the bishop.",
      instruction:
        "Use standard chess moves. The only legal capture is the bishop taking the black rook. White pawns advance toward the top of the board.",
    },
    "black-pawn": {
      title: "The Black Pawn",
      goal: "Capture the black pawn with the knight.",
      instruction:
        "Use standard chess moves. The only legal capture is the knight taking the black pawn. White pawns advance toward the top of the board.",
    },
    "four-square": {
      title: "Four Square",
      goal: "Put each set of pieces on the 4 red squares (knights, bishops, and rooks). Any order is fine.",
      instruction:
        "Use standard chess moves. No captures. Whenever all four red squares hold the same piece type, that set counts. Do this for knights, bishops, and rooks — in any order — to finish.",
    },
    "queen-moves": {
      title: "Queen Moves",
      goal: "Get the queen to the empty place and restore the starting rows: rooks on top, bishops below.",
      instruction:
        "Use standard chess moves. No captures. The queen starts at the lower left; the vacant square at the lower right is her destination. Win only when she sits there and the top row is all rooks again with a full bishop row beneath (order within each row free).",
    },
  },
};

const es: Dict = {
  metaTitle: "Chess Puzzles — Sherzod Khaydarbekov",
  metaDescription:
    "Composiciones originales de ajedrez para un jugador, de Sherzod Khaydarbekov. Movimientos habituales. Un solo objetivo.",
  metaAbout: "Acerca de — Sherzod Khaydarbekov",
  homeTitle: "Puzzles de ajedrez",
  homeLede: "Cuatro estudios suaves. Un objetivo elegante.",
  play: "Jugar",
  level: "Nivel",
  navPuzzles: "Puzzles",
  navAbout: "Acerca de",
  language: "Idioma",
  soundOn: "Activar sonido",
  soundOff: "Silenciar sonido",
  gallery: "Puzzles",
  howToPlay: "Cómo jugar",
  howObjectiveTitle: "Objetivo y Mecánica",
  howObjectiveBody:
    "Tu misión es resolver el objetivo propuesto en cada tablero. Cada puzle se presenta en un tablero especial con casillas bloqueadas u obstáculos.",
  howRulesTitle: "Reglas",
  howRulesBody:
    "Las piezas se mueven utilizando los movimientos clásicos del ajedrez (el salto del caballo, las diagonales del alfil o las líneas rectas de la torre).",
  homeCredit: "Made with ❤️ by Metamovidas",
  footer: "Puzzles de Sherzod Khaydarbekov",
  minMoves: "Mínimo {{par}} movimientos",
  back: "Todos los puzzles",
  authorLine: "Línea del autor {{par}} movimientos",
  moves: "Movimientos",
  time: "Tiempo",
  par: "Par",
  undo: "Deshacer",
  reset: "Reiniciar",
  playAgain: "Jugar de nuevo",
  allPuzzles: "Todos los puzzles",
  onPar: "En par o por debajo",
  solved: "Resuelto",
  complete: "Composición terminada.",
  victoryLine: "{{moves}} movimientos · {{time}} · línea del autor {{par}}",
  piecesPlaced: "Piezas colocadas",
  bestAttempt: "Mejor intento: {{moves}} movimientos",
  bestAttemptEmpty: "Mejor intento: —",
  blocked: "Bloqueada",
  square: "Fila {{r}}, columna {{c}}",
  white: "Blanco",
  black: "Negro",
  pieces: { K: "Rey", Q: "Dama", R: "Torre", B: "Alfil", N: "Caballo", P: "Peón" },
  groups: { N: "Caballos", B: "Alfiles", R: "Torres" },
  aboutEyebrow: "El autor",
  aboutLede:
    "Estudios de ajedrez en madera, desde Taskent. Cada problema es una composición física: un tablero recortado, un conjunto cerrado de piezas y una sola tarea, resuelta con el movimiento ortodoxo del ajedrez.",
  aboutRuleTitle: "La regla",
  aboutRule:
    "Las piezas se mueven exactamente como en el ajedrez. No se puede capturar una casilla ocupada, salvo cuando la composición indica una captura como objetivo. Las casillas bloqueadas forman parte de la arquitectura del tablero, no son espacios vacíos.",
  aboutLineTitle: "La línea",
  aboutLine:
    "Cada estudio publica la longitud de la solución del autor. Se puede tomar un camino más largo. Alcanzar el objetivo es el trabajo; igualar el par es el oficio.",
  aboutEditionTitle: "Esta edición",
  aboutEdition:
    "Cuatro composiciones de 2025, pasadas al navegador sin alterar su geometría ni sus reglas. Los originales físicos siguen siendo obra del autor.",
  contact: "Consultas sobre las composiciones:",
  puzzles: {
    "rook-sacrifice": {
      title: "Sacrificio de Torre",
      goal: "Captura la torre negra con el alfil.",
      instruction:
        "Usa los movimientos habituales del ajedrez. La única captura legal es el alfil tomando la torre negra. Los peones blancos avanzan hacia la parte superior del tablero.",
    },
    "black-pawn": {
      title: "El peón negro",
      goal: "Captura el peón negro con el caballo.",
      instruction:
        "Usa los movimientos habituales del ajedrez. La única captura legal es el caballo tomando el peón negro. Los peones blancos avanzan hacia la parte superior del tablero.",
    },
    "four-square": {
      title: "Cuatro casillas",
      goal: "Coloca cada tipo de pieza en las 4 casillas rojas (caballos, alfiles y torres). El orden da igual.",
      instruction:
        "Usa los movimientos habituales del ajedrez. Sin capturas. Cuando las cuatro casillas rojas tengan el mismo tipo de pieza, ese conjunto cuenta. Hazlo con caballos, alfiles y torres — en cualquier orden — para terminar.",
    },
    "queen-moves": {
      title: "Movimientos de dama",
      goal: "Lleva la dama a la casilla vacía y restaura las filas iniciales: torres arriba y alfiles abajo.",
      instruction:
        "Usa los movimientos habituales del ajedrez. Sin capturas. La dama empieza abajo a la izquierda; la casilla vacía abajo a la derecha es el destino. Ganas solo cuando está ahí y la fila de arriba vuelve a ser de torres con una fila de alfiles debajo (el orden dentro de cada fila es libre).",
    },
  },
};

const fr: Dict = {
  metaTitle: "Sherzod Khaydarbekov — Problèmes d'échecs",
  metaDescription:
    "Compositions d'échecs originales pour un joueur, de Sherzod Khaydarbekov. Coups habituels. Un seul objectif.",
  metaAbout: "À propos — Sherzod Khaydarbekov",
  homeTitle: "Puzzles d'échecs",
  homeLede: "Quatre études douces. Un objectif élégant.",
  play: "Jouer",
  level: "Niveau",
  navPuzzles: "Puzzles",
  navAbout: "À propos",
  language: "Langue",
  soundOn: "Activer le son",
  soundOff: "Couper le son",
  gallery: "Puzzles",
  howToPlay: "Comment jouer",
  howObjectiveTitle: "Objectif et mécanique",
  howObjectiveBody:
    "Votre mission est de résoudre l’objectif proposé sur chaque plateau. Chaque puzzle se présente sur un plateau spécial avec des cases bloquées ou des obstacles.",
  howRulesTitle: "Règles",
  howRulesBody:
    "Les pièces se déplacent avec les coups classiques des échecs (le saut du cavalier, les diagonales du fou ou les lignes droites de la tour).",
  homeCredit: "Made with ❤️ by Metamovidas",
  footer: "Puzzles de Sherzod Khaydarbekov",
  minMoves: "Minimum {{par}} coups",
  back: "Tous les puzzles",
  authorLine: "Ligne de l’auteur {{par}} coups",
  moves: "Coups",
  time: "Temps",
  par: "Par",
  undo: "Annuler",
  reset: "Recommencer",
  playAgain: "Rejouer",
  allPuzzles: "Tous les puzzles",
  onPar: "Au par ou en dessous",
  solved: "Résolu",
  complete: "Composition achevée.",
  victoryLine: "{{moves}} coups · {{time}} · ligne de l’auteur {{par}}",
  piecesPlaced: "Pièces placées",
  bestAttempt: "Meilleure tentative : {{moves}} coups",
  bestAttemptEmpty: "Meilleure tentative : —",
  blocked: "Bloquée",
  square: "Rangée {{r}}, colonne {{c}}",
  white: "Blanc",
  black: "Noir",
  pieces: { K: "Roi", Q: "Dame", R: "Tour", B: "Fou", N: "Cavalier", P: "Pion" },
  groups: { N: "Cavaliers", B: "Fous", R: "Tours" },
  aboutEyebrow: "L’auteur",
  aboutLede:
    "Des études d’échecs en bois, depuis Tachkent. Chaque problème est une composition physique : un plateau découpé, un jeu fermé de pièces, et une seule tâche, résolue par le mouvement orthodoxe des échecs.",
  aboutRuleTitle: "La règle",
  aboutRule:
    "Les pièces se déplacent exactement comme aux échecs. On ne peut pas prendre une case occupée — sauf lorsque la composition désigne une prise comme objectif. Les cases bloquées font partie de l’architecture du plateau ; ce ne sont pas des vides.",
  aboutLineTitle: "La ligne",
  aboutLine:
    "Chaque étude publie la longueur de la solution de l’auteur. On peut prendre un chemin plus long. Atteindre l’objectif est le travail ; égaler le par est le métier.",
  aboutEditionTitle: "Cette édition",
  aboutEdition:
    "Quatre compositions de 2025, transposées dans le navigateur sans modifier leur géométrie ni leurs règles. Les originaux physiques restent l’œuvre de l’auteur.",
  contact: "Questions sur les compositions :",
  puzzles: {
    "rook-sacrifice": {
      title: "Sacrifice de tour",
      goal: "Prenez la tour noire avec le fou.",
      instruction:
        "Utilisez les coups habituels des échecs. La seule prise autorisée est le fou prenant la tour noire. Les pions blancs avancent vers le haut du plateau.",
    },
    "black-pawn": {
      title: "Le pion noir",
      goal: "Prenez le pion noir avec le cavalier.",
      instruction:
        "Utilisez les coups habituels des échecs. La seule prise autorisée est le cavalier prenant le pion noir. Les pions blancs avancent vers le haut du plateau.",
    },
    "four-square": {
      title: "Quatre cases",
      goal: "Placez chaque type de pièces sur les 4 cases rouges (cavaliers, fous et tours). L’ordre n’importe pas.",
      instruction:
        "Utilisez les coups habituels des échecs. Sans prises. Dès que les quatre cases rouges portent le même type de pièce, ce jeu compte. Faites-le avec cavaliers, fous et tours — dans n’importe quel ordre — pour terminer.",
    },
    "queen-moves": {
      title: "Coups de dame",
      goal: "Amenez la dame sur la case vide et restaurez les rangées de départ : tours en haut, fous en bas.",
      instruction:
        "Utilisez les coups habituels des échecs. Sans prises. La dame part en bas à gauche ; la case vide en bas à droite est la destination. Victoire seulement quand elle y est et que la rangée du haut est à nouveau pleine de tours, avec une rangée de fous en dessous (ordre libre dans chaque rangée).",
    },
  },
};

const ru: Dict = {
  metaTitle: "Шерзод Хайдарбеков — Шахматные задачи",
  metaDescription:
    "Оригинальные шахматные композиции Шерзода Хайдарбекова для одного игрока. Обычные ходы. Одна цель.",
  metaAbout: "О проекте — Шерзод Хайдарбеков",
  homeTitle: "Шахматные задачи",
  homeLede: "Четыре тихих этюда. Одна изящная цель.",
  play: "Играть",
  level: "Уровень",
  navPuzzles: "Задачи",
  navAbout: "О проекте",
  language: "Язык",
  soundOn: "Включить звук",
  soundOff: "Выключить звук",
  gallery: "Задачи",
  howToPlay: "Как играть",
  howObjectiveTitle: "Цель и механика",
  howObjectiveBody:
    "Ваша задача — выполнить цель на каждой доске. Каждая задача идёт на особой доске с заблокированными клетками или препятствиями.",
  howRulesTitle: "Правила",
  howRulesBody:
    "Фигуры ходят классическими шахматными ходами (прыжок коня, диагонали слона или прямые линии ладьи).",
  homeCredit: "Made with ❤️ by Metamovidas",
  footer: "Puzzles Шерзода Хайдарбекова",
  minMoves: "Минимум {{par}} ходов",
  back: "Все задачи",
  authorLine: "Авторская линия {{par}} ходов",
  moves: "Ходы",
  time: "Время",
  par: "Пар",
  undo: "Отменить",
  reset: "Сначала",
  playAgain: "Ещё раз",
  allPuzzles: "Все задачи",
  onPar: "В пар или лучше",
  solved: "Решено",
  complete: "Композиция решена.",
  victoryLine: "{{moves}} ходов · {{time}} · авторская линия {{par}}",
  piecesPlaced: "Фигуры расставлены",
  bestAttempt: "Лучшая попытка: {{moves}} ходов",
  bestAttemptEmpty: "Лучшая попытка: —",
  blocked: "Закрыто",
  square: "Ряд {{r}}, столбец {{c}}",
  white: "Белые",
  black: "Чёрные",
  pieces: { K: "Король", Q: "Ферзь", R: "Ладья", B: "Слон", N: "Конь", P: "Пешка" },
  groups: { N: "Кони", B: "Слоны", R: "Ладьи" },
  aboutEyebrow: "Автор",
  aboutLede:
    "Деревянные шахматные этюды из Ташкента. Каждая задача — физическая композиция: фигурная доска, закрытый набор фигур и одна цель, решаемая обычными шахматными ходами.",
  aboutRuleTitle: "Правило",
  aboutRule:
    "Фигуры ходят точно так же, как в шахматах. Занятую клетку взять нельзя — кроме случая, когда композиция называет взятие целью. Закрытые клетки — часть устройства доски, а не пустое место.",
  aboutLineTitle: "Линия",
  aboutLine:
    "У каждого этюда указана длина авторского решения. Можно идти более длинным путём. Достичь цели — работа; попасть в пар — мастерство.",
  aboutEditionTitle: "Это издание",
  aboutEdition:
    "Четыре композиции 2025 года, перенесённые в браузер без изменения геометрии и правил. Физические оригиналы остаются работой автора.",
  contact: "Вопросы о композициях:",
  puzzles: {
    "rook-sacrifice": {
      title: "Жертва ладьи",
      goal: "Возьмите чёрную ладью слоном.",
      instruction:
        "Ходите как в обычных шахматах. Единственное разрешённое взятие — слон берёт чёрную ладью. Белые пешки идут к верхнему краю доски.",
    },
    "black-pawn": {
      title: "Чёрная пешка",
      goal: "Возьмите чёрную пешку конём.",
      instruction:
        "Ходите как в обычных шахматах. Единственное разрешённое взятие — конь берёт чёрную пешку. Белые пешки идут к верхнему краю доски.",
    },
    "four-square": {
      title: "Четыре клетки",
      goal: "Поставьте каждый тип фигур на 4 красные клетки (кони, слоны и ладьи). Порядок не важен.",
      instruction:
        "Ходите как в обычных шахматах. Без взятий. Когда все четыре красные клетки заняты одним типом фигур, этот набор засчитывается. Сделайте это конями, слонами и ладьями — в любом порядке — чтобы закончить.",
    },
    "queen-moves": {
      title: "Ходы ферзя",
      goal: "Приведите ферзя на пустую клетку и восстановите начальные ряды: ладьи сверху, слоны снизу.",
      instruction:
        "Ходите как в обычных шахматах. Без взятий. Ферзь начинает слева внизу; пустая клетка справа внизу — цель. Победа только когда он там, верхний ряд снова из ладей, а под ним полный ряд слонов (порядок внутри ряда свободный).",
    },
  },
};

const DICTS: Record<Lang, Dict> = { es, fr, en, ru };

let current: Lang = "en";

export function getLang(): Lang {
  return current;
}

export function t(): Dict {
  return DICTS[current];
}

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem("sherzod-lang");
    if (saved === "es" || saved === "fr" || saved === "en" || saved === "ru") return saved;
  } catch {
    /* private mode */
  }
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  if (nav === "es" || nav === "fr" || nav === "ru") return nav;
  return "en";
}

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem("sherzod-lang", lang);
  } catch {
    /* private mode */
  }
  document.documentElement.lang = lang;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", DICTS[lang].metaDescription);
}
