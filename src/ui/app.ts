import type { Cell, PieceKind, Pos, Puzzle } from "../engine/types";
import { Game, formatTime } from "../engine/game";
import { puzzles, puzzleById } from "../puzzles/data";
import { pieceSrc } from "./pieces";
import { isMuted, playSfx, preloadSfx, toggleMuted } from "./sfx";
import { detectLang, fmt, getLang, LANGS, setLang, t, type Lang } from "../i18n";

type View = "home" | "play" | "about";

const CARD_THEME: Record<string, string> = {
  "rook-sacrifice": "",
  "black-pawn": "gold",
  "four-square": "purple",
  "queen-moves": "teal",
};

const CARD_ICON: Record<string, { kind: PieceKind; color: "w" | "b" }> = {
  "rook-sacrifice": { kind: "R", color: "w" },
  "black-pawn": { kind: "P", color: "b" },
  "four-square": { kind: "N", color: "w" },
  "queen-moves": { kind: "Q", color: "w" },
};

const SOLVED_KEY = "sherzod-solved";
const BEST_KEY = "sherzod-best";

function loadSolved(): Set<string> {
  try {
    const raw = localStorage.getItem(SOLVED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function markSolved(id: string): void {
  const solved = loadSolved();
  if (solved.has(id)) return;
  solved.add(id);
  try {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...solved]));
  } catch {
    /* private mode */
  }
}

function loadBests(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, number> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        out[id] = Math.floor(value);
      }
    }
    return out;
  } catch {
    return {};
  }
}

function bestFor(id: string): number | null {
  const value = loadBests()[id];
  return typeof value === "number" ? value : null;
}

/** Saves best (fewest) moves; returns the stored best after update. */
function recordBest(id: string, moves: number): number {
  const bests = loadBests();
  const prev = bests[id];
  if (prev === undefined || moves < prev) {
    bests[id] = moves;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(bests));
    } catch {
      /* private mode */
    }
    return moves;
  }
  return prev;
}

function bestAttemptLine(id: string): string {
  const copy = t();
  const best = bestFor(id);
  if (best === null) return copy.bestAttemptEmpty;
  return fmt(copy.bestAttempt, { moves: best });
}

const GLOBE_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 12h18M12 3c2.8 3.2 2.8 14.8 0 18M12 3c-2.8 3.2-2.8 14.8 0 18" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';

const SOUND_ON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3.2L12 18.5V5.5L7.2 10H4z" fill="currentColor"/><path d="M15.2 9.2a3.4 3.4 0 0 1 0 5.6M17.6 6.6a6.4 6.4 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

const SOUND_OFF_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3.2L12 18.5V5.5L7.2 10H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

function soundToggleBtn(ariaLabel: string): string {
  const muted = isMuted();
  return `<button type="button" class="icon-btn${muted ? " is-muted" : ""}" data-act="mute" aria-label="${ariaLabel}" aria-pressed="${muted ? "true" : "false"}">${muted ? SOUND_OFF_SVG : SOUND_ON_SVG}</button>`;
}

function parsePath(rawPath: string): { view: View; id?: string } {
  const raw = rawPath.replace(/^#/, "") || "/";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  if (path.startsWith("/play/")) {
    return { view: "play", id: path.slice("/play/".length) };
  }
  if (path === "/about") return { view: "about" };
  return { view: "home" };
}

function isPos(el: EventTarget | null): Pos | null {
  if (!(el instanceof HTMLElement)) return null;
  const square = el.closest<HTMLElement>("[data-r]");
  if (!square) return null;
  const r = Number(square.dataset.r);
  const c = Number(square.dataset.c);
  if (Number.isNaN(r) || Number.isNaN(c)) return null;
  return { r, c };
}

function legalKey(legal: Pos[]): Set<string> {
  return new Set(legal.map((p) => `${p.r}:${p.c}`));
}

function renderPiece(cell: Cell): string {
  if (!cell.piece) return "";
  const { kind, color } = cell.piece;
  const copy = t();
  const label = `${color === "w" ? copy.white : copy.black} ${copy.pieces[kind]}`;
  return `<img class="queen-piece piece piece-${color}" src="${pieceSrc(kind, color)}" alt="${label}" draggable="false" />`;
}

function renderBoard(puzzle: Puzzle, game: Game | null, interactive: boolean): string {
  const board = game?.board ?? puzzle.board;
  const selected = game?.selected ?? null;
  const legal = legalKey(game?.legal ?? []);

  const squares = board
    .map((row, r) =>
      row
        .map((cell, c) => {
          const classes = ["sq", "casilla"];
          if (cell.blocked) classes.push("blocked");
          else classes.push((r + c) % 2 === 0 ? "blanca" : "negra");
          if (cell.red) classes.push("red");
          else if (cell.target) classes.push("goal");
          if (cell.piece?.color === "b") classes.push("prey");
          if (selected?.r === r && selected?.c === c) classes.push("selected");
          if (legal.has(`${r}:${c}`)) classes.push("legal");
          if (cell.piece && legal.has(`${r}:${c}`)) classes.push("capture");
          const label = cell.blocked
            ? t().blocked
            : fmt(t().square, { r: r + 1, c: c + 1 });
          const inner = renderPiece(cell);
          if (interactive && !cell.blocked) {
            return `<button type="button" class="${classes.join(" ")}" data-r="${r}" data-c="${c}" aria-label="${label}">${inner}</button>`;
          }
          return `<div class="${classes.join(" ")}" data-r="${r}" data-c="${c}">${inner}</div>`;
        })
        .join(""),
    )
    .join("");

  return `<div class="board" id="tablero" style="--cols:${puzzle.cols};--rows:${puzzle.rows}" role="grid">${squares}</div>`;
}

export class App {
  private root: HTMLElement;
  private game: Game | null = null;
  private clock: ReturnType<typeof setInterval> | null = null;
  private drag: {
    from: Pos;
    pointerId: number;
    startX: number;
    startY: number;
    active: boolean;
    origin: HTMLElement;
    selectSound?: boolean;
  } | null = null;
  private ghost: HTMLElement | null = null;
  private langOpen = false;
  private path = "/";
  private suppressClick = false;

  constructor(root: HTMLElement) {
    this.root = root;
    setLang(detectLang());
    this.path = (() => {
      const raw = location.hash.replace(/^#/, "") || "/";
      return raw.startsWith("/") ? raw : `/${raw}`;
    })();
    window.addEventListener("hashchange", () => {
      const raw = location.hash.replace(/^#/, "") || "/";
      this.path = raw.startsWith("/") ? raw : `/${raw}`;
      this.render();
    });
    this.root.addEventListener("pointerdown", (e) => this.onPointerDown(e), { passive: false });
    window.addEventListener("pointermove", (e) => this.onPointerMove(e), { passive: false });
    window.addEventListener("pointerup", (e) => this.onPointerUp(e));
    window.addEventListener("pointercancel", (e) => this.onPointerUp(e));
    this.root.addEventListener("click", (e) => this.onClick(e));
    window.addEventListener("keydown", (e) => this.onKey(e));
    window.addEventListener("resize", () => this.fitBoard());
    (window as unknown as { SherzodConsumeBack: () => boolean }).SherzodConsumeBack = () =>
      this.consumeBack();
    this.render();
  }

  private closeSheet(sheet?: HTMLElement | null): void {
    if (!sheet) return;
    sheet.hidden = true;
    sheet.classList.remove("open");
  }

  private consumeBack(): boolean {
    const sheet = this.root.querySelector<HTMLElement>(".sheet.open, .sheet:not([hidden])");
    if (sheet) {
      this.closeSheet(sheet);
      return true;
    }
    if (this.langOpen) {
      this.langOpen = false;
      this.root.querySelector("#selector-idioma")?.setAttribute("hidden", "");
      return true;
    }
    if (parsePath(this.path).view === "play") {
      this.routeTo("/");
      return true;
    }
    return false;
  }

  private fitBoard(): void {
    const game = this.game;
    if (!game || parsePath(this.path).view !== "play") return;
    const play = this.root.querySelector("#screen-play");
    const stage = this.root.querySelector(".board-stage");
    if (!play || !stage) return;
    const hud = this.root.querySelector(".hud") as HTMLElement | null;
    const label = this.root.querySelector(".play-label") as HTMLElement | null;
    const meters = this.root.querySelector(".board-meters") as HTMLElement | null;
    const bar = this.root.querySelector(".play-bar") as HTMLElement | null;
    const used =
      (hud?.offsetHeight ?? 0) +
      (label?.offsetHeight ?? 0) +
      (meters?.offsetHeight ?? 0) +
      (bar?.offsetHeight ?? 0) +
      28;
    const w = Math.max(160, (stage as HTMLElement).clientWidth || play.clientWidth);
    const h = Math.max(160, play.clientHeight - used);
    const frame = 16;
    const border = 8;
    const cell = Math.max(
      22,
      Math.floor(
        Math.min(
          (w - (frame + border) * 2 - 4) / game.puzzle.cols,
          (h - (frame + border) * 2 - 4) / game.puzzle.rows,
        ),
      ),
    );
    document.documentElement.style.setProperty("--cell", `${cell}px`);
    document.documentElement.style.setProperty("--frame", `${frame}px`);
  }

  private clearDrag(): void {
    this.drag = null;
    this.ghost?.remove();
    this.ghost = null;
    document.body.classList.remove("is-dragging");
  }

  private routeTo(path: string): void {
    const next = path.startsWith("/") ? path : `/${path}`;
    this.path = next || "/";
    try {
      location.hash = this.path;
    } catch {
      /* Capacitor WebView can reject hash writes */
    }
    this.render();
  }

  private render(resetGame = true): void {
    this.clearDrag();
    if (resetGame) {
      this.stopClock();
      this.game?.stopTimer();
      this.game = null;
    }

    const route = parsePath(this.path);
    const copy = t();
    if (route.view === "play" && route.id) {
      const puzzle = puzzleById(route.id);
      if (!puzzle) {
        this.routeTo("/");
        return;
      }
      if (!this.game || this.game.puzzle.id !== puzzle.id) {
        this.game = new Game(puzzle);
      }
      document.title = `${copy.puzzles[puzzle.id].title} — Chess Puzzles`;
      document.body.classList.add("is-play");
      document.body.classList.remove("is-home");
      this.root.innerHTML = this.playView(puzzle);
      this.startClock();
      requestAnimationFrame(() => this.fitBoard());
      return;
    }

    document.body.classList.add("is-home");
    document.body.classList.remove("is-play");
    document.title = copy.metaTitle;
    this.root.innerHTML = this.homeView();
  }

  private homeView(): string {
    const copy = t();
    const lang = getLang();
    const langs = LANGS.map(
      (item) =>
        `<button type="button" data-lang="${item.id}" class="${item.id === lang ? "on" : ""}">${item.native}</button>`,
    ).join("");
    const solved = loadSolved();
    const cards = puzzles
      .map((p) => {
        const text = copy.puzzles[p.id];
        const theme = CARD_THEME[p.id] ?? "";
        const icon = CARD_ICON[p.id] ?? { kind: "Q" as PieceKind, color: "w" as const };
        const done = solved.has(p.id) ? "done" : "";
        return `
        <button type="button" class="mode-card ${theme} ${done}" data-play="${p.id}">
          <span class="mode-ico piece-${icon.color}"><img src="${pieceSrc(icon.kind, icon.color)}" alt=""></span>
          <span class="mode-name">${text.title}</span>
        </button>`;
      })
      .join("");

    return `
      <section id="screen-home" class="screen">
        <header class="home-top">
          <div class="lang-wrap">
            <button type="button" class="icon-btn" data-act="lang-menu" aria-label="${copy.language}">
              ${GLOBE_SVG}
            </button>
            <div class="lang-menu" id="selector-idioma" ${this.langOpen ? "" : "hidden"}>
              ${langs}
            </div>
          </div>
          ${soundToggleBtn(isMuted() ? copy.soundOn : copy.soundOff)}
        </header>
        <div class="hero">
          <div class="crest" aria-hidden="true"><img src="./img/knight-crest.png?v=10" alt="" width="76" height="76"></div>
          <h1 id="logo">${copy.homeTitle}</h1>
        </div>
        <div class="mode-grid">${cards}</div>
        <button type="button" class="how-chip" data-act="how">${copy.howToPlay}</button>
        <div class="home-foot">
          <p class="home-author">${copy.footer}</p>
          <p class="home-credit">${copy.homeCredit}</p>
        </div>
      </section>
      <div class="sheet sheet-center" id="how-sheet" data-modal hidden>
        ${this.howMarkup()}
      </div>`;
  }

  private howMarkup(): string {
    const copy = t();
    return `
      <div class="sheet-card">
        <button type="button" class="sheet-x" data-close="how-sheet" aria-label="${copy.back}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
        </button>
        <h2>${copy.howToPlay}</h2>
        <div class="how-block">
          <h3>${copy.howObjectiveTitle}</h3>
          <p>${copy.howObjectiveBody}</p>
        </div>
        <div class="how-block">
          <h3>${copy.howRulesTitle}</h3>
          <p>${copy.howRulesBody}</p>
        </div>
      </div>`;
  }

  private playView(puzzle: Puzzle): string {
    const game = this.game!;
    const copy = t();
    const text = copy.puzzles[puzzle.id];
    return `
      <section id="screen-play" class="screen">
        <header class="hud">
          <button type="button" class="icon-btn" data-act="back" aria-label="${copy.back}">‹</button>
          ${soundToggleBtn(isMuted() ? copy.soundOn : copy.soundOff)}
        </header>
        <p class="play-label">${text.title}</p>
        <p class="play-goal">${text.goal}</p>
        <div class="board-stage">
          <div id="tablero-container">
            ${renderBoard(puzzle, game, true)}
          </div>
        </div>
        ${this.phasesMarkup(game)}
        <div class="board-meters">
          <div id="cronometro">${formatTime(game.seconds)}</div>
          <div id="contador">${copy.moves} ${game.moves}</div>
        </div>
        <footer class="play-bar">
          <button type="button" id="undo" data-act="undo" ${game.history.length === 0 ? "disabled" : ""}>${copy.undo}</button>
          <button type="button" id="reset" data-act="reset">${copy.reset}</button>
        </footer>
        <p class="best-mark" id="mejor-marca">${bestAttemptLine(puzzle.id)}</p>
      </section>
      <div class="sheet${game.won ? " open" : ""}" data-modal ${game.won ? "" : "hidden"}>
        ${this.victoryMarkup(game)}
      </div>`;
  }

  private phasesMarkup(game: Game): string {
    const win = game.puzzle.win;
    if (win.type !== "groups-on-red") return "";
    const copy = t();
    const items = win.groups
      .map((g) => {
        const done = game.phases.has(g) ? "done" : "";
        return `<li class="${done}">${copy.groups[g as "N" | "B" | "R"]}</li>`;
      })
      .join("");
    return `<div class="phase-wrap"><p class="phase-label">${copy.piecesPlaced}</p><ul class="phases" id="fases">${items}</ul></div>`;
  }

  private victoryMarkup(game: Game): string {
    const copy = t();
    const beat = game.moves <= game.puzzle.par;
    const best = bestFor(game.puzzle.id);
    const bestLine =
      best !== null
        ? `<p class="best-mark in-sheet">${fmt(copy.bestAttempt, { moves: best })}</p>`
        : "";
    return `
      <div class="sheet-card">
        <p class="eyebrow">${beat ? copy.onPar : copy.solved}</p>
        <h2>${copy.complete}</h2>
        <p>${fmt(copy.victoryLine, {
          moves: game.moves,
          time: formatTime(game.seconds),
          par: game.puzzle.par,
        })}</p>
        ${bestLine}
        <div class="modal-actions">
          <button type="button" class="solid" data-act="reset">${copy.playAgain}</button>
          <button type="button" class="ghost" data-act="back">${copy.allPuzzles}</button>
        </div>
      </div>`;
  }

  private applyResult(result: ReturnType<Game["select"]>): void {
    if (result === "ignored" || result === "deselected") return;
    if (result === "selected") playSfx("select");
    if (result === "moved") playSfx("move");
    if (result === "captured" || (result === "won" && this.game?.lastCapture)) {
      playSfx("capture");
    } else if (result === "won") {
      playSfx("move");
    }
    this.syncPlay(result === "won");
    if (result === "moved" || result === "captured" || result === "won") {
      navigator.vibrate?.(result === "captured" ? 18 : 12);
    }
  }

  private paintHighlights(): void {
    const game = this.game;
    if (!game) return;
    const legal = legalKey(game.legal);
    this.root.querySelectorAll<HTMLElement>(".sq").forEach((sq) => {
      const r = Number(sq.dataset.r);
      const c = Number(sq.dataset.c);
      sq.classList.toggle("selected", game.selected?.r === r && game.selected?.c === c);
      const isLegal = legal.has(`${r}:${c}`);
      sq.classList.toggle("legal", isLegal);
      sq.classList.toggle("capture", isLegal && Boolean(sq.querySelector(".piece")));
    });
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!this.game || this.game.won) return;
    const pos = isPos(event.target);
    if (!pos) return;
    const square = (event.target as HTMLElement).closest<HTMLElement>(".sq");
    if (!square || square.classList.contains("blocked")) return;
    const hasPiece = Boolean(this.game.board[pos.r][pos.c].piece);
    if (!hasPiece) return;

    event.preventDefault();
    preloadSfx();
    this.drag = {
      from: pos,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      origin: square,
      selectSound: false,
    };

    try {
      square.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }

    // Floating piece follows the finger/cursor as soon as you grab it.
    this.beginDragGhost(event.clientX, event.clientY);
  }

  private beginDragGhost(clientX: number, clientY: number): void {
    if (!this.drag || !this.game || this.ghost) return;
    this.drag.active = true;
    this.suppressClick = true;
    document.body.classList.add("is-dragging");
    this.drag.origin.classList.add("dragging");

    if (this.game.selected?.r !== this.drag.from.r || this.game.selected?.c !== this.drag.from.c) {
      const result = this.game.select(this.drag.from);
      if (result === "selected") {
        if (!this.drag.selectSound) {
          playSfx("select");
          this.drag.selectSound = true;
        }
        this.paintHighlights();
      } else {
        this.applyResult(result);
      }
    } else {
      this.paintHighlights();
    }

    const piece = this.drag.origin.querySelector(".piece");
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    const size = this.drag.origin.getBoundingClientRect().width;
    ghost.style.setProperty("--ghost", `${size}px`);
    if (piece) ghost.appendChild(piece.cloneNode(true));
    document.body.appendChild(ghost);
    this.ghost = ghost;
    ghost.style.left = `${clientX}px`;
    ghost.style.top = `${clientY}px`;
    this.markDropTarget(clientX, clientY);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId || !this.game) return;
    if (this.drag.active) {
      event.preventDefault();
    }
    if (!this.drag.active) {
      const dx = event.clientX - this.drag.startX;
      const dy = event.clientY - this.drag.startY;
      if (Math.hypot(dx, dy) > 4) {
        this.beginDragGhost(event.clientX, event.clientY);
      }
    }
    if (this.drag.active && this.ghost) {
      this.ghost.style.left = `${event.clientX}px`;
      this.ghost.style.top = `${event.clientY}px`;
      this.markDropTarget(event.clientX, event.clientY);
    }
  }

  private markDropTarget(x: number, y: number): void {
    this.root.querySelectorAll(".drop-target").forEach((el) => el.classList.remove("drop-target"));
    const el = document.elementFromPoint(x, y);
    const sq = el instanceof HTMLElement ? el.closest<HTMLElement>(".sq") : null;
    if (sq && this.game) {
      const pos = isPos(sq);
      if (pos && this.game.legal.some((p) => p.r === pos.r && p.c === pos.c)) {
        sq.classList.add("drop-target");
      }
    }
  }

  private onPointerUp(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const drag = this.drag;
    this.drag = null;
    document.body.classList.remove("is-dragging");
    this.root.querySelectorAll(".drop-target").forEach((el) => el.classList.remove("drop-target"));
    if (this.ghost) {
      this.ghost.remove();
      this.ghost = null;
    }
    drag.origin.classList.remove("dragging");
    try {
      drag.origin.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }

    if (!drag.active) {
      this.suppressClick = false;
      return;
    }
    if (!this.game) {
      this.suppressClick = false;
      return;
    }
    const destEl = document.elementFromPoint(event.clientX, event.clientY);
    const dest = isPos(destEl);
    if (dest && (dest.r !== drag.from.r || dest.c !== drag.from.c)) {
      this.applyResult(this.game.drop(drag.from, dest));
    } else {
      this.paintHighlights();
    }
    // If no click follows (common after drag), don't leave suppressClick stuck.
    window.setTimeout(() => {
      this.suppressClick = false;
    }, 0);
  }

  private onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Drag sets suppressClick to ignore the synthetic board click after pointerup.
    // Do not swallow chrome controls (back, undo, reset, mute, etc.).
    if (this.suppressClick) {
      this.suppressClick = false;
      if (target.closest(".sq, .board, #tablero, #tablero-container")) return;
    }
    const closeId = target.closest<HTMLElement>("[data-close]")?.dataset.close;
    if (closeId) {
      this.closeSheet(this.root.querySelector<HTMLElement>(`#${closeId}`));
      return;
    }

    const playId = target.closest<HTMLElement>("[data-play]")?.dataset.play;
    if (playId && puzzleById(playId)) {
      this.routeTo(`/play/${playId}`);
      return;
    }

    const langEl = target.closest<HTMLElement>("[data-lang]");
    const nextLang = langEl?.dataset.lang as Lang | undefined;
    if (nextLang && LANGS.some((item) => item.id === nextLang)) {
      setLang(nextLang);
      this.langOpen = false;
      this.render(false);
      return;
    }

    const act = target.closest<HTMLElement>("[data-act]")?.dataset.act;
    if (act === "lang-menu") {
      event.stopPropagation();
      this.langOpen = !this.langOpen;
      const menu = this.root.querySelector<HTMLElement>("#selector-idioma");
      if (menu) menu.hidden = !this.langOpen;
      return;
    }
    if (act === "mute") {
      event.stopPropagation();
      toggleMuted();
      this.render(false);
      return;
    }
    if (act === "how") {
      const sheet = this.root.querySelector<HTMLElement>("#how-sheet");
      if (sheet) {
        sheet.hidden = false;
        sheet.classList.add("open");
      }
      return;
    }
    if (act === "back") {
      this.routeTo("/");
      return;
    }
    if (act === "undo" && this.game) {
      if (this.game.undo()) this.syncPlay(false);
      return;
    }
    if (act === "reset" && this.game) {
      this.game.reset();
      this.syncPlay(false);
      return;
    }

    if (!this.game || this.game.won) return;
    const square = target.closest<HTMLElement>(".sq");
    if (!square || square.classList.contains("blocked")) return;
    const pos = isPos(square);
    if (!pos) return;
    preloadSfx();
    this.applyResult(this.game.select(pos));
  }

  private onKey(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.consumeBack()) return;
    if (!this.game) return;
    if ((event.key === "z" || event.key === "Z") && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (this.game.undo()) this.syncPlay(false);
      return;
    }
    if (event.key === "Escape") {
      this.game.deselect();
      this.syncPlay(false);
    }
  }

  private syncPlay(won: boolean): void {
    const game = this.game;
    if (!game) return;
    const stage = this.root.querySelector("#tablero-container");
    if (stage) stage.innerHTML = renderBoard(game.puzzle, game, true);
    this.patchStats();
    const phaseWrap = this.root.querySelector(".phase-wrap");
    const phasesHtml = this.phasesMarkup(game);
    if (phaseWrap) {
      if (phasesHtml) phaseWrap.outerHTML = phasesHtml;
      else phaseWrap.remove();
    } else if (phasesHtml) {
      this.root.querySelector(".board-stage")?.insertAdjacentHTML("afterend", phasesHtml);
    }
    const modal = this.root.querySelector<HTMLElement>("[data-modal]");
    if (won) {
      markSolved(game.puzzle.id);
      recordBest(game.puzzle.id, game.moves);
      this.stopClock();
    } else {
      this.startClock();
    }
    if (modal) {
      modal.hidden = !game.won;
      modal.classList.toggle("open", game.won);
      modal.innerHTML = this.victoryMarkup(game);
    }
    const bestEl = this.root.querySelector("#mejor-marca");
    if (bestEl) bestEl.textContent = bestAttemptLine(game.puzzle.id);
  }

  private patchStats(): void {
    const game = this.game;
    if (!game) return;
    const time = this.root.querySelector("#cronometro");
    const moves = this.root.querySelector("#contador");
    const undoBtn = this.root.querySelector<HTMLButtonElement>("#undo");
    const bestEl = this.root.querySelector("#mejor-marca");
    if (time) time.textContent = formatTime(game.seconds);
    if (moves) moves.textContent = `${t().moves} ${game.moves}`;
    if (undoBtn) undoBtn.disabled = game.history.length === 0;
    if (bestEl) bestEl.textContent = bestAttemptLine(game.puzzle.id);
  }

  private startClock(): void {
    this.stopClock();
    this.clock = setInterval(() => this.patchStats(), 250);
  }

  private stopClock(): void {
    if (this.clock) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }
}
