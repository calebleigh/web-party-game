/* global io */
const socket = io();
const app = document.getElementById("app");
let pstate = null;
let lastPSig = null;
let pLobbyView = "main"; // "main" | "cards" — which lobby sub-view this phone shows
const PALETTE = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF7AC6", "#B983FF", "#FF9F45", "#42C2FF", "#F45B69", "#3DDC97"];
let me = {
  playerId: localStorage.getItem("pb_playerId") || null,
  code: localStorage.getItem("pb_code") || "",
  name: localStorage.getItem("pb_name") || "",
  color: localStorage.getItem("pb_color") || PALETTE[Math.floor(Math.random() * PALETTE.length)],
};
let joined = false;

/* Prefill code from ?code= (QR link) — overrides the remembered one */
const urlCode = new URLSearchParams(location.search).get("code");
if (urlCode) me.code = urlCode.toUpperCase();

socket.on("connect", () => {
  if (me.playerId && me.code && me.name) {
    socket.emit("player:join", { code: me.code, name: me.name, playerId: me.playerId });
  }
});

socket.on("player:joined", ({ playerId, code }) => {
  me.playerId = playerId; me.code = code; joined = true;
  localStorage.setItem("pb_playerId", playerId);
  localStorage.setItem("pb_name", me.name);
  localStorage.setItem("pb_code", code); // so a refresh can auto-rejoin
});

socket.on("player:error", ({ message }) => { toast(message); joined = false; renderJoin(); });
socket.on("player:state", (s) => { pstate = s; joined = true; render(); });
socket.on("doodle:wrong", () => { const el = document.getElementById("dguess"); if (el) { el.classList.remove("nope"); void el.offsetWidth; el.classList.add("nope"); } });

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function act(action) { socket.emit("player:action", action); }
window.act = act;

/* VIP / voting controls (lobby + hub) */
window.voteGame = (gameId) => socket.emit("player:vote", { gameId });
window.openHubVip = (gameId) => socket.emit("player:openHub", { gameId });
window.setOptVip = (key, val) => socket.emit("player:setConfig", { config: { [key]: val } });
window.toggleOptVip = (key, id) => {
  const cfg = pstate && pstate.hub && Array.isArray(pstate.hub.config[key]) ? pstate.hub.config[key].slice() : [];
  const i = cfg.indexOf(id);
  if (i >= 0) cfg.splice(i, 1); else cfg.push(id);
  socket.emit("player:setConfig", { config: { [key]: cfg } });
};
window.startGameVip = () => socket.emit("player:startGame");
window.backToLobbyVip = () => socket.emit("player:backToLobby");

/* ---------------- JOIN ---------------- */
function doJoin() {
  const code = document.getElementById("code").value.trim().toUpperCase();
  const name = document.getElementById("name").value.trim();
  if (!code) return toast("Enter the room code");
  if (!name) return toast("Enter your name");
  me.code = code; me.name = name;
  socket.emit("player:join", { code, name, color: me.color, playerId: me.playerId });
}
window.doJoin = doJoin;

function pickColor(c) {
  me.color = c;
  localStorage.setItem("pb_color", c);
  // Toggle selection in place so typed name/code aren't lost.
  document.querySelectorAll(".swatch").forEach((el) => el.classList.toggle("on", el.dataset.c === c));
}
window.pickColor = pickColor;

function renderJoin() {
  app.innerHTML = `
    <div class="center">
      <div class="logo cc-logo"><span class="cc-couch"><span class="cc-couch-frame">${couchFrame()}</span><span class="cc-couch-word">Couch</span></span><span class="cc-accent">Clash</span></div>
      <p class="muted" style="font-size:1.2rem">Enter the code on the big screen</p>
      <div class="card" style="width:100%;max-width:380px;display:flex;flex-direction:column;gap:16px">
        <input class="field" id="code" maxlength="4" placeholder="CODE" value="${esc(me.code)}"
          style="text-transform:uppercase;letter-spacing:0.2em;font-size:2rem" autocomplete="off" />
        <input class="field" id="name" maxlength="16" placeholder="Your name" value="${esc(me.name)}" autocomplete="off" />
        <div class="color-pick-label muted">Pick your color</div>
        <div class="color-pick">
          ${PALETTE.map((c) => `<button type="button" class="swatch ${me.color === c ? "on" : ""}" data-c="${c}" style="background:${c}" onclick="pickColor('${c}')"></button>`).join("")}
        </div>
        <button class="btn big pink" onclick="doJoin()">Let's play</button>
      </div>
    </div>`;
  const c = document.getElementById("code");
  if (c && !me.code) c.focus();
}

/* ---------------- ROUTER ---------------- */
function render() {
  if (!pstate) return renderJoin();
  if (pstate.phase !== "lobby") pLobbyView = "main";
  if (pstate.phase === "kicked") { app.innerHTML = notice("x", "You were removed from the game."); localStorage.removeItem("pb_playerId"); me.playerId = null; return; }
  if (pstate.phase === "closed") { app.innerHTML = notice("plug", "The host closed the game."); return; }
  if (!joined && !pstate.me) return renderJoin();

  const head = `
    <div class="player-head">
      <div class="who"><span class="avatar-dot" style="background:${pstate.me?.color}"></span>${esc(pstate.me?.name)}${pstate.isVip ? `<span class="vip-badge">VIP</span>` : ""}</div>
      <div class="pts">${icon("star")} ${pstate.me?.score ?? 0}</div>
    </div>`;

  // Deal-in only on a real screen change, never on incidental re-renders.
  const sig = pstate.phase === "lobby" ? "lobby"
    : pstate.phase === "waiting" ? "waiting"
    : pstate.phase === "hub" ? "hub:" + (pstate.hub && pstate.hub.gameId)
    : pstate.gameId === "doodleDash"
      ? `doodleDash|${pstate.game?.screen}|${pstate.game?.drawerName || ""}|${pstate.game?.isDrawer ? "d" : "g"}`
      : `${pstate.gameId}|${pstate.game?.screen}`;
  // The drawer's live canvas must survive incidental re-renders (e.g. a guesser
  // scoring triggers a sync). Skip the whole render while nothing structural changed.
  if (pstate.phase === "game" && pstate.gameId === "doodleDash" && pstate.game?.screen === "draw"
      && pstate.game?.isDrawer && sig === lastPSig && document.getElementById("draw-canvas")) return;
  const enter = sig !== lastPSig ? " enter" : "";
  lastPSig = sig;

  let body;
  if (pstate.phase === "lobby") {
    body = `<div class="player-body${enter}">${lobbyBody()}</div>`;
  } else if (pstate.phase === "waiting") {
    body = `<div class="player-body${enter}">
      <span style="color:var(--yellow)">${icon("clock", "status-ic")}</span>
      <h2>Hang tight!</h2>
      <p class="muted">${esc(pstate.gameName || "A game")} is in progress. You'll join automatically when it finishes.</p>
    </div>`;
  } else if (pstate.phase === "hub") {
    const hub = pstate.hub || {};
    body = `<div class="player-body${enter}">${pstate.isVip ? vipHubBody(hub) : nonVipHubBody(hub)}</div>`;
  } else {
    body = `<div class="player-body${enter}">${gameBody()}</div>`;
  }
  // Preserve whatever the player is typing/tapping across a re-render.
  const active = document.activeElement;
  const saved = active && active.classList && active.classList.contains("field")
    ? { id: active.id, value: active.value, start: active.selectionStart, end: active.selectionEnd }
    : null;
  // Snapshot ALL field values by id — so tapped letters survive even when the
  // input isn't focused (e.g. focus is on a letter tile during a shuffle).
  const fieldValues = {};
  document.querySelectorAll("input.field").forEach((el) => { if (el.id) fieldValues[el.id] = el.value; });

  const beforeTiles = captureTiles(".mini-pool .mini-tile"); // shuffle FLIP
  app.innerHTML = `<div class="player-shell">${head}${body}</div>`;
  wireInputs();
  playFlip(".mini-pool .mini-tile", beforeTiles);

  for (const [id, val] of Object.entries(fieldValues)) {
    const el = document.getElementById(id);
    if (el && val && el.value !== val) el.value = val;
  }
  if (saved) {
    const el = document.getElementById(saved.id);
    if (el) {
      el.value = saved.value;
      try { el.setSelectionRange(saved.start, saved.end); } catch (_) {}
      el.focus();
    }
  }
}

/* ---------------- LOBBY (vote / VIP pick) ---------------- */
function voteGameTile(g) {
  const votes = pstate.votes || {};
  const pc = pstate.playerCount || 0;
  const isVip = pstate.isVip;
  const locked = pc < g.minPlayers;
  const count = votes[g.id] || 0;
  const mine = pstate.myVote === g.id;
  const ic = window.GAME_ICONS[g.id] || "grid";
  const color = window.GAME_COLORS[g.id] || "var(--cyan)";
  return `<div class="vote-game ${mine ? "voted" : ""} ${locked ? "locked" : ""}">
    <button class="vg-main" ${locked ? "disabled" : `onclick="voteGame('${g.id}')"`}>
      <span class="vg-ic" style="color:${color}">${icon(ic)}</span>
      <span class="vg-name">${esc(g.name)}</span>
      ${locked ? `<span class="vg-lock">${g.minPlayers}+</span>` : count ? `<span class="vg-votes">${count}</span>` : ""}
    </button>
    ${isVip && !locked ? `<button class="vg-setup" onclick="openHubVip('${g.id}')">Set up ▸</button>` : ""}
  </div>`;
}
function voteList(games) {
  const cards = games.filter((g) => g.category === "cards");
  const main = games.filter((g) => g.category !== "cards");
  if (pLobbyView === "cards") {
    return `<button class="btn ghost" style="align-self:center;margin-bottom:6px" onclick="pLobbyBack()">← All games</button>
      <div class="vote-games">${cards.map(voteGameTile).join("")}</div>`;
  }
  return `<div class="vote-games">
    ${main.map(voteGameTile).join("")}
    ${cards.length ? `<div class="vote-game"><button class="vg-main" onclick="openCardHubP()">
      <span class="vg-ic" style="color:var(--purple)">${icon("cards")}</span>
      <span class="vg-name">Card Games ▸</span>
    </button></div>` : ""}
  </div>`;
}
function lobbyBody() {
  const games = pstate.games || [];
  const isVip = pstate.isVip;
  return `
    <h2>${pLobbyView === "cards" ? "Card Games" : isVip ? "You're the VIP!" : "Vote for a game"}</h2>
    <p class="muted">${pLobbyView === "cards"
      ? "Pick a card game."
      : isVip
        ? "Pick a game to set up — the votes are just below."
        : `Tap to vote. ${pstate.vipName ? esc(pstate.vipName) : "The VIP"} decides.`}</p>
    ${voteList(games)}`;
}
window.openCardHubP = () => { pLobbyView = "cards"; render(); };
window.pLobbyBack = () => { pLobbyView = "main"; render(); };

function vipHubBody(hub) {
  const options = (hub.options || []).map((opt) => `
    <div class="hub-opt">
      <div class="hub-opt-label">${esc(opt.label)}${opt.type === "multi" ? " (optional)" : ""}</div>
      <div class="hub-choices">
        ${(() => {
          let lastGroup = null;
          return opt.choices.map((c) => {
            const on = opt.type === "multi"
              ? Array.isArray(hub.config[opt.key]) && hub.config[opt.key].includes(c.id)
              : hub.config[opt.key] === c.id;
            const handler = opt.type === "multi" ? `toggleOptVip('${opt.key}','${c.id}')` : `setOptVip('${opt.key}','${c.id}')`;
            let header = "";
            if (c.group && c.group !== lastGroup) { header = `<div class="hub-group">${esc(c.group)}</div>`; lastGroup = c.group; }
            return `${header}<button class="hub-choice ${on ? "on" : ""}" onclick="${handler}">
              <span class="hc-label">${esc(c.label)}</span>${c.hint ? `<span class="hc-hint">${esc(c.hint)}</span>` : ""}
            </button>`;
          }).join("");
        })()}
      </div>
    </div>`).join("");
  return `
    <h2>${esc(hub.name)}</h2>
    <p class="muted">You're the VIP — set the rules, then start.</p>
    ${options ? `<div class="vip-options">${options}</div>` : `<p class="muted">No options — just hit start!</p>`}
    <div class="vip-hub-controls">
      <button class="btn ghost" onclick="backToLobbyVip()">← Back</button>
      ${hub.canStart
        ? `<button class="btn big teal" onclick="startGameVip()">Start</button>`
        : `<button class="btn big" disabled>Need more players</button>`}
    </div>`;
}

function nonVipHubBody(hub) {
  return `<span style="color:var(--cyan)">${icon("power", "status-ic")}</span>
    <h2>${esc(hub.name || "Get ready")}</h2>
    <p class="muted">${pstate.vipName ? esc(pstate.vipName) : "The VIP"} is setting up the game…</p>
    ${(hub.howTo || []).length ? `<ol class="howto phone">${hub.howTo.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}`;
}

function notice(iconName, text) {
  return `<div class="center"><span style="color:var(--magenta)">${icon(iconName, "status-ic")}</span><h2>${esc(text)}</h2>
    <button class="btn pink" onclick="location.reload()">Rejoin</button></div>`;
}

function waiting(text = "Nice! Waiting for others…") {
  return `<span style="color:var(--cyan)">${icon("check", "status-ic")}</span><h2 class="waiting-check">${esc(text)}</h2><p class="muted">Watch the big screen.</p>`;
}

function gameBody() {
  const g = pstate.game || {};
  // Shared count-in / time's-up beats — identical on every game. Word Hunt keeps
  // its own time's-up (it lists what you found), so let it handle that itself.
  if (g.screen === "countin") return pCountin(g);
  if (g.screen === "timesup" && pstate.gameId !== "wordWaterfall") return pTimesup(g);
  switch (pstate.gameId) {
    case "wordWaterfall": return pWord(g);
    case "triviaRush": return pTrivia(g);
    case "liarLiar": return pLiar(g);
    case "promptParty": return pPrompt(g);
    case "reflexRush": return pReflex(g);
    case "herdMentality": return pHerd(g);
    case "doodleDash": return pDoodle(g);
    case "imposter": return pImposter(g);
    case "crazyEights": return pCrazyEights(g);
    default: return `<h2>Loading…</h2>`;
  }
}

function pCountin(g) {
  return `<h2>Get ready!</h2><div class="countin-num ${g.count === "GO" ? "go" : ""}">${g.count === "GO" ? "GO!" : g.count}</div>`;
}
function pTimesup(g) {
  return `<span style="color:var(--red)">${icon("clock", "status-ic")}</span><h2>${esc(g.label || "Time's up!")}</h2><p class="muted">Watch the big screen.</p>`;
}

function finalP(g) {
  const badge = g.rank === 1
    ? `<span style="color:var(--yellow)">${icon("trophy", "status-ic")}</span>`
    : `<span class="rank-badge big-rank r${g.rank <= 3 ? g.rank : "n"}">${g.rank}</span>`;
  return `${badge}
    <h1>${g.rank === 1 ? (g.tied ? "You tied for 1st!" : "You won!") : `#${g.rank} of ${g.total}`}</h1>
    <p class="muted">Great game! Wait for the host to pick the next one.</p>`;
}

/* ---------------- WORD HUNT ---------------- */
function guessListHTML(guesses) {
  if (!guesses || !guesses.length) return "";
  return `<div class="guess-list">${guesses.map((gg) =>
    `<span class="guess-item ${gg.status}">${esc(gg.word)}${gg.status === "got" ? ` +${gg.value}` : ""}</span>`).join("")}</div>`;
}

function pWord(g) {
  if (g.screen === "countin") {
    return `<h2>Get ready!</h2><div class="countin-num ${g.count === "GO" ? "go" : ""}">${g.count === "GO" ? "GO!" : g.count}</div>`;
  }
  if (g.screen === "timesup") {
    const col = g.allFound ? "var(--cyan)" : "var(--red)";
    return `<span style="color:${col}">${icon(g.allFound ? "check" : "clock", "status-ic")}</span>
      <h1 style="text-transform:uppercase">${g.allFound ? "All found!" : "Time's up!"}</h1>`;
  }
  if (g.screen === "reveal") {
    return `<span style="color:var(--cyan)">${icon("check", "status-ic")}</span>
      <h2>The words are on the big screen…</h2>`;
  }
  if (g.screen === "final") {
    const badge = g.rank === 1
      ? `<span style="color:var(--yellow)">${icon("trophy", "status-ic")}</span>`
      : `<span class="rank-badge big-rank r${g.rank <= 3 ? g.rank : "n"}">${g.rank}</span>`;
    return `${badge}
      <h1>${g.rank === 1 ? (g.tied ? "You tied for 1st!" : "You won!") : `#${g.rank} of ${g.total}`}</h1>
      <p class="muted">Final total: <b>${g.myTotal}</b></p>`;
  }
  if (g.screen === "roundresults") {
    return `
      <span class="rank-badge big-rank r${g.rank <= 3 ? g.rank : "n"}">${g.rank}</span>
      <h2>Round over</h2>
      <div class="score-summary">
        <div><span class="ss-num">+${g.round}</span><span class="ss-lab">this round</span></div>
        <div><span class="ss-num">${g.total}</span><span class="ss-lab">total</span></div>
        <div><span class="ss-num">#${g.rank}</span><span class="ss-lab">of ${g.players}</span></div>
      </div>
      ${g.guesses && g.guesses.length ? `<p class="muted">Your words</p>${guessListHTML(g.guesses)}` : `<p class="muted">No words this round — get 'em next time!</p>`}
      ${!g.willContinue ? `<p class="muted">Final standings coming up…</p>`
        : `${g.countdown != null && g.countdownType === "all" ? `<div class="countdown-big">${g.countdown}</div>`
            : g.countdown != null ? `<p class="waiting-check">Next round in ${g.countdown}s</p>` : ""}
           ${g.amReady
             ? `<p class="waiting-check">Ready! (${g.readyCount}/${g.players})</p>`
             : `<button class="btn big teal" onclick="act({type:'ready'})">Ready</button>`}`}`;
  }
  // The phone keeps its OWN letter order (so the host's 10s shuffle doesn't
  // reorder tiles mid-tap). It reshuffles only when the player taps Shuffle.
  syncWordPool(g.pool);
  const tiles = (wordPool || []).map((t) => {
    if (t.mystery) return `<span class="mini-tile mystery" data-id="${t.id}">?</span>`;
    const v = g.values && g.values[t.ch] != null ? `<span class="tv">${g.values[t.ch]}</span>` : "";
    return `<button type="button" class="mini-tile tappable" data-id="${t.id}" onclick="tapLetter('${t.ch}')">${esc(t.ch)}${v}</button>`;
  }).join("");
  return `
    <div class="mini-pool">${tiles}</div>
    <button class="shuffle-btn" onclick="shuffleWordPool()">${icon("shuffle")} Shuffle</button>
    <input class="field" id="guess" placeholder="tap letters or type" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="16" />
    <div class="key-controls">
      <button class="btn ghost" onclick="backspaceGuess()">⌫</button>
      <button class="btn teal" onclick="sendGuess()">Submit</button>
    </div>
    <p class="muted">${g.cleared}/${g.total} found · rarer letters score more</p>
    ${guessListHTML(g.guesses)}`;
}

/* The phone's own letter ordering, independent of the host's shuffle. */
let wordPool = null, wordPoolSig = "";
function shuffleArr(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
function poolSig(tiles) { return (tiles || []).map((t) => t.id + t.ch + (t.mystery ? "?" : "")).sort().join("|"); }
function syncWordPool(tiles) {
  const sig = poolSig(tiles);
  if (sig !== wordPoolSig) { wordPool = (tiles || []).slice(); wordPoolSig = sig; } // new bank → adopt server order once
}
window.shuffleWordPool = () => { if (wordPool && wordPool.length) { wordPool = shuffleArr(wordPool); render(); } };
window.tapLetter = (ch) => {
  const el = document.getElementById("guess");
  if (el) { el.value = (el.value + ch).slice(0, 16); }
};
window.backspaceGuess = () => {
  const el = document.getElementById("guess");
  if (el) el.value = el.value.slice(0, -1);
};
window.sendGuess = () => {
  const el = document.getElementById("guess");
  if (el && el.value.trim()) { act({ type: "guess", text: el.value }); el.value = ""; }
};

/* ---------------- TRIVIA ---------------- */
function pTrivia(g) {
  if (g.screen === "final") return finalP(g);
  if (g.screen === "reveal") {
    const good = g.wasCorrect;
    const ic = good ? "target" : g.myChoice != null ? "x" : "clock";
    const col = good ? "var(--cyan)" : g.myChoice != null ? "var(--red)" : "var(--ink-soft)";
    return `<span style="color:${col}">${icon(ic, "status-ic")}</span>
      <h2>${good ? "Correct!" : g.myChoice != null ? "Not this time" : "Time's up"}</h2>
      <p class="muted">The answer was “${esc(g.options[g.correctIndex])}”.</p>`;
  }
  if (g.myChoice != null) return waiting("Locked in");
  return `<p class="player-prompt">Question ${g.qNum}/${g.total} — tap your answer!</p>
    <div class="answer-grid">
      ${g.options.map((o, i) => `<button class="tap-btn o${i}" onclick="act({type:'answer',choice:${i}})">${icon(["tri","diamond","circle","square"][i])} ${esc(o)}</button>`).join("")}
    </div>`;
}

/* ---------------- LIAR ---------------- */
function pLiar(g) {
  if (g.screen === "final") return finalP(g);
  const dbl = g.doubleRound ? `<p class="waiting-check" style="color:var(--yellow)">★ DOUBLE POINTS!</p>` : "";
  if (g.screen === "write") {
    if (g.submitted) return waiting("Lie submitted");
    return `${dbl}<p class="player-prompt">${esc(g.prompt)}</p>
      <p class="muted">Write a believable LIE to fool everyone!</p>
      <input class="field" id="lie" maxlength="40" placeholder="your fib" autocomplete="off" />
      <button class="btn big purple" onclick="sendLie()">Tell the lie</button>`;
  }
  if (g.screen === "choose") {
    if (g.isLiarOfTruth) return waiting("You wrote the truth! Sit this one out.");
    if (g.myPick) return waiting("Answer picked");
    return `<p class="player-prompt">Which one is the TRUTH?</p>
      <div class="vote-list">
        ${g.options.map((o) => `<button class="vote-item" onclick="act({type:'pick',optionId:'${o.id}'})">${esc(o.text)}</button>`).join("")}
      </div>`;
  }
  if (g.screen === "reveal") {
    const col = g.correct ? "var(--cyan)" : "var(--red)";
    return `<span style="color:${col}">${icon(g.correct ? "target" : "x", "status-ic")}</span>
      <h2>${g.correct ? "You found the truth!" : "Fooled!"}</h2>`;
  }
  return waiting();
}
window.sendLie = () => {
  const el = document.getElementById("lie");
  if (el && el.value.trim()) act({ type: "lie", text: el.value });
};

/* ---------------- PROMPT PARTY ---------------- */
function pPrompt(g) {
  if (g.screen === "final") return finalP(g);
  if (g.screen === "answer") {
    if (g.submitted) return waiting(g.mode === "classic" ? "Card played" : "Answer submitted");
    if (g.mode === "classic") {
      return `<p class="player-prompt">${esc(g.prompt)}</p>
        <p class="muted">Play your best card:</p>
        <div class="hand-list">
          ${(g.hand || []).map((c, i) => `<button class="hand-card" onclick="act({type:'play',card:${i}})">${esc(c)}</button>`).join("")}
        </div>`;
    }
    return `<p class="player-prompt">${esc(g.prompt)}</p>
      <input class="field" id="ans" maxlength="80" placeholder="your funniest answer" autocomplete="off" />
      <button class="btn big orange" onclick="sendAnswer()">Send it</button>`;
  }
  if (g.screen === "vote") {
    if (g.onlyMine) return waiting("You're the only answer — free points!");
    if (g.myVote) return waiting("Vote cast");
    return `<p class="player-prompt">${esc(g.prompt)}</p><p class="muted">Vote for your favorite!</p>
      <div class="vote-list">
        ${g.options.map((o) => `<button class="vote-item" onclick="act({type:'vote',target:'${o.target}'})">${esc(o.text)}</button>`).join("")}
      </div>`;
  }
  if (g.screen === "reveal") {
    const col = g.myVotes > 0 ? "var(--yellow)" : "var(--ink-soft)";
    return `<span style="color:${col}">${icon(g.myVotes > 0 ? "star" : "check", "status-ic")}</span>
      <h2>${g.myVotes > 0 ? `You got ${g.myVotes} vote${g.myVotes > 1 ? "s" : ""}!` : "Round done"}</h2>`;
  }
  return waiting();
}
window.sendAnswer = () => {
  const el = document.getElementById("ans");
  if (el && el.value.trim()) act({ type: "answer", text: el.value });
};

/* ---------------- HERD MENTALITY ---------------- */
function pHerd(g) {
  if (g.screen === "final") return finalP(g);
  if (g.screen === "reveal") {
    if (!g.answered) return `<span style="color:var(--ink-soft)">${icon("clock", "status-ic")}</span><h2>No answer</h2>`;
    const col = g.matched ? "var(--green)" : "var(--ink-soft)";
    return `<span style="color:${col}">${icon(g.matched ? "target" : "x", "status-ic")}</span>
      <h2>${g.matched ? "You matched the herd! +100" : "You went your own way…"}</h2>
      <p class="muted">You said “${esc(g.myAnswer || "")}”.</p>`;
  }
  if (g.submitted) return waiting("Answer in — think like the herd!");
  return `<p class="player-prompt">${esc(g.question)}</p>
    <p class="muted">Match the majority to score!</p>
    <input class="field" id="herd" maxlength="24" placeholder="your answer" autocomplete="off" />
    <button class="btn big pink" onclick="sendHerd()">Submit</button>`;
}
window.sendHerd = () => {
  const el = document.getElementById("herd");
  if (el && el.value.trim()) act({ type: "answer", text: el.value });
};

/* ---------------- IMPOSTER ---------------- */
function pImposter(g) {
  if (g.screen === "final") return finalP(g);
  if (g.screen === "answer") {
    if (g.submitted) return waiting(g.isImposter ? "Bluff submitted — act natural!" : "Number locked in");
    if (g.isImposter) {
      return `<span style="color:var(--red)">${icon("mask", "status-ic")}</span>
        <h2>You're the Imposter!</h2>
        <p class="muted">You can't see the question. Enter a number that blends in.</p>
        <p class="player-prompt">Believable range: <b>${esc(g.range)}</b></p>
        <input class="field" id="impnum" type="number" inputmode="numeric" placeholder="your number" autocomplete="off" />
        <button class="btn big pink" onclick="sendImpNumber()">Submit</button>`;
    }
    return `<p class="player-prompt">${esc(g.question)}</p>
      <p class="muted">Answer honestly — with a number.</p>
      <input class="field" id="impnum" type="number" inputmode="numeric" placeholder="your number" autocomplete="off" />
      <button class="btn big teal" onclick="sendImpNumber()">Submit</button>`;
  }
  if (g.screen === "vote") {
    if (g.myVote) return waiting("Vote cast — watch the big screen");
    return `<p class="player-prompt">Who's the Imposter?</p>
      <p class="muted">Your number was ${g.myNumber != null ? g.myNumber : "—"}. Vote for who's faking it.</p>
      <div class="vote-list">${g.options.map((o) => `<button class="vote-item" onclick="act({type:'vote',target:'${o.id}'})"><span class="avatar-dot" style="background:${o.color}"></span> ${esc(o.name)}</button>`).join("")}</div>`;
  }
  if (g.screen === "imposterGuess") {
    if (!g.isImposter) return waiting("The Imposter is guessing the question…");
    if (g.guessed) return waiting("Guess locked in");
    return `<span style="color:var(--red)">${icon("mask", "status-ic")}</span>
      <h2>Quick — what was the question?</h2>
      <p class="muted">Guess right for bonus points!</p>
      <div class="vote-list">${(g.options || []).map((o, i) => `<button class="vote-item" onclick="act({type:'guessQuestion',i:${i}})">${esc(o)}</button>`).join("")}</div>`;
  }
  let col, ic, h;
  if (g.wasImposter) { col = g.caught ? "var(--red)" : "var(--green)"; ic = "mask"; h = g.caught ? "You got caught!" : "You fooled them!"; }
  else { col = g.votedImposter ? "var(--green)" : "var(--ink-soft)"; ic = g.votedImposter ? "check" : "x"; h = g.votedImposter ? "You caught the Imposter!" : "You got fooled…"; }
  return `<span style="color:${col}">${icon(ic, "status-ic")}</span>
    <h2>${esc(h)}</h2>
    ${g.wasImposter && g.guessedRight ? `<p class="waiting-check">…and you guessed the question! Bonus!</p>` : ""}
    <p class="muted">The question: &ldquo;${esc(g.question)}&rdquo;</p>`;
}
window.sendImpNumber = () => {
  const el = document.getElementById("impnum");
  if (el && el.value !== "") act({ type: "number", value: el.value });
};

/* ---------------- CRAZY EIGHTS ---------------- */
function pCrazyEights(g) {
  if (g.screen === "final") return finalP(g);
  const isRed = (s) => s === "♥" || s === "♦";
  if (!g.myTurn) window._ceBusy = false; // turn passed — re-enable input
  if (window._ce8 && (!g.myTurn || !g.hand.some((c) => c.id === window._ce8))) window._ce8 = null;
  const topHtml = `<div class="ce-top">${cardFace(g.top, "big")}<div class="ce-suit-lbl">Match suit <span style="color:${isRed(g.suit) ? "var(--red)" : "var(--ink)"}">${g.suit}</span></div></div>`;
  const handHtml = (interactive) => `<div class="ce-hand">${g.hand.map((c) => {
    const tappable = interactive && c.playable && !window._ceBusy && !window._ce8;
    return `<button class="pcard ${isRed(c.suit) ? "red" : "black"} ${c.playable ? "playable" : "dim"}" ${tappable ? `onclick="playCard('${c.id}',${c.rank === "8"},this)"` : "disabled"}><span class="pc-rank">${c.rank}</span><span class="pc-suit">${c.suit}</span></button>`;
  }).join("")}</div>`;

  if (g.myTurn && g.resolving) {
    // Your move landed — brief calm state while the turn passes (no highlights,
    // no Draw button, hand not tappable).
    return `${topHtml}
      <p class="player-prompt">Nice! Passing to the next player…</p>
      ${handHtml(false)}
      <div class="ce-action"></div>`;
  }
  if (g.myTurn) {
    // Playing an 8 — a floating overlay (doesn't reflow the hand) with the suit
    // counts so you can see which suit you hold most of.
    let overlay = "";
    if (window._ce8) {
      const counts = { "♠": 0, "♥": 0, "♦": 0, "♣": 0 };
      g.hand.forEach((c) => { if (c.rank !== "8") counts[c.suit]++; });
      overlay = `<div class="ce-overlay"><div class="ce-overlay-panel">
        <p class="player-prompt">You played an 8 — pick the next suit</p>
        <div class="ce-suits">${["♠", "♥", "♦", "♣"].map((s) => `<button class="ce-suitbtn ${isRed(s) ? "red" : ""}" onclick="playEightSuit('${s}')">${s}<span class="ce-suitcount">${counts[s]}</span></button>`).join("")}</div>
        <p class="muted">The number is how many of each suit you're holding.</p>
      </div></div>`;
    }
    // Reserve the action-button row so the hand doesn't jump when Draw appears.
    return `${topHtml}
      <p class="player-prompt">Your turn! ${g.canPlay ? "Play a matching card or an 8." : "No match in hand…"}</p>
      ${handHtml(true)}
      <div class="ce-action">${!g.canPlay ? `<button class="btn big purple" onclick="ceDraw()">Draw a card</button>` : ""}</div>
      ${overlay}`;
  }
  return `${topHtml}
    <p class="muted">Waiting for <b>${esc(g.turnName)}</b> to play…</p>
    ${handHtml(false)}
    <div class="ce-action"></div>`;
}

/* Fly a clone of the tapped card up to the pile (survives the hand re-render). */
function ceFlyToPile(el) {
  const pile = document.querySelector(".ce-top .pcard");
  if (!el || !pile) return;
  const a = el.getBoundingClientRect(), b = pile.getBoundingClientRect();
  const clone = document.createElement("div");
  clone.className = "pcard " + (el.classList.contains("red") ? "red" : "black");
  clone.innerHTML = el.innerHTML;
  clone.style.cssText = `position:fixed;left:0;top:0;width:${a.width}px;height:${a.height}px;margin:0;z-index:999;pointer-events:none;box-shadow:0 12px 26px rgba(0,0,0,.55);transform:translate(${a.left}px,${a.top}px);transition:transform .36s cubic-bezier(.34,.8,.3,1);`;
  document.body.appendChild(clone);
  requestAnimationFrame(() => {
    // Grow to the pile's size and land solid on top of it (the pile re-renders to
    // this same card underneath, so removing the clone is seamless).
    clone.style.transform = `translate(${b.left}px,${b.top}px) scale(${b.width / a.width}) rotate(4deg)`;
  });
  setTimeout(() => clone.remove(), 380);
}

window.playCard = (id, isEight, el) => {
  if (window._ceBusy || window._ce8) return;
  if (isEight) { window._ce8 = id; render(); return; }
  window._ceBusy = true;
  ceFlyToPile(el);
  act({ type: "play", cardId: id });
};
window.playEightSuit = (s) => {
  if (window._ce8 && !window._ceBusy) { window._ceBusy = true; act({ type: "play", cardId: window._ce8, suit: s }); window._ce8 = null; }
};
window.ceDraw = () => act({ type: "draw" });

/* ---------------- REFLEX ---------------- */
function pReflex(g) {
  if (g.screen === "final") return finalP(g);
  if (g.screen === "result") {
    const col = g.out ? "var(--red)" : "var(--green)";
    return `<span style="color:${col}">${icon(g.out ? "x" : "zap", "status-ic")}</span>
      <h2>${g.out ? "Out this round!" : g.myMs != null ? g.myMs + " ms" : "No tap"}</h2>
      <p class="muted">Round ${g.round}/${g.total} done</p>`;
  }
  const roundHdr = `<p class="player-prompt">Round ${g.round}/${g.total}</p>`;

  if (g.screen === "ready") return `${roundHdr}<div class="big-tap idle">Get ready…</div>`;

  if (g.screen === "armed") {
    // Green Light lets you tap (and bust) early; others just wait.
    if (g.type === "greenlight") return `${roundHdr}<div class="big-tap wait" id="tapper">WAIT</div><p class="muted">Tap the moment it turns green!</p>`;
    return `${roundHdr}<div class="big-tap wait">WAIT…</div><p class="muted">Get ready…</p>`;
  }

  // go
  if (g.tapped) return `${roundHdr}<div class="big-tap ${g.out ? "wait" : "go"}">${g.out ? "Out!" : (g.myMs ?? "") + " ms"}</div>`;
  if (g.type === "target") {
    return `${roundHdr}<p class="player-prompt" style="font-size:1.7rem">Tap ${esc(g.targetName)}!</p>
      <div class="color-grid">${g.colors.map((c, i) => `<button class="color-btn" style="background:${c.css}" onclick="reflexPick(${i})"></button>`).join("")}</div>`;
  }
  if (g.type === "math") {
    return `${roundHdr}<p class="player-prompt" style="font-size:2rem">${esc(g.mathQ)} = ?</p>
      <div class="answer-grid">${g.mathOpts.map((n, i) => `<button class="tap-btn o${i % 4}" onclick="reflexPick(${i})">${n}</button>`).join("")}</div>`;
  }
  return `${roundHdr}<div class="big-tap go" id="tapper">TAP!</div>`;
}
window.reflexPick = (i) => act({ type: "tap", choice: i });

/* ---------------- DOODLE DASH ---------------- */
let brushColor = "#2b2150";
let dStrokeId = 0, dCur = null, dSendBuf = [], dLastSend = 0;

function pDoodle(g) {
  if (g.screen === "final") return finalP(g);
  if (g.screen === "result") {
    if (g.isDrawer) return `<span style="color:var(--cyan)">${icon("pencil", "status-ic")}</span><h2>Word: ${esc(g.word)}</h2><p class="muted">Nice drawing!</p>`;
    const col = g.got ? "var(--green)" : "var(--ink-soft)";
    return `<span style="color:${col}">${icon(g.got ? "check" : "x", "status-ic")}</span>
      <h2>${g.got ? "You got it!" : "Missed it"}</h2><p class="muted">The word was “${esc(g.word)}”.</p>`;
  }
  if (g.isDrawer) {
    return `<p class="player-prompt">Draw: <b style="color:var(--cyan)">${esc(g.word)}</b></p>
      <canvas id="draw-canvas" class="draw-canvas" width="640" height="640"></canvas>
      <div class="draw-tools">
        ${["#2b2150", "#ff5c7a", "#4d9fff", "#3ddc97", "#ffd93d", "#ff9f45"].map((c) =>
          `<button class="brush ${c === brushColor ? "on" : ""}" data-c="${c}" style="background:${c}" onclick="setBrush('${c}')"></button>`).join("")}
        <button class="btn ghost" onclick="clearDraw()">Clear</button>
      </div>
      <p class="muted">Everyone's guessing on the big screen!</p>`;
  }
  if (g.gotIt) return `<span style="color:var(--green)">${icon("check", "status-ic")}</span><h2>You got it!</h2><p class="muted">Watch the big screen.</p>`;
  return `<p class="player-prompt">What is ${esc(g.drawerName)} drawing?</p>
    <input class="field" id="dguess" placeholder="your guess" autocomplete="off" autocapitalize="none" />
    <button class="btn big teal" onclick="sendDoodleGuess()">Guess</button>`;
}
window.setBrush = (c) => { brushColor = c; document.querySelectorAll(".brush").forEach((b) => b.classList.toggle("on", b.dataset.c === c)); };
window.clearDraw = () => { window.Doodle.clear(); act({ type: "draw", op: "clear" }); };
window.sendDoodleGuess = () => {
  const el = document.getElementById("dguess");
  if (el && el.value.trim()) { act({ type: "guess", text: el.value }); el.value = ""; }
};

function flushDoodle(force) {
  const t = Date.now();
  if (!dSendBuf.length) return;
  if (!force && t - dLastSend < 70) return;
  socket.emit("player:action", { type: "draw", op: "seg", id: dCur, pts: dSendBuf.slice(), color: brushColor, width: 6 });
  dSendBuf = []; dLastSend = t;
}
function setupDrawCanvas(cv) {
  window.Doodle.attach(cv);
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
  cv.onpointerdown = (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); dStrokeId++; dCur = dStrokeId; const p = pt(e); dSendBuf = [p]; window.Doodle.seg(dCur, [p], brushColor, 6); flushDoodle(true); };
  cv.onpointermove = (e) => { if (dCur == null) return; e.preventDefault(); const p = pt(e); dSendBuf.push(p); window.Doodle.seg(dCur, [p], brushColor, 6); flushDoodle(false); };
  cv.onpointerup = () => { if (dCur == null) return; flushDoodle(true); dCur = null; };
  cv.onpointercancel = cv.onpointerup;
}

/* Attach fast pointer handler for the reflex tap after render */
function wireInputs() {
  const tapper = document.getElementById("tapper");
  if (tapper) {
    tapper.onpointerdown = (e) => { e.preventDefault(); act({ type: "tap" }); };
  }
  // Enter-to-submit for text fields
  ["guess", "lie", "ans", "herd", "dguess"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      if (id !== "guess") el.focus(); // Word Hunt: don't auto-pop the keyboard — tiles are the tap method
      el.onkeydown = (e) => {
        if (e.key === "Enter") {
          if (id === "guess") window.sendGuess();
          if (id === "lie") window.sendLie();
          if (id === "ans") window.sendAnswer();
          if (id === "herd") window.sendHerd();
          if (id === "dguess") window.sendDoodleGuess();
        }
      };
    }
  });
  const dcv = document.getElementById("draw-canvas");
  if (dcv) setupDrawCanvas(dcv);
}

/* boot */
renderJoin();
