/* Shared inline line-icon set (loaded before host.js / player.js).
 * Feather/Lucide-style paths, stroke = currentColor so they inherit color. */
const ICONS = {
  players: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2.5"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  trophy: '<path d="M6 4h12v4a6 6 0 0 1-12 0z"/><path d="M6 6H4a2 2 0 0 0 2 2"/><path d="M18 6h2a2 2 0 0 1-2 2"/><line x1="12" y1="14" x2="12" y2="18"/><path d="M8 21h8"/><path d="M10 18h4v3h-4z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  shuffle: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  tri: '<path d="M12 4 22 20 2 20 Z"/>',
  diamond: '<path d="M12 2 22 12 12 22 2 12 Z"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  square: '<rect x="4" y="4" width="16" height="16" rx="2.5"/>',
  power: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  couch: '<path d="M5 14V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"/><path d="M3 18v-4a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M6 19v2"/><path d="M18 19v2"/>',
  mask: '<path d="M3 8h18a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5 4.5 4.5 0 0 1-3.6-1.9 1 1 0 0 0-1.6 0A4.5 4.5 0 0 1 8 16a5 5 0 0 1-5-5V9a1 1 0 0 1 1-1z"/><line x1="7" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="17" y2="12"/>',
  cards: '<rect x="9" y="3" width="11" height="16" rx="2"/><path d="M6 7 4.6 8a2 2 0 0 0-1 2.5l3.2 8.8a2 2 0 0 0 2.5 1.2L15 18.4"/>',
};

function icon(name, cls) {
  return `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

/* Wide couch outline that stretches to frame the word "Couch" in the logo.
 * preserveAspectRatio="none" lets it fill any box; non-scaling-stroke keeps the
 * line weight even when stretched wide. */
function couchFrame() {
  return `<svg class="couch-frame-svg" viewBox="0 0 100 60" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 30 V12 a6 6 0 0 1 6 -6 h52 a6 6 0 0 1 6 6 v18" vector-effect="non-scaling-stroke"/>
    <path d="M6 50 v-14 a8 8 0 0 1 16 0 v4 h56 v-4 a8 8 0 0 1 16 0 v14 a3 3 0 0 1 -3 3 H9 a3 3 0 0 1 -3 -3 z" vector-effect="non-scaling-stroke"/>
    <path d="M16 53 v5" vector-effect="non-scaling-stroke"/>
    <path d="M84 53 v5" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

/* Playing-card face + back, shared by the card games (Crazy Eights, etc.). */
function cardFace(card, cls) {
  if (!card) return "";
  const red = card.suit === "♥" || card.suit === "♦";
  return `<div class="pcard ${red ? "red" : "black"} ${cls || ""}"><span class="pc-rank">${card.rank}</span><span class="pc-suit">${card.suit}</span></div>`;
}
function cardBack(cls) {
  return `<div class="pcard back ${cls || ""}"><span class="pc-back-mark">♣</span></div>`;
}

/* Numbered rank badge (gold/silver/bronze for top 3) — replaces medal emoji. */
function rankBadge(i) {
  return `<span class="rank-badge r${i + 1 <= 3 ? i + 1 : "n"}">${i + 1}</span>`;
}

/* Per-game identity: icon + accent color (kept in sync on host + player). */
const GAME_ICONS = {
  wordWaterfall: "grid",
  triviaRush: "help",
  liarLiar: "search",
  promptParty: "mic",
  reflexRush: "zap",
  herdMentality: "players",
  doodleDash: "pencil",
  imposter: "mask",
  crazyEights: "cards",
};
const GAME_COLORS = {
  wordWaterfall: "var(--cyan)",
  triviaRush: "var(--yellow)",
  liarLiar: "var(--magenta)",
  promptParty: "var(--orange)",
  reflexRush: "var(--green)",
  herdMentality: "var(--pink)",
  doodleDash: "var(--blue)",
  imposter: "var(--red)",
  crazyEights: "var(--purple)",
};

/* FLIP animation: capture element positions before a re-render, then after the
 * re-render slide each element (matched by data-id) from its old spot to its new
 * one. Used so the letter bank visibly shuffles instead of snapping. */
function captureTiles(sel) {
  const m = new Map();
  document.querySelectorAll(sel).forEach((el) => {
    const id = el.dataset.id;
    if (id != null) { const r = el.getBoundingClientRect(); m.set(id, { x: r.left, y: r.top }); }
  });
  return m;
}
function playFlip(sel, before) {
  if (!before || !before.size) return;
  document.querySelectorAll(sel).forEach((el) => {
    const b = before.get(el.dataset.id);
    if (!b) return;
    const r = el.getBoundingClientRect();
    const dx = b.x - r.left, dy = b.y - r.top;
    if (!dx && !dy) return;
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = "transform .5s cubic-bezier(.2,.8,.2,1)";
      el.style.transform = "";
    }));
  });
}

/* Doodle Dash shared canvas: strokes use normalized 0–1 coords so any size renders. */
const Doodle = {
  cv: null, c2: null, strokes: {},
  attach(canvas) {
    if (!canvas) return;
    this.cv = canvas;
    this.c2 = canvas.getContext("2d");
    this.strokes = {};
  },
  clear() {
    this.strokes = {};
    if (this.c2) this.c2.clearRect(0, 0, this.cv.width, this.cv.height);
  },
  _line(s, pts) {
    const c = this.c2, W = this.cv.width, H = this.cv.height;
    if (!c || !pts.length) return;
    c.strokeStyle = s.color; c.lineWidth = s.width; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath();
    const last = s.pts[s.pts.length - 1];
    if (last) c.moveTo(last.x * W, last.y * H); else c.moveTo(pts[0].x * W, pts[0].y * H);
    for (const p of pts) c.lineTo(p.x * W, p.y * H);
    c.stroke();
    for (const p of pts) s.pts.push(p);
  },
  seg(id, pts, color, width) {
    let s = this.strokes[id];
    if (!s) s = this.strokes[id] = { color, width, pts: [] };
    this._line(s, pts);
  },
  redraw(strokes) {
    this.strokes = {};
    if (this.c2) this.c2.clearRect(0, 0, this.cv.width, this.cv.height);
    for (const st of strokes || []) {
      const s = this.strokes[st.id] = { color: st.color, width: st.width, pts: [] };
      this._line(s, st.pts);
    }
  },
};

window.icon = icon;
window.rankBadge = rankBadge;
window.GAME_ICONS = GAME_ICONS;
window.GAME_COLORS = GAME_COLORS;
window.captureTiles = captureTiles;
window.playFlip = playFlip;
window.Doodle = Doodle;
