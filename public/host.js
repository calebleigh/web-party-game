/* global io */
const socket = io();
const app = document.getElementById("app");
let state = null;
let lobbyView = "main"; // "main" | "cards" — which lobby sub-view the big screen shows

let hostId = localStorage.getItem("pb_hostId") || null;
let hostCode = localStorage.getItem("pb_hostCode") || null;
socket.on("connect", () => socket.emit("host:hello", { hostId, code: hostCode }));
socket.on("host:welcome", ({ code, hostId: hid }) => {
  hostId = hid; hostCode = code;
  localStorage.setItem("pb_hostId", hid);
  localStorage.setItem("pb_hostCode", code);
});
socket.on("host:state", (s) => { state = s; render(); });

function openGame(id) { socket.emit("host:openHub", { gameId: id }); }
function setOpt(key, val) { socket.emit("host:setConfig", { config: { [key]: val } }); }
function toggleOpt(key, id) {
  const cur = (state.hub && Array.isArray(state.hub.config[key])) ? state.hub.config[key].slice() : [];
  const i = cur.indexOf(id);
  if (i >= 0) cur.splice(i, 1); else cur.push(id);
  socket.emit("host:setConfig", { config: { [key]: cur } });
}
window.toggleOpt = toggleOpt;
function startGame() { socket.emit("host:startGame"); }
function backToLobby() { socket.emit("host:backToLobby"); }
function endGame() { socket.emit("host:endGame"); }
function playAgain() { socket.emit("host:playAgain"); }
window.openGame = openGame;
window.setOpt = setOpt;
window.startGame = startGame;
window.backToLobby = backToLobby;
window.endGame = endGame;
window.playAgain = playAgain;

/* Shared game-over action buttons: replay the same game, or return to the lobby. */
function finalActions() {
  return `<div class="final-actions">
    <button class="btn big teal" onclick="playAgain()">Play again</button>
    <button class="btn ghost" onclick="endGame()">Back to games</button>
  </div>`;
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let lastKey = null;
let lastScreenSig = null;
/* True only when we move to a genuinely new screen — so deal-in animations
 * fire on transitions, never on incidental re-renders (score ticks, etc.). */
function screenChanged(sig) {
  const changed = sig !== lastScreenSig;
  lastScreenSig = sig;
  return changed;
}

function render() {
  if (!state) { app.innerHTML = `<div class="center"><span style="color:var(--cyan)">${icon("power", "status-ic")}</span><h2>Starting up…</h2></div>`; lastKey = null; lastScreenSig = null; document.body.dataset.phase = ""; return; }
  // Only gameplay screens are locked to the viewport (see CSS). Lobby and game
  // hubs may be taller than the screen, so they must stay scrollable.
  document.body.dataset.phase = state.phase;
  if (state.phase !== "lobby") lobbyView = "main";
  if (state.phase === "lobby") { lastKey = null; return renderLobby(); }
  if (state.phase === "hub") { lastKey = null; return renderHub(); }
  return renderGame();
}

/* A signature of everything EXCEPT the countdown, so a pure timer tick
 * doesn't rebuild the DOM (which would restart animations / cause flicker). */
function stateKey() {
  const c = JSON.parse(JSON.stringify(state));
  if (c.game) { delete c.game.timeLeft; delete c.game.countdown; delete c.game.drawing; }
  return JSON.stringify(c);
}

// Live drawing relays (Doodle Dash) — draw onto the current canvas, no re-render.
socket.on("doodle:seg", (d) => { if (state && state.gameId === "doodleDash") window.Doodle.seg(d.id, d.pts, d.color, d.width); });
socket.on("doodle:clear", () => window.Doodle.clear());

function patchTimer() {
  const el = document.querySelector(".timer-ring");
  const t = state.game && state.game.timeLeft;
  if (el && t != null) {
    el.textContent = t;
    el.classList.toggle("low", t <= 5);
  }
  // Ready-up countdown: update the number in place (no board rebuild).
  const cd = state.game && state.game.countdown;
  if (cd != null) {
    document.querySelectorAll("[data-cd]").forEach((e) => {
      if (e.textContent !== String(cd)) {
        e.textContent = cd;
        if (e.classList.contains("countdown-big")) { e.style.animation = "none"; void e.offsetWidth; e.style.animation = ""; }
      }
    });
  }
}

/* ---------------- LOBBY ---------------- */
function qrSVG(text) {
  try {
    if (!window.qrcode) return "";
    const qr = window.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 1, scalable: true });
  } catch (_) { return ""; }
}

function renderLobby() {
  const joinUrl = `${location.host}/play`;
  const code = state.code || "····";
  const players = state.players || [];
  const enter = screenChanged("lobby") ? " enter" : "";
  const qr = qrSVG(`${location.origin}/play?code=${code}`);

  app.innerHTML = `
    <div class="host-shell">
      <div class="lobby-top">
        <div class="host-title"><span class="logo cc-logo"><span class="cc-couch"><span class="cc-couch-frame">${couchFrame()}</span><span class="cc-couch-word">Couch</span></span><span class="cc-accent">Clash</span></span></div>
        <div class="join-card">
          ${qr ? `<div class="join-qr">${qr}</div>` : ""}
          <div class="join-info">
            <div class="join-line"><span class="join-num">1</span><div>Go to <b>${esc(joinUrl)}</b><div class="muted">or scan the code →</div></div></div>
            <div class="join-line"><span class="join-num">2</span><div>Enter room code<div class="code-display join-code">${esc(code)}</div></div></div>
          </div>
        </div>
      </div>

      <div class="host-main${enter}">
        <div class="players-panel">
          <div class="players-head">Players <span class="players-count">${players.length}</span></div>
          ${players.length
            ? `<div class="player-strip">${players.map(playerChip).join("")}</div>`
            : `<div class="players-empty">${icon("phone", "status-ic")}<p class="muted">Waiting for players — scan the QR or enter the code to join!</p></div>`}
        </div>

        ${sessionBoard(players)}

        <h2 style="margin-top:4px">${lobbyView === "cards" ? "Card Games" : players.length ? "Vote on your phones — the VIP picks!" : "Choose a game"}</h2>
        ${lobbyGrid(state.games || [], players.length)}
      </div>
    </div>`;
}

/* Session-wide leaderboard — the running total across every game played this
 * party. Hidden until at least one game has awarded points, so the lobby isn't
 * cluttered with a wall of zeroes before anyone has played. */
function sessionBoard(players) {
  const ranked = [...players]
    .filter((p) => (p.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  if (!ranked.length) return "";
  return `
    <div class="session-board">
      <div class="sb-head">${icon("trophy", "sb-trophy")} Session leaderboard</div>
      <ol class="sb-list">
        ${ranked.map((p, i) => `
          <li class="sb-row r${i < 3 ? i + 1 : "n"}">
            <span class="sb-rank">${i + 1}</span>
            <span class="avatar-dot" style="background:${p.color}"></span>
            <span class="sb-name">${esc(p.name)}</span>
            <span class="sb-score">${p.score || 0}</span>
          </li>`).join("")}
      </ol>
    </div>`;
}

function playerChip(p) {
  const vip = p.id === state.vipId;
  return `<div class="avatar-chip ${p.connected ? "" : "off"}">
    <span class="avatar-dot" style="background:${p.color}"></span>${esc(p.name)}${vip ? `<span class="vip-badge">VIP</span>` : ""}
  </div>`;
}

function gameCard(g, playerCount) {
  const ic = window.GAME_ICONS[g.id] || "grid";
  const color = window.GAME_COLORS[g.id] || "var(--cyan)";
  const votes = (state.votes || {})[g.id] || 0;
  // Always openable — the hub shows the room code so people can join there,
  // and its Start button stays disabled until enough players are in.
  return `<div class="game-card" onclick="openGame('${g.id}')">
    ${votes ? `<span class="vote-badge">${votes} ${votes === 1 ? "vote" : "votes"}</span>` : ""}
    <span style="color:${color}">${icon(ic, "game-ic")}</span>
    <h3>${esc(g.name)}</h3>
    <p>${esc(g.blurb)}</p>
    ${g.minPlayers > 1 ? `<p class="muted" style="margin-top:8px">Needs ${g.minPlayers}+ players</p>` : ""}
  </div>`;
}

/* Lobby grid — general games plus a single "Card Games" tile that opens a
 * sub-menu of the card games (keeps the lobby tidy as the card hub grows). */
function lobbyGrid(games, playerCount) {
  const cards = games.filter((g) => g.category === "cards");
  const main = games.filter((g) => g.category !== "cards");
  if (lobbyView === "cards") {
    return `<div class="game-grid">
      <div class="game-card gc-back" onclick="lobbyBack()"><span style="color:var(--ink-soft)">${icon("grid", "game-ic")}</span><h3>← All games</h3><p>Back to the full list</p></div>
      ${cards.map((g) => gameCard(g, playerCount)).join("")}
    </div>`;
  }
  return `<div class="game-grid">
    ${main.map((g) => gameCard(g, playerCount)).join("")}
    ${cards.length ? `<div class="game-card" onclick="openCardHub()">
      <span style="color:var(--purple)">${icon("cards", "game-ic")}</span>
      <h3>Card Games</h3>
      <p>Classic card games — Crazy Eights &amp; more</p>
      <p class="muted" style="margin-top:8px">${cards.length} game${cards.length > 1 ? "s" : ""}</p>
    </div>` : ""}
  </div>`;
}
window.openCardHub = () => { lobbyView = "cards"; render(); };
window.lobbyBack = () => { lobbyView = "main"; render(); };

/* ---------------- GAME HUB ---------------- */
function renderHub() {
  const h = state.hub;
  if (!h) { lastScreenSig = null; return renderLobby(); }
  const enter = screenChanged("hub:" + h.gameId) ? " enter" : "";
  const players = state.players || [];
  const ic = window.GAME_ICONS[h.gameId] || "grid";
  const color = window.GAME_COLORS[h.gameId] || "var(--cyan)";
  const need = Math.max(0, h.minPlayers - players.filter((p) => p.connected).length);

  const options = (h.options || []).map((opt) => `
    <div class="hub-opt">
      <div class="hub-opt-label">${esc(opt.label)}${opt.type === "multi" ? " (optional)" : ""}</div>
      <div class="hub-choices">
        ${(() => {
          let lastGroup = null;
          return opt.choices.map((c) => {
            const on = opt.type === "multi"
              ? Array.isArray(h.config[opt.key]) && h.config[opt.key].includes(c.id)
              : h.config[opt.key] === c.id;
            const handler = opt.type === "multi" ? `toggleOpt('${opt.key}','${c.id}')` : `setOpt('${opt.key}','${c.id}')`;
            let header = "";
            if (c.group && c.group !== lastGroup) { header = `<div class="hub-group">${esc(c.group)}</div>`; lastGroup = c.group; }
            return `${header}<button class="hub-choice ${on ? "on" : ""}" onclick="${handler}">
              <span class="hc-label">${esc(c.label)}</span>
              ${c.hint ? `<span class="hc-hint">${esc(c.hint)}</span>` : ""}
            </button>`;
          }).join("");
        })()}
      </div>
    </div>`).join("");

  app.innerHTML = `
    <div class="host-shell">
      <div class="host-top">
        <div class="host-title"><span style="color:${color}">${icon(ic)}</span> ${esc(h.name)}</div>
        <button class="btn ghost" onclick="backToLobby()">${icon("x")} Back</button>
      </div>
      <div class="host-main${enter}">
        <div class="hub-grid">
          <div class="hub-card">
            <div class="hub-head">How to play</div>
            ${demoHTML(h.gameId)}
            <ol class="howto">${(h.howTo || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
          </div>
          <div class="hub-card">
            <div class="hub-head">Get everyone in</div>
            <p class="muted">Players join at <b>${esc(location.host)}/play</b> with code</p>
            <div class="code-display hub-code">${esc(state.code)}</div>
            <div class="player-strip" style="margin-top:14px">
              ${players.length ? players.map(playerChip).join("") : `<span class="muted">No players yet…</span>`}
            </div>
          </div>
        </div>
        ${options ? `<div class="hub-options">${options}</div>` : ""}
        <div class="hub-start">
          ${need > 0
            ? `<button class="btn big" disabled>Need ${need} more player${need > 1 ? "s" : ""}</button>`
            : `<button class="btn big teal" onclick="startGame()">Start game</button>`}
        </div>
      </div>
    </div>`;
}

/* A little looping animated preview of each game, shown on its hub setup page.
 * Pure CSS animations (see .demo-* in style.css) — no JS ticking required. */
function demoHTML(id) {
  switch (id) {
    case "wordWaterfall":
      return `<div class="demo-stage"><div class="dw-row">
        ${["S", "T", "A", "R"].map((c, i) => `<span class="dw-tile" style="--i:${i}">${c}</span>`).join("")}
        <span class="dw-tile dim">E</span></div></div>`;
    case "triviaRush":
      return `<div class="demo-stage demo-col">
        <div class="dt-bar"><span></span></div>
        <div class="dt-opts"><span class="dt-opt">A</span><span class="dt-opt correct">B</span><span class="dt-opt">C</span><span class="dt-opt">D</span></div></div>`;
    case "liarLiar":
      return `<div class="demo-stage"><div class="dl-cards">
        <span class="dl-card">?</span><span class="dl-card truth">${icon("check")}</span><span class="dl-card">?</span></div></div>`;
    case "promptParty":
      return `<div class="demo-stage demo-col">
        <div class="dp-prompt">“Worst superpower ever?”</div>
        <div class="dp-answers"><span class="dp-ans">Invisible socks</span><span class="dp-ans win">Smell WiFi<b class="dp-crown">${icon("trophy")}</b></span></div></div>`;
    case "reflexRush":
      return `<div class="demo-stage"><div class="dq-panel">
        <span class="dq-wait">WAIT…</span><span class="dq-go">TAP!</span><span class="dq-ripple"></span></div></div>`;
    case "herdMentality":
      return `<div class="demo-stage"><div class="dh-cols">
        <div class="dh-col win"><span class="dh-word">PIZZA</span><div class="dh-dots"><i></i><i></i><i></i></div></div>
        <div class="dh-col"><span class="dh-word">TACO</span><div class="dh-dots second"><i></i></div></div></div></div>`;
    case "doodleDash":
      return `<div class="demo-stage"><svg class="dd-svg" viewBox="0 0 100 100">
        <path class="dd-path" pathLength="1" d="M50 14 L61 38 L88 40 L67 58 L74 85 L50 70 L26 85 L33 58 L12 40 L39 38 Z"/></svg></div>`;
    default:
      return "";
  }
}

/* ---------------- GAME ROUTER ---------------- */
function renderGame() {
  const key = stateKey();
  if (key === lastKey) { patchTimer(); return; } // only the clock changed
  lastKey = key;

  const g = state.game || {};
  const sig = `${state.gameId}|${g.screen}|${g.qNum || g.round || ""}`;
  const changed = screenChanged(sig);
  // Word Hunt's reveal beat animates the missed words in itself — don't also
  // re-deal the whole board, so the bank stays put while blanks fill.
  const suppressEnter = state.gameId === "wordWaterfall" && (g.screen === "reveal" || g.screen === "timesup");
  const enter = changed && !suppressEnter ? " enter" : "";
  const gic = window.GAME_ICONS[state.gameId] || "grid";
  const gcolor = window.GAME_COLORS[state.gameId] || "var(--cyan)";
  const header = `
    <div class="host-top">
      <div class="host-title"><span style="color:${gcolor}">${icon(gic)}</span> ${esc(state.gameName)}</div>
      <button class="btn ghost" onclick="endGame()">End game</button>
    </div>`;

  let body = "";
  // Shared "get ready" and "time's up" beats — same for every game. Word Hunt keeps
  // its richer times-up (it freezes the board behind the banner), so skip it here.
  if (g.screen === "countin") {
    body = viewCountin(g);
  } else if (g.screen === "timesup" && state.gameId !== "wordWaterfall") {
    body = viewTimesup(g);
  } else {
    switch (state.gameId) {
      case "wordWaterfall": body = viewWord(g); break;
      case "triviaRush": body = viewTrivia(g); break;
      case "liarLiar": body = viewLiar(g); break;
      case "promptParty": body = viewPrompt(g); break;
      case "reflexRush": body = viewReflex(g); break;
      case "herdMentality": body = viewHerd(g); break;
      case "doodleDash": body = viewDoodle(g); break;
      case "imposter": body = viewImposter(g); break;
      case "crazyEights": body = viewCrazyEights(g); break;
      default: body = `<div class="center"><h2>Loading…</h2></div>`;
    }
  }
  const beforeTiles = captureTiles(".pool .tile"); // for the shuffle FLIP
  app.innerHTML = `<div class="host-shell">${header}<div class="host-main${enter}">${body}</div></div>${joinBadge()}`;
  playFlip(".pool .tile", beforeTiles);
  if (state.gameId === "crazyEights" && g.screen === "play") ceHostFly(g);

  // Re-attach the doodle canvas and redraw from the stored strokes.
  if (state.gameId === "doodleDash" && g.screen === "draw") {
    const cv = document.getElementById("doodle-canvas");
    if (cv) { window.Doodle.attach(cv); window.Doodle.redraw(g.drawing); }
  }
}

/* Compact join code + QR shown on every in-game screen so people can join anytime. */
function joinBadge() {
  const code = state.code || "";
  if (!code) return "";
  const qr = qrSVG(`${location.origin}/play?code=${code}`);
  return `<div class="join-badge">
    ${qr ? `<div class="jb-qr">${qr}</div>` : ""}
    <div class="jb-text">
      <div class="jb-label">${esc(location.host)}/play</div>
      <div class="jb-code">${esc(code)}</div>
    </div>
  </div>`;
}

function timerRing(t) {
  return `<div class="timer-ring ${t <= 5 ? "low" : ""}">${t}</div>`;
}

function leaderboardHTML(lb, title = "Leaderboard") {
  if (!lb) return "";
  return `<h2>${title}</h2><div class="leaderboard">${lb.map((p, i) => `
    <div class="lb-row ${i === 0 ? "first" : ""}">
      <span class="rank">${rankBadge(i)}</span>
      <span class="avatar-dot" style="background:${p.color}"></span>
      <span>${esc(p.name)}</span>
      <span class="score">${p.score}</span>
    </div>`).join("")}</div>`;
}

/* Winner headline that respects ties: sole leader -> "X wins!", shared top ->
 * a tie/draw message, nobody scored -> "Nobody scored!". `entries` must be
 * sorted highest-first; `key` is the score field ("score" or "total"). */
function winnerHeadline(entries, key = "score") {
  if (!entries || !entries.length) return "Game over!";
  const top = entries[0][key] || 0;
  const leaders = entries.filter((e) => (e[key] || 0) === top);
  if (top === 0) return "Nobody scored!";
  if (leaders.length === 1) return esc(leaders[0].name) + " wins!";
  if (leaders.length === 2) return `It's a tie — ${esc(leaders[0].name)} &amp; ${esc(leaders[1].name)}!`;
  return `It's a ${leaders.length}-way tie!`;
}

function finalScreen(lb) {
  return `<div class="center" style="min-height:auto;gap:24px">
    <span style="color:var(--yellow)">${icon("trophy", "status-ic")}</span>
    <h1 style="font-size:3rem">${winnerHeadline(lb, "score")}</h1>
    ${leaderboardHTML(lb, "Final scores")}
    ${finalActions()}
  </div>`;
}

/* ---------------- IMPOSTER ---------------- */
function impNumbers(list, reveal) {
  return `<div class="imp-numbers">${list.map((n) => `
    <div class="imp-num ${reveal && n.isImposter ? "imp-is" : ""}">
      <span class="avatar-dot" style="background:${n.color}"></span>
      <span class="imp-name">${esc(n.name)}${reveal && n.isImposter ? " 🕵️" : ""}</span>
      <span class="imp-val">${n.number != null ? n.number : "—"}</span>
      ${reveal ? `<span class="imp-votes">${n.votes ? `${n.votes} vote${n.votes > 1 ? "s" : ""}` : ""}</span>` : ""}
    </div>`).join("")}</div>`;
}
function viewImposter(g) {
  if (g.screen === "final") return finalScreen(g.leaderboard);
  const head = `<div style="display:flex;align-items:center;gap:20px">
    <span class="pill">Round ${g.round}/${g.total}</span>
    ${(g.screen === "answer" || g.screen === "vote") ? timerRing(g.timeLeft) : `<span class="pill" style="color:var(--red)">${icon("mask")}</span>`}
    ${g.screen === "answer" ? `<span class="pill">${g.answered}/${g.players} answered</span>` : ""}
    ${g.screen === "vote" ? `<span class="pill">${g.voted}/${g.players} voted</span>` : ""}
  </div>`;
  if (g.screen === "answer") {
    return `${head}
      <span style="color:var(--red)">${icon("mask", "status-ic")}</span>
      <div class="big-prompt" style="font-size:2rem">Everyone's answering a secret question…</div>
      <p class="muted">One of you is the Imposter — they only see a number range. Answer on your phone!</p>`;
  }
  if (g.screen === "vote") {
    return `${head}
      <div class="big-prompt">Who's the Imposter?</div>
      ${impNumbers(g.numbers, false)}
      <p class="muted">Talk it out — then vote on your phones for who's faking it.</p>`;
  }
  if (g.screen === "imposterGuess") {
    return `<div class="center" style="gap:18px">
      <span style="color:var(--red)">${icon("mask", "status-ic")}</span>
      <h2>${esc(g.imposterName)} is guessing the secret question…</h2>
      <p class="muted">Can the Imposter figure out what everyone was answering?</p></div>`;
  }
  const r = g.result;
  return `<div class="center" style="min-height:auto;gap:14px">
    <span style="color:var(--red)">${icon("mask", "status-ic")}</span>
    <h1 style="font-size:2.2rem">The Imposter was ${esc(r.imposterName)}!</h1>
    <p class="muted">The question was: <b>${esc(r.question)}</b></p>
    ${impNumbers(r.numbers, true)}
    <div class="pill" style="font-size:1.15rem">${r.caught
      ? `Caught! ${r.caughtCount}/${r.insiderCount} spotted the imposter`
      : `The Imposter escaped! Fooled ${r.fooled}/${r.insiderCount}`}${r.guessedRight ? " · guessed the question! +250" : ""}</div>
    ${leaderboardHTML(g.leaderboard, "Scores")}
  </div>`;
}

/* ---------------- CRAZY EIGHTS ---------------- */
function suitColor(s) { return (s === "♥" || s === "♦") ? "var(--red)" : "var(--ink)"; }
function viewCrazyEights(g) {
  if (g.screen === "final") {
    const w = g.standings && g.standings[0];
    return `<div class="center" style="min-height:auto;gap:22px">
      <span style="color:var(--purple)">${icon("cards", "status-ic")}</span>
      <h1 style="font-size:2.6rem">${w ? esc(w.name) + " wins!" : "Game over!"}</h1>
      ${leaderboardHTML(g.leaderboard, "Final scores")}
      ${finalActions()}
    </div>`;
  }
  const pop = g.lastAction && g.lastAction.type === "play" ? " ce-pop" : "";
  const under = (n) => Array.from({ length: Math.min(3, Math.max(0, n)) }, (_, i) => `<div class="ce-under u${i + 1}"></div>`).join("");
  return `
    <div class="ce-turnbar"><span class="pill" style="border:2px solid ${g.turnColor};color:${g.turnColor}">${esc(g.turnName)}'s turn</span>${timerRing(g.timeLeft)}</div>
    <div class="ce-center">
      <div class="ce-pile"><div class="ce-label">Deck</div><div class="ce-stack">${under(g.pool - 1)}${g.pool > 0 ? cardBack("big") : `<div class="ce-empty"></div>`}</div><span class="ce-count">${g.pool}</span></div>
      <div class="ce-pile"><div class="ce-label">Pile</div><div class="ce-stack">${under((g.discardCount || 1) - 1)}${cardFace(g.top, "big" + pop)}</div><div class="ce-suit" style="color:${suitColor(g.suit)}">Suit ${g.suit}</div></div>
    </div>
    <div class="ce-players">
      ${g.players.map((p) => `
        <div class="ce-seat ${p.isTurn ? "on" : ""} ${p.cards === 0 ? "out" : ""}" data-pid="${p.id}">
          <div class="ce-fan">${Array.from({ length: Math.min(p.cards, 6) }).map(() => cardBack("mini")).join("")}</div>
          <div class="ce-seatname"><span class="avatar-dot" style="background:${p.color}"></span>${esc(p.name)} <b>${p.cards}</b></div>
        </div>`).join("")}
    </div>
    ${g.log && g.log.length ? `<div class="ce-log">${g.log.map((l) => `<div>${esc(l.text)}</div>`).join("")}</div>` : ""}`;
}

/* Fly a card between a player's seat and the pile on the big screen when a move
 * lands. Deduped by move signature so the 1s clock re-renders don't replay it. */
let ceFlySig = null;
function ceHostFly(g) {
  const la = g.lastAction;
  if (!la || (la.type !== "play" && la.type !== "draw") || !la.pid) return;
  const sig = `${la.type}:${la.pid}:${la.card ? la.card.id : g.pool}`;
  if (sig === ceFlySig) return;
  ceFlySig = sig;
  const seat = document.querySelector(`.ce-seat[data-pid="${la.pid}"]`);
  const piles = document.querySelectorAll(".ce-pile .ce-stack");
  const deckEl = piles[0], pileEl = piles[1];
  if (!seat || !deckEl || !pileEl) return;
  const fan = seat.querySelector(".ce-fan") || seat;

  if (la.type === "play" && la.card) {
    // Card leaves the player's hand (their fan) and grows onto the discard pile.
    fly(fan, pileEl, faceHTML(la.card), la.card.suit === "♥" || la.card.suit === "♦" ? "red" : "black", "play");
  } else if (la.type === "draw") {
    // A card back slides off the deck and shrinks into the player's hand.
    fly(deckEl, fan, `<span class="pc-back-mark">♣</span>`, "back", "draw");
  }

  function faceHTML(c) { return `<span class="pc-rank">${c.rank}</span><span class="pc-suit">${c.suit}</span>`; }
  function fly(fromEl, toEl, inner, cls, kind) {
    const play = kind === "play";
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const w = pileEl.getBoundingClientRect().width, h = pileEl.getBoundingClientRect().height;
    const clone = document.createElement("div");
    clone.className = `pcard big ${cls}`;
    clone.innerHTML = inner;
    const cx = (r) => r.left + r.width / 2 - w / 2, cy = (r) => r.top + r.height / 2 - h / 2;
    // Start scaled to hand-size at the source; grow (play) or shrink (draw) to the target.
    const from = play ? 0.42 : 1, to = play ? 1 : 0.34;
    clone.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;margin:0;z-index:900;pointer-events:none;box-shadow:0 16px 36px rgba(0,0,0,.6);transform:translate(${cx(a)}px,${cy(a)}px) scale(${from}) rotate(${play ? -16 : 6}deg);opacity:1;transition:transform .46s cubic-bezier(.34,.8,.3,1),opacity .3s ease;`;
    document.body.appendChild(clone);
    requestAnimationFrame(() => {
      clone.style.transform = `translate(${cx(b)}px,${cy(b)}px) scale(${to}) rotate(${play ? 3 : -4}deg)`;
    });
    if (play) {
      // Land solid — the real pile card (identical) is underneath, so just remove.
      setTimeout(() => clone.remove(), 500);
    } else {
      setTimeout(() => { clone.style.opacity = "0"; }, 330);
      setTimeout(() => clone.remove(), 520);
    }
  }
}

/* ---------------- WORD HUNT ---------------- */
function letterTile(t, values) {
  if (t.mystery) return `<div class="tile mystery" data-id="${t.id}">?</div>`;
  const ch = t.ch;
  const v = values && values[ch] != null ? `<span class="tv">${values[ch]}</span>` : "";
  return `<div class="tile" data-id="${t.id}">${esc(ch)}${v}</div>`;
}

/* Shared count-in and time's-up beats, used by every game (Word Hunt has its own
 * richer time's-up that keeps the board on screen). */
function viewCountin(g) {
  return `<div class="center" style="min-height:auto;gap:24px">
    ${g.roundLabel ? `<div class="pill">${esc(g.roundLabel)}</div>` : ""}
    <div class="countin-num ${g.count === "GO" ? "go" : ""}">${g.count === "GO" ? "GO!" : g.count}</div>
  </div>`;
}
function viewTimesup(g) {
  return `<div class="center" style="min-height:auto;gap:16px">
    <span class="timesup-banner" style="color:var(--red)">${esc(g.label || "TIME'S UP!")}</span>
  </div>`;
}

function viewWord(g) {
  if (g.screen === "countin") return `<div class="center" style="min-height:auto;gap:24px">
    <div class="pill">${esc(g.roundLabel)}</div>
    <div class="countin-num ${g.count === "GO" ? "go" : ""}">${g.count === "GO" ? "GO!" : g.count}</div>
  </div>`;
  if (g.screen === "timesup") return viewWordTimesup(g);
  if (g.screen === "reveal") return viewWordReveal(g);
  if (g.screen === "roundresults") return viewWordRoundResults(g);
  if (g.screen === "final") return viewWordFinal(g);
  return `
    <div style="display:flex;align-items:center;gap:20px">
      <span class="pill">${esc(g.roundLabel)}</span>
      ${timerRing(g.timeLeft)}
      <span class="pill">${g.cleared}/${g.total} found</span>
      ${g.goal != null ? `<span class="pill" style="color:${g.progress >= g.goal ? "var(--green)" : "var(--yellow)"}">Goal: ${g.progress}/${g.goal}</span>` : ""}
    </div>
    <div class="pool">${(g.pool || []).map((c) => letterTile(c, g.values)).join("")}</div>
    <div class="words-list">
      ${(g.words || []).map((w) => `
        <div class="word-row">
          <div class="slots">
            ${(w.text ? w.text.split("") : Array.from({ length: w.length })).map((ch) =>
              `<div class="slot ${w.text ? "filled" : ""}">${w.text ? esc(ch) : ""}</div>`).join("")}
          </div>
          <div class="word-by" ${w.color ? `style="color:${w.color}"` : ""}>${w.by ? `${esc(w.by)} · +${w.value}` : ""}</div>
        </div>`).join("")}
    </div>`;
}

const RF_LEAD = 0.2; // lead-in before the first missed letter
const RF_INTERVAL = 0.13; // seconds between each missed letter, one continuous cascade

/* Frozen board with a "TIME'S UP!" banner — found words filled, missed still blank. */
function viewWordTimesup(g) {
  return `
    <div style="display:flex;align-items:center;gap:20px">
      <span class="pill">${esc(g.roundLabel)}</span>
      <span class="timesup-banner" style="color:${g.allFound ? "var(--cyan)" : "var(--red)"}">${g.allFound ? "ALL WORDS FOUND!" : "TIME'S UP!"}</span>
    </div>
    <div class="pool">${(g.pool || []).map((c) => letterTile(c, g.values)).join("")}</div>
    <div class="words-list">
      ${(g.words || []).map((w) => `
        <div class="word-row">
          <div class="slots">
            ${(w.text ? w.text.split("") : Array.from({ length: w.length })).map((ch) =>
              `<div class="slot ${w.text ? "filled" : ""}">${w.text ? esc(ch) : ""}</div>`).join("")}
          </div>
          <div class="word-by" ${w.color ? `style="color:${w.color}"` : ""}>${w.by ? `${esc(w.by)} · +${w.value}` : ""}</div>
        </div>`).join("")}
    </div>`;
}

/* Reveal beat: only the MISSED words fill in (found ones stay as they were),
 * one continuous cascade top-left → bottom-right through the missed letters. */
function viewWordReveal(g) {
  let idx = 0;
  const rows = (g.words || []).map((w) => {
    if (w.found) {
      const slots = w.text.split("").map((ch) => `<div class="slot filled">${esc(ch)}</div>`).join("");
      return `<div class="word-row"><div class="slots">${slots}</div><div class="word-by" style="color:${w.color}">${esc(w.by)} · +${w.value}</div></div>`;
    }
    const slots = w.text.split("").map((ch) => {
      const d = (RF_LEAD + idx * RF_INTERVAL).toFixed(2);
      idx++;
      return `<div class="slot missed"><span class="rf" style="animation-delay:${d}s">${esc(ch)}</span></div>`;
    }).join("");
    const byDelay = (RF_LEAD + (idx - 1) * RF_INTERVAL + 0.2).toFixed(2);
    return `<div class="word-row"><div class="slots">${slots}</div><div class="word-by wr-by-fade" style="color:var(--red);animation-delay:${byDelay}s">missed</div></div>`;
  }).join("");

  return `
    <div style="display:flex;align-items:center;gap:20px">
      <span class="pill">${esc(g.roundLabel)}</span>
      <span class="pill" style="color:var(--yellow)">The words were…</span>
    </div>
    <div class="pool">${(g.pool || []).map((c) => letterTile(c, g.values)).join("")}</div>
    <div class="words-list">${rows}</div>`;
}

function viewWordRoundResults(g) {
  const found = g.words.filter((w) => w.found);
  const missed = g.words.filter((w) => !w.found);
  const lr = g.lastRound || {};
  let banner = "";
  if (g.format === "goal") {
    banner = lr.goalMet
      ? `<span class="pill" style="color:var(--cyan)">Goal reached (${lr.collective}/${lr.goal}) — next round!</span>`
      : `<span class="pill" style="color:var(--red)">Goal missed (${lr.collective}/${lr.goal})</span>`;
  }
  return `
    <h1>${esc(g.roundLabel)} — ${g.allFound ? "all found!" : "time's up"}</h1>
    ${banner}
    <div class="wr-layout">
      <div class="words-list wr-board">
        <div class="wr-head">The words · ${found.length} found · ${missed.length} missed</div>
        ${g.words.map((w) => `
          <div class="word-row">
            <div class="slots">
              ${w.text.split("").map((ch) => `<div class="slot ${w.found ? "filled" : "missed"}">${esc(ch)}</div>`).join("")}
            </div>
            <div class="word-by" style="color:${w.found ? w.color : "var(--red)"}">${w.found ? `${esc(w.by)} · +${w.value}` : `missed · +${w.value}`}</div>
          </div>`).join("")}
      </div>
      <div class="wr-scores">
        <div class="wr-head">Leaderboard</div>
        <div class="score-table">
          <div class="score-row score-head"><span class="st-rank"></span><span class="st-name">Player</span><span class="st-round">Round</span><span class="st-total">Total</span></div>
          ${g.scores.map((s, i) => `
            <div class="score-row ${i === 0 ? "first" : ""}">
              <span class="st-rank">${rankBadge(i)}</span>
              <span class="st-name"><span class="avatar-dot" style="background:${s.color}"></span>${esc(s.name)}</span>
              <span class="st-round">+${s.round}</span>
              <span class="st-total">${s.total}</span>
            </div>`).join("")}
        </div>
      </div>
    </div>
    ${!g.willContinue ? `<p class="muted">Final standings coming up…</p>`
      : g.countdownType === "all"
        ? `<div class="countdown-big" data-cd>${g.countdown}</div><div class="pill" style="color:var(--green)">Everyone's ready — here we go!</div>`
        : `<div class="pill" style="font-size:1.3rem;color:var(--cyan)">Next round in <span data-cd>${g.countdown}</span>s · ${g.readyCount}/${g.players} ready · ready up to skip</div>`}`;
}

function viewWordFinal(g) {
  return `<div class="center" style="min-height:auto;gap:22px">
    <span style="color:var(--yellow)">${icon("trophy", "status-ic")}</span>
    <h1 style="font-size:2.6rem">${winnerHeadline(g.standings, "total")}</h1>
    <p class="muted">${g.roundsPlayed} round${g.roundsPlayed === 1 ? "" : "s"} played</p>
    <div class="score-table">
      <div class="score-row score-head"><span class="st-rank"></span><span class="st-name">Player</span><span class="st-total">Total</span></div>
      ${g.standings.map((s, i) => `
        <div class="score-row two ${i === 0 ? "first" : ""}">
          <span class="st-rank">${rankBadge(i)}</span>
          <span class="st-name"><span class="avatar-dot" style="background:${s.color}"></span>${esc(s.name)}</span>
          <span class="st-total">${s.total}</span>
        </div>`).join("")}
    </div>
    ${finalActions()}
  </div>`;
}

/* ---------------- TRIVIA ---------------- */
function viewTrivia(g) {
  if (g.screen === "final") return finalScreen(g.leaderboard);
  const optClasses = (i) => {
    let c = `opt o${i}`;
    if (g.correctIndex != null) {
      if (i === g.correctIndex) c += " correct";
      else c += " dim";
    }
    return c;
  };
  const silhouette = g.silhouette != null ? `
    <div class="silhouette-wrap">
      <img class="silhouette-img${g.screen === "reveal" ? " revealed" : ""}"
        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${g.silhouette}.png" alt="" />
      ${g.answerName ? `<div class="silhouette-name">It's ${esc(g.answerName)}!</div>` : ""}
    </div>` : "";
  return `
    <div style="display:flex;align-items:center;gap:20px">
      <span class="pill">Question ${g.qNum}/${g.total}</span>
      ${g.screen === "question" ? timerRing(g.timeLeft) : `<span class="pill">Answer!</span>`}
      ${g.screen === "question" ? `<span class="pill">${g.answered}/${g.players} answered</span>` : ""}
    </div>
    <div class="big-prompt">${esc(g.question)}</div>
    ${silhouette}
    <div class="opt-grid">
      ${g.options.map((o, i) => `<div class="${optClasses(i)}">
        ${icon(["tri", "diamond", "circle", "square"][i])} ${esc(o)}
        ${g.counts ? `<span class="count">${g.counts[i]}</span>` : ""}
      </div>`).join("")}
    </div>
    ${g.leaderboard ? leaderboardHTML(g.leaderboard) : ""}`;
}

/* ---------------- LIAR LIAR ---------------- */
function viewLiar(g) {
  if (g.screen === "final") return finalScreen(g.leaderboard);
  let body = `<div style="display:flex;align-items:center;gap:20px">
      <span class="pill">Round ${g.round}/${g.total}</span>${timerRing(g.timeLeft)}${g.doubleRound ? `<span class="pill" style="color:var(--yellow)">★ DOUBLE POINTS</span>` : ""}</div>
    <div class="big-prompt">${esc(g.prompt)}</div>`;

  if (g.screen === "write") {
    body += `<p class="muted" style="font-size:1.4rem">Writing sneaky lies… ${g.submitted}/${g.players} in</p>`;
  } else if (g.screen === "choose") {
    body += `<p class="muted">Which one is the TRUTH? ${g.picked}/${g.players} chosen</p>
      <div class="reveal-list">${g.options.map((o) =>
        `<div class="reveal-item"><b>${esc(o.text)}</b></div>`).join("")}</div>`;
  } else if (g.screen === "reveal") {
    body += `<div class="reveal-list">${g.results.map((r) => `
      <div class="reveal-item ${r.truth ? "truth" : ""}">
        ${r.truth ? `<span style="color:var(--cyan)">${icon("check")}</span>` : ""}
        <b>${esc(r.text)}</b>
        <span class="muted" style="margin-left:8px">${r.truth ? "TRUTH" : "by " + esc(r.authors.join(", "))}</span>
        <span class="votes">${r.pickedBy.length ? "picked by " + esc(r.pickedBy.join(", ")) : ""}</span>
      </div>`).join("")}</div>
      ${leaderboardHTML(g.leaderboard)}`;
  }
  return body;
}

/* ---------------- PROMPT PARTY ---------------- */
function viewPrompt(g) {
  if (g.screen === "final") return finalScreen(g.leaderboard);
  let body = `<div style="display:flex;align-items:center;gap:20px">
      <span class="pill">Round ${g.round}/${g.total}</span>${timerRing(g.timeLeft)}${g.mode === "classic" ? `<span class="pill">Classic</span>` : ""}</div>
    <div class="big-prompt">${esc(g.prompt)}</div>`;

  if (g.screen === "answer") {
    body += `<p class="muted" style="font-size:1.4rem">${g.mode === "classic" ? "Playing cards" : "Thinking of answers"}… ${g.submitted}/${g.players} in</p>`;
  } else if (g.screen === "vote") {
    body += `<p class="muted">Vote for your favorite! ${g.voted}/${g.players} voted</p>
      <div class="reveal-list">${g.answers.map((a) =>
        `<div class="reveal-item"><b>${esc(a.text)}</b></div>`).join("")}</div>`;
  } else if (g.screen === "reveal") {
    body += `<div class="reveal-list">${g.results.map((r, i) => `
      <div class="reveal-item ${i === 0 && r.votes > 0 ? "truth" : ""}">
        <span class="avatar-dot" style="background:${r.color}"></span>
        <b>${esc(r.text)}</b>
        <span class="muted" style="margin-left:6px">— ${esc(r.name)}</span>
        <span class="votes">${r.votes} ${r.votes === 1 ? "vote" : "votes"}</span>
      </div>`).join("")}</div>
      ${leaderboardHTML(g.leaderboard)}`;
  }
  return body;
}

/* ---------------- DOODLE DASH ---------------- */
function viewDoodle(g) {
  if (g.screen === "final") return finalScreen(g.leaderboard);
  if (g.screen === "result") {
    return `<div class="center" style="min-height:auto;gap:16px">
      <h1>The word was “${esc(g.result.word)}”!</h1>
      <p class="muted">${esc(g.result.drawerName)} was drawing</p>
      <div class="reveal-list">
        ${g.result.guessed.map((x) => `<div class="reveal-item ${x.got ? "truth" : ""}">
          <span class="avatar-dot" style="background:${x.color}"></span><b>${esc(x.name)}</b>
          <span class="votes">${x.got ? `got it · +${x.points}` : "missed"}</span></div>`).join("") || `<div class="muted">Nobody guessed it!</div>`}
      </div>
      ${leaderboardHTML(g.leaderboard)}
    </div>`;
  }
  const blanks = (g.wordLen || []).map((len) => "_".repeat(len).split("").join(" ")).join("      ");
  return `
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center">
      <span class="pill">Round ${g.round}/${g.total}</span>
      <span class="pill"><span class="avatar-dot" style="width:16px;height:16px;background:${g.drawerColor};display:inline-block;vertical-align:-2px"></span> ${esc(g.drawerName)} is drawing</span>
      ${timerRing(g.timeLeft)}
      <span class="pill">${g.gotCount}/${g.guesserCount} guessed</span>
    </div>
    <canvas id="doodle-canvas" class="doodle-canvas" width="720" height="720"></canvas>
    <div class="word-blanks">${esc(blanks)}</div>
    <div class="player-strip">${(g.guessed || []).filter((x) => x.got).map((x) =>
      `<div class="avatar-chip"><span class="avatar-dot" style="background:${x.color}"></span>${esc(x.name)}</div>`).join("")}</div>`;
}

/* ---------------- HERD MENTALITY ---------------- */
function viewHerd(g) {
  if (g.screen === "final") return finalScreen(g.leaderboard);
  if (g.screen === "reveal") {
    const r = g.result || {};
    return `
      <div style="display:flex;align-items:center;gap:16px"><span class="pill">Question ${g.qNum}/${g.total}</span></div>
      <div class="big-prompt">${esc(g.question)}</div>
      ${r.noHerd ? `<div class="pill" style="color:var(--red)">No majority — nobody scores this round!</div>` : `<div class="pill" style="color:var(--green)">The herd scores +100!</div>`}
      <div class="reveal-list">
        ${(r.groups || []).map((grp) => `
          <div class="reveal-item ${grp.isHerd ? "truth" : ""}">
            <b style="font-size:1.3rem">${esc(grp.text)}</b>
            <span class="muted">×${grp.count}</span>
            <span class="votes" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              ${grp.members.map((m) => `<span class="avatar-chip" style="padding:4px 12px 4px 8px"><span class="avatar-dot" style="width:18px;height:18px;background:${m.color}"></span>${esc(m.name)}</span>`).join("")}
            </span>
          </div>`).join("")}
      </div>
      ${leaderboardHTML(g.leaderboard)}`;
  }
  return `
    <div style="display:flex;align-items:center;gap:20px">
      <span class="pill">Question ${g.qNum}/${g.total}</span>
      ${timerRing(g.timeLeft)}
      <span class="pill">${g.answered}/${g.players} answered</span>
    </div>
    <div class="big-prompt">${esc(g.question)}</div>
    <p class="muted" style="font-size:1.3rem">Match the majority to score!</p>`;
}

/* ---------------- REFLEX RUSH ---------------- */
const REFLEX_LABEL = { greenlight: "Green Light", target: "Tap the Color", math: "Quick Math" };

function viewReflex(g) {
  if (g.screen === "final") return finalScreen(g.leaderboard);

  let cls = "ready", text = "Get ready…";
  if (g.screen === "armed") { cls = "armed"; text = "Wait for it…"; }
  else if (g.screen === "result") { cls = "ready"; text = "Round results"; }
  else if (g.screen === "go") {
    if (g.type === "target") { cls = "prompt"; text = `TAP <span style="color:${g.targetCss}">${esc(g.target)}</span>!`; }
    else if (g.type === "math") { cls = "prompt"; text = `${esc(g.mathQ)} = ?`; }
    else { cls = "go"; text = "TAP NOW!"; }
  }

  let body = `<div style="display:flex;align-items:center;gap:16px">
      <span class="pill">Round ${g.round}/${g.total}</span><span class="pill">${REFLEX_LABEL[g.type] || ""}</span></div>
    <div class="reflex-panel ${cls}">${text}</div>`;

  if (g.screen === "result") {
    body += `<div class="reveal-list">${(g.results || []).map((r, i) => `
      <div class="reveal-item ${i === 0 ? "truth" : ""}">
        <span class="rank">${rankBadge(i)}</span>
        <span class="avatar-dot" style="background:${r.color}"></span>
        <b>${esc(r.name)}</b>
        <span class="votes">${r.ms} ms · +${r.points}</span>
      </div>`).join("")}
      ${(g.missed || []).length ? `<div class="reveal-item"><span class="muted">${esc(g.wrongLabel)}: ${esc(g.missed.join(", "))}</span></div>` : ""}
      </div>${leaderboardHTML(g.leaderboard)}`;
  }
  return body;
}
