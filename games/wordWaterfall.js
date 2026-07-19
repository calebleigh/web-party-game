import { shuffle, pick, normalize } from "./util.js";

/* Word Hunt — spell words from a shared letter bank (like Words on Stream).
 * Difficulty picks the bank pool; format decides how many rounds. */

const PUZZLES = {
  easy: [
    { letters: "STAR", words: ["ART", "RAT", "TAR", "ARTS", "RATS", "STAR"] },
    { letters: "BEAR", words: ["EAR", "ARE", "BAR", "BRA", "BEAR", "BARE"] },
    { letters: "SNAP", words: ["NAP", "PAN", "SAP", "PANS", "SNAP", "SPAN"] },
    { letters: "TEAM", words: ["EAT", "ATE", "TEA", "MATE", "TEAM", "TAME"] },
    { letters: "STOP", words: ["TOP", "POT", "OPT", "POTS", "STOP", "SPOT"] },
    { letters: "PLAY", words: ["PAL", "LAP", "PAY", "LAY", "PLAY", "YAP"] },
    { letters: "CARE", words: ["ACE", "CAR", "ARC", "EAR", "RACE", "CARE"] },
    { letters: "LAME", words: ["ALE", "ELM", "LEA", "MALE", "MEAL", "LAME"] },
    { letters: "WARM", words: ["WAR", "RAW", "ARM", "MAR", "RAM", "WARM"] },
    { letters: "DART", words: ["ART", "RAT", "TAR", "TAD", "RAD", "DART"] },
    { letters: "HEAT", words: ["EAT", "ATE", "TEA", "HAT", "HATE", "HEAT"] },
    { letters: "NOSE", words: ["ONE", "EON", "SON", "EONS", "ONES", "NOSE"] },
    { letters: "RAID", words: ["AIR", "RID", "AID", "RAD", "ARID", "RAID"] },
    { letters: "GATE", words: ["EAT", "ATE", "TEA", "GET", "TAG", "GATE"] },
    { letters: "PACE", words: ["ACE", "CAP", "APE", "PEA", "CAPE", "PACE"] },
    { letters: "TIDE", words: ["TIE", "DIE", "TIED", "DIET", "EDIT", "TIDE"] },
    { letters: "BOAT", words: ["BAT", "OAT", "TAB", "BOA", "BOT", "BOAT"] },
    { letters: "COAT", words: ["CAT", "OAT", "COT", "ACT", "TACO", "COAT"] },
  ],
  medium: [
    { letters: "PLANETS", words: ["PLAN", "PLATE", "PANEL", "PLANET", "PASTEL", "PLANETS"] },
    { letters: "GARDENS", words: ["READ", "GRADE", "ANGER", "DANGER", "GARDEN", "GARDENS"] },
    { letters: "MONSTER", words: ["TORN", "ROSE", "STORE", "SNORE", "MENTOR", "MONSTER"] },
    { letters: "PICTURE", words: ["CUTE", "CURE", "PRICE", "TRUCE", "ERUPT", "PICTURE"] },
    { letters: "RAINBOW", words: ["IRON", "BARN", "WARN", "BRAIN", "BRAWN", "RAINBOW"] },
    { letters: "KITCHEN", words: ["ITCH", "CHIN", "THICK", "THINK", "NICHE", "KITCHEN"] },
    { letters: "FOREST", words: ["FORT", "SORE", "STORE", "FROST", "FORTE", "FOREST"] },
    { letters: "MASTER", words: ["MATE", "STEAM", "TEARS", "RATES", "TAMES", "MASTER"] },
    { letters: "SILENT", words: ["LINE", "TILES", "INLET", "LINES", "LISTEN", "SILENT"] },
    { letters: "ORANGE", words: ["GONE", "RANGE", "ANGER", "ORGAN", "GROAN", "ORANGE"] },
    { letters: "FLAMES", words: ["FAME", "FLAME", "MEALS", "MALES", "FLEAS", "FLAMES"] },
    { letters: "WINTER", words: ["WINE", "RENT", "TIER", "TWINE", "WRITE", "WINTER"] },
    { letters: "CASTLE", words: ["CASE", "CLEAT", "TALES", "STEAL", "LACES", "CASTLE"] },
    { letters: "DANCER", words: ["CARE", "RACE", "DANCE", "CEDAR", "RACED", "DANCER"] },
    { letters: "FROZEN", words: ["ZERO", "FORE", "FERN", "ZONE", "FROZE", "FROZEN"] },
    { letters: "BAKERY", words: ["BEAK", "BAKE", "BAKER", "BRAKE", "BREAK", "BAKERY"] },
    { letters: "MARKET", words: ["MATE", "TEAM", "TAKE", "TAKER", "TAMER", "MARKET"] },
    { letters: "GOLDEN", words: ["GOLD", "DOLE", "LONE", "LODGE", "LONGED", "GOLDEN"] },
    { letters: "HUNTER", words: ["HUNT", "HURT", "TURN", "RUNT", "TUNER", "HUNTER"] },
    { letters: "STORAGE", words: ["GATE", "GOATS", "STARE", "GREAT", "ROAST", "STORAGE"] },
    { letters: "MACHINE", words: ["MEAN", "MANE", "CHAIN", "MINCE", "NICHE", "MACHINE"] },
    { letters: "HOLIDAY", words: ["HOLD", "IDOL", "LADY", "HAIL", "DAILY", "HOLIDAY"] },
    { letters: "PAINTER", words: ["PAIN", "PAINT", "TRAIN", "PRINT", "RETAIN", "PAINTER"] },
    { letters: "NUMBERS", words: ["RUBS", "NURSE", "MENUS", "BURNS", "NUMBER", "NUMBERS"] },
    { letters: "FLOWERS", words: ["FLOW", "FOWLS", "LOWER", "FLOWER", "SLOWER", "FLOWERS"] },
    { letters: "STRANGE", words: ["STAR", "ANGER", "GRANT", "AGENTS", "RANGES", "STRANGE"] },
    { letters: "COUNTED", words: ["CONE", "COUNT", "NOTED", "TONED", "DUNCE", "COUNTED"] },
    { letters: "CLEANS", words: ["CLEAN", "LANCE", "SCALE", "LANES", "CANES", "CLEANS"] },
    { letters: "THUNDER", words: ["HUNT", "UNDER", "HUNTED", "TURNED", "HUNTER", "THUNDER"] },
    { letters: "SPARKLE", words: ["SPARK", "SPEAK", "PEARL", "LEAKS", "PEARLS", "SPARKLE"] },
    { letters: "CHAIRS", words: ["RICH", "CASH", "SCAR", "CHAIR", "HAIRS", "CHAIRS"] },
    { letters: "FRIENDS", words: ["FIRE", "FRIED", "DINER", "FIRES", "FRIEND", "FRIENDS"] },
    { letters: "POWDERS", words: ["ROPES", "WORDS", "DROPS", "POWER", "POWDER", "POWDERS"] },
    { letters: "TABLES", words: ["BEATS", "LEAST", "TABLE", "BLAST", "STABLE", "TABLES"] },
  ],
  hard: [
    { letters: "CAMPFIRE", words: ["FIRE", "CAMP", "FRAME", "CREAM", "PACER", "CAMPFIRE"] },
    { letters: "DIAMONDS", words: ["MAID", "MAIDS", "ADMINS", "DOMAIN", "NOMADS", "DIAMONDS"] },
    { letters: "NETWORK", words: ["WORK", "TORN", "KNOT", "TOKEN", "WROTE", "NETWORK"] },
    { letters: "VAMPIRE", words: ["RIPE", "PAIR", "VAMP", "MARE", "PRIME", "VAMPIRE"] },
    { letters: "KITCHEN", words: ["ITCH", "CHIN", "THICK", "THINK", "NICHE", "KITCHEN"] },
    { letters: "PICTURE", words: ["CUTE", "CURE", "PRICE", "TRUCE", "ERUPT", "PICTURE"] },
    { letters: "CREATION", words: ["REACT", "TRACE", "CRATE", "RATION", "ACTION", "CREATION"] },
    { letters: "COMPUTER", words: ["COME", "MUTE", "COURT", "TEMPO", "COMPUTE", "COMPUTER"] },
    { letters: "BIRTHDAY", words: ["BIRD", "BRAID", "HAIRY", "THIRD", "DIRTY", "BIRTHDAY"] },
    { letters: "DAUGHTER", words: ["HEART", "TRADE", "GUARD", "HATRED", "GATHER", "DAUGHTER"] },
    { letters: "SANDWICH", words: ["HAND", "WIND", "CHAIN", "WINDS", "DANISH", "SANDWICH"] },
    { letters: "ELEPHANT", words: ["HEAL", "LEAP", "PLANE", "PANEL", "PLANET", "ELEPHANT"] },
    { letters: "TREASURE", words: ["STARE", "TEARS", "TREES", "RATES", "ARREST", "TREASURE"] },
    { letters: "MOUNTAIN", words: ["MAIN", "UNIT", "ATOM", "MOUNT", "AMOUNT", "MOUNTAIN"] },
    { letters: "VACATION", words: ["COAT", "VAIN", "IOTA", "TONIC", "ACTION", "VACATION"] },
    { letters: "HOSPITAL", words: ["PILOT", "PATIO", "SPOIL", "SPLIT", "PISTOL", "HOSPITAL"] },
    { letters: "CHILDREN", words: ["CHILD", "DINER", "RELIC", "CINDER", "HINDER", "CHILDREN"] },
    { letters: "AIRPLANE", words: ["PLAIN", "PLANE", "PEARL", "ARENA", "LEARN", "AIRPLANE"] },
  ],
};

const ROUND_MS = 90_000;
const SHUFFLE_MS = 10_000;
const RESULT_MS = 7_000;
const AUTO_START_MS = 30_000; // visible countdown to auto-start the next round if nobody readies
// Reveal-beat pacing — must match the client's inline delays (viewWordReveal).
const TIMESUP_MS = 2200; // "TIME'S UP!" beat before the missed words fill in
const RF_LEAD = 0.2; // small lead-in before the first letter
const RF_INTERVAL = 0.13; // seconds between each missed letter, one continuous cascade
const RF_TAIL = 2.0; // pause to admire the completed board before the leaderboard
const GOAL_BY_DIFF = { easy: 18, medium: 26, hard: 34 };
const GOAL_ROUND_CAP = 20; // safety so endless can't run forever

const LETTER_VALUES = {
  A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
  D: 2, G: 2, B: 3, C: 3, M: 3, P: 3, F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5, J: 8, X: 8, Q: 10, Z: 10,
};
const wordScore = (w) => [...w].reduce((s, ch) => s + (LETTER_VALUES[ch] || 0), 0);

function recordGuess(state, pid, word, status) {
  const list = (state.guesses[pid] = state.guesses[pid] || []);
  if (list.some((g) => g.word === word)) return;
  list.push({ word, value: status === "got" ? wordScore(word) : 0, status });
  // Keep the list from growing unbounded if someone spams guesses.
  if (list.length > 40) list.shift();
}

function beginRound(state, ctx) {
  state.round = (state.round || 0) + 1;
  const pool = PUZZLES[state.difficulty] || PUZZLES.medium;

  let letters, words;
  if (state.format === "quick") {
    // Quickdraw: a single-word anagram race.
    const all = pool.flatMap((p) => p.words).filter((w) => w.length >= 4);
    if (!state.usedWords || state.usedWords.length >= all.length) state.usedWords = [];
    let word;
    do { word = pick(all); } while (state.usedWords.includes(word) && state.usedWords.length < all.length);
    state.usedWords.push(word);
    letters = word.split("");
    words = [word];
  } else {
    if (!state.used || state.used.length >= pool.length) state.used = [];
    let puzzle;
    do { puzzle = pick(pool); } while (state.used.includes(puzzle.letters) && state.used.length < pool.length);
    state.used.push(puzzle.letters);
    letters = puzzle.letters.split("");
    words = [...puzzle.words].sort((a, b) => a.length - b.length || a.localeCompare(b));
  }

  // Each tile keeps a stable id so the client can animate the shuffle.
  let tiles = letters.map((ch, i) => ({ id: i, ch }));
  const mods = state.modifiers || [];
  if (mods.includes("imposter")) {
    const notPresent = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((c) => !letters.includes(c));
    tiles.push({ id: tiles.length, ch: pick(notPresent), imposter: true }); // decoy, no word uses it
  }
  if (mods.includes("mystery")) {
    const real = tiles.filter((t) => !t.imposter);
    pick(real).mystery = true; // hidden as "?" on screen
  }
  state.pool = shuffle(tiles);
  state.words = words.map((w) => ({ text: w, revealed: false, by: null }));
  state.log = [];
  state.roundScores = {};
  state.guesses = {};

  // 3 · 2 · 1 · GO before the round starts.
  state.screen = "countin";
  state.countin = 3;
  ctx.sync();
  ctx.after(1000, () => { if (state.screen === "countin") { state.countin = 2; ctx.sync(); } });
  ctx.after(2000, () => { if (state.screen === "countin") { state.countin = 1; ctx.sync(); } });
  ctx.after(3000, () => { if (state.screen === "countin") { state.countin = "GO"; ctx.sync(); } });
  ctx.after(3700, () => startPlay(state, ctx));
}

function startPlay(state, ctx) {
  if (state.screen !== "countin") return;
  state.screen = "play";
  state.endsAt = ctx.now() + ROUND_MS;
  ctx.sync();

  ctx.after(ROUND_MS, () => endRound(state, ctx));
  const tick = () => { if (state.screen !== "play") return; ctx.syncHost(); ctx.after(1000, tick); };
  ctx.after(1000, tick);
  const shuffleLoop = () => {
    if (state.screen !== "play") return;
    state.pool = shuffle(state.pool);
    ctx.sync();
    ctx.after(SHUFFLE_MS, shuffleLoop);
  };
  ctx.after(SHUFFLE_MS, shuffleLoop);
}

function endRound(state, ctx) {
  if (state.screen !== "play") return;

  let collective = 0;
  for (const p of ctx.players()) {
    const pts = state.roundScores[p.id] || 0;
    collective += pts;
    state.gameTotals[p.id] = (state.gameTotals[p.id] || 0) + pts;
  }
  const goalMet = collective >= state.goal;
  state.lastRound = { collective, goal: state.goal, goalMet };
  if (state.format === "goal") state.willContinue = goalMet && state.round < GOAL_ROUND_CAP;
  else state.willContinue = state.round < state.totalRounds;

  // "TIME'S UP!" beat first, then fill in the missed words.
  state.screen = "timesup";
  ctx.sync();
  const allFound = state.words.every((w) => w.revealed);
  if (allFound) ctx.after(TIMESUP_MS, () => toRoundResults(state, ctx)); // nothing to fill
  else ctx.after(TIMESUP_MS, () => startReveal(state, ctx));
}

function startReveal(state, ctx) {
  if (state.screen !== "timesup") return;
  state.screen = "reveal";
  // Pause timed to just the MISSED letters filling in (found words stay put).
  const missedLetters = state.words.filter((w) => !w.revealed).reduce((n, w) => n + w.text.length, 0);
  const animEnd = RF_LEAD + Math.max(0, missedLetters - 1) * RF_INTERVAL + 0.55;
  const revealMs = Math.round((animEnd + RF_TAIL) * 1000);
  ctx.sync();
  ctx.after(revealMs, () => toRoundResults(state, ctx));
}

function toRoundResults(state, ctx) {
  if (state.screen !== "reveal" && state.screen !== "timesup") return;
  state.screen = "roundresults";
  state.ready = {};
  state.advanceAt = null;
  state.countdownType = null;
  state._counting = false;
  ctx.sync();

  if (state.willContinue) {
    // Always show a countdown to the next round; readying up shortens it.
    startCountdown(state, ctx, AUTO_START_MS, "auto");
  } else {
    ctx.after(RESULT_MS, () => {
      if (state.screen === "roundresults") { state.screen = "final"; ctx.sync(); }
    });
  }
}

function advanceRound(state, ctx) {
  if (state.screen !== "roundresults" || !state.willContinue) return;
  beginRound(state, ctx);
}

/* Start (or shorten) the pre-round countdown. `ms` is how long from now to
 * launch; a later call with a smaller target only ever shortens it. */
function startCountdown(state, ctx, ms, type) {
  const target = ctx.now() + ms;
  state.advanceAt = state.advanceAt ? Math.min(state.advanceAt, target) : target;
  state.countdownType = type;
  if (!state._counting) {
    state._counting = true;
    const tick = () => {
      if (state.screen !== "roundresults") { state._counting = false; return; }
      if (ctx.now() >= state.advanceAt) { state._counting = false; advanceRound(state, ctx); return; }
      ctx.sync();
      ctx.after(1000, tick);
    };
    ctx.after(1000, tick);
  }
}

export default {
  id: "wordWaterfall",
  name: "Word Hunt",
  emoji: "🅆",
  blurb: "Spell words from the shared letters. Rarer letters score more.",
  minPlayers: 1,
  joinMidGame: true, // drop-in friendly — new players start guessing right away
  howTo: [
    "A shared set of letters appears on the main screen.",
    "On your phone, type any word you can spell from those letters.",
    "Longer words and rarer letters (like Q, Z, K) score more points.",
    "The letters reshuffle every 10 seconds to spark new ideas.",
    "Find every hidden word before the timer runs out!",
  ],
  options: [
    {
      key: "difficulty", label: "Difficulty", default: "medium",
      choices: [
        { id: "easy", label: "Easy", hint: "Short 3–4 letter words" },
        { id: "medium", label: "Medium", hint: "4–7 letter words" },
        { id: "hard", label: "Hard", hint: "Longer words, rare letters" },
      ],
    },
    {
      key: "format", label: "Format", default: "r3",
      choices: [
        { id: "r3", label: "3 Rounds", hint: "Highest total wins" },
        { id: "r5", label: "5 Rounds", hint: "Highest total wins" },
        { id: "goal", label: "Endless", hint: "Hit the goal each round to survive" },
        { id: "quick", label: "Quickdraw", hint: "One word — first to spell it wins" },
      ],
    },
    {
      key: "modifiers", label: "Modifiers", type: "multi", default: [],
      choices: [
        { id: "imposter", label: "Imposter", hint: "One tile isn't in any word" },
        { id: "mystery", label: "Mystery", hint: "One tile is hidden as ?" },
      ],
    },
  ],

  start(state, ctx, config = {}) {
    state.difficulty = ["easy", "medium", "hard"].includes(config.difficulty) ? config.difficulty : "medium";
    state.format = ["r3", "r5", "goal", "quick"].includes(config.format) ? config.format : "r3";
    state.totalRounds = state.format === "r5" ? 5 : state.format === "quick" ? 5 : state.format === "r3" ? 3 : Infinity;
    state.goal = GOAL_BY_DIFF[state.difficulty];
    state.modifiers = Array.isArray(config.modifiers)
      ? config.modifiers.filter((m) => ["imposter", "mystery"].includes(m))
      : [];
    state.round = 0;
    state.gameTotals = {};
    state.used = [];
    state.usedWords = [];
    beginRound(state, ctx); // bumps round to 1
  },

  onAction(state, playerId, action, ctx) {
    if (action.type === "ready" && state.screen === "roundresults" && state.willContinue) {
      state.ready[playerId] = true;
      const total = ctx.players().length;
      const readyCount = ctx.players().filter((p) => state.ready[p.id]).length;
      if (total > 0 && readyCount >= total) startCountdown(state, ctx, 3000, "all");   // everyone → 3-2-1
      else if (readyCount * 2 > total) startCountdown(state, ctx, 15000, "majority"); // majority → cut to 15s
      ctx.sync();
      return;
    }
    if (state.screen !== "play") return;
    if (action.type !== "guess") return;
    const guess = normalize(action.text);
    if (!guess) return;
    const target = state.words.find((w) => normalize(w.text) === guess);
    if (!target) {
      // Not a hidden word — still show it on the guesser's screen, grayed out.
      const shown = (action.text || "").trim().toUpperCase().slice(0, 14) || guess.toUpperCase();
      recordGuess(state, playerId, shown, "wrong");
      ctx.sync();
      return;
    }

    if (target.revealed) { recordGuess(state, playerId, target.text, "taken"); ctx.sync(); return; }

    target.revealed = true;
    target.by = playerId;
    const player = ctx.player(playerId);
    const points = wordScore(target.text);
    ctx.award(playerId, points);
    state.roundScores[playerId] = (state.roundScores[playerId] || 0) + points;
    recordGuess(state, playerId, target.text, "got");
    state.log.unshift({ name: player?.name, word: target.text, points, color: player?.color });
    state.log = state.log.slice(0, 6);
    if (state.words.every((w) => w.revealed)) endRound(state, ctx);
    else ctx.sync();
  },

  hostView(state, ctx) {
    const timeLeft = Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000));
    const roundLabel = state.format === "goal" ? `Round ${state.round}` : `Round ${state.round}/${state.totalRounds}`;

    if (state.screen === "final") {
      const standings = ctx.players()
        .map((p) => ({ id: p.id, name: p.name, color: p.color, total: state.gameTotals[p.id] || 0 }))
        .sort((a, b) => b.total - a.total);
      return { screen: "final", roundsPlayed: state.round, format: state.format, standings };
    }

    if (state.screen === "countin") {
      return { screen: "countin", roundLabel, count: state.countin };
    }

    if (state.screen === "timesup") {
      return {
        screen: "timesup",
        roundLabel,
        allFound: state.words.every((w) => w.revealed),
        pool: state.pool,
        values: LETTER_VALUES,
        words: state.words.map((w) => {
          const f = w.by ? ctx.player(w.by) : null;
          return { length: w.text.length, text: w.revealed ? w.text : null, value: w.revealed ? wordScore(w.text) : null, by: f ? f.name : null, color: f ? f.color : null };
        }),
      };
    }

    if (state.screen === "reveal") {
      // The play board, but every word now shown — missed ones fill in.
      return {
        screen: "reveal",
        roundLabel,
        pool: state.pool,
        values: LETTER_VALUES,
        allFound: state.words.every((w) => w.revealed),
        words: state.words.map((w) => {
          const f = w.by ? ctx.player(w.by) : null;
          return { text: w.text, value: wordScore(w.text), found: w.revealed, by: f ? f.name : null, color: f ? f.color : null };
        }),
      };
    }

    if (state.screen === "roundresults") {
      const scores = ctx.players()
        .map((p) => ({ id: p.id, name: p.name, color: p.color, round: state.roundScores[p.id] || 0, total: state.gameTotals[p.id] || 0 }))
        .sort((a, b) => b.total - a.total || b.round - a.round);
      return {
        screen: "roundresults",
        roundLabel,
        values: LETTER_VALUES,
        allFound: state.words.every((w) => w.revealed),
        lastRound: state.lastRound,
        format: state.format,
        willContinue: state.willContinue,
        readyCount: Object.keys(state.ready || {}).length,
        players: ctx.players().length,
        countdown: state.advanceAt ? Math.max(0, Math.ceil((state.advanceAt - ctx.now()) / 1000)) : null,
        countdownType: state.countdownType,
        words: state.words.map((w) => {
          const f = w.by ? ctx.player(w.by) : null;
          return { text: w.text, value: wordScore(w.text), found: w.revealed, by: f ? f.name : null, color: f ? f.color : null };
        }),
        scores,
      };
    }

    return {
      screen: "play",
      roundLabel,
      goal: state.format === "goal" ? state.goal : null,
      progress: ctx.players().reduce((s, p) => s + (state.roundScores[p.id] || 0), 0),
      pool: state.pool,
      values: LETTER_VALUES,
      timeLeft,
      cleared: state.words.filter((w) => w.revealed).length,
      total: state.words.length,
      words: state.words.map((w) => {
        const f = w.by ? ctx.player(w.by) : null;
        return { length: w.text.length, text: w.revealed ? w.text : null, value: w.revealed ? wordScore(w.text) : null, by: f ? f.name : null, color: f ? f.color : null };
      }),
      log: state.log,
    };
  },

  playerView(state, playerId, ctx) {
    const guesses = state.guesses[playerId] || [];
    if (state.screen === "countin") {
      return { screen: "countin", count: state.countin };
    }
    if (state.screen === "timesup") {
      return { screen: "timesup", allFound: state.words.every((w) => w.revealed) };
    }
    if (state.screen === "reveal") {
      return { screen: "reveal", allFound: state.words.every((w) => w.revealed) };
    }
    if (state.screen === "final") {
      const standings = ctx.players()
        .map((p) => ({ id: p.id, total: state.gameTotals[p.id] || 0 }))
        .sort((a, b) => b.total - a.total);
      const myTotal = state.gameTotals[playerId] || 0;
      // Competition rank: tied players share a rank (two firsts -> both rank 1).
      const rank = standings.filter((s) => s.total > myTotal).length + 1;
      const tied = standings.filter((s) => s.total === myTotal).length > 1;
      return { screen: "final", rank, total: standings.length, tied, myTotal };
    }
    if (state.screen === "roundresults") {
      const scores = ctx.players().map((p) => ({ id: p.id, round: state.roundScores[p.id] || 0 })).sort((a, b) => b.round - a.round);
      return {
        screen: "roundresults",
        guesses,
        round: state.roundScores[playerId] || 0,
        total: state.gameTotals[playerId] || 0,
        rank: scores.findIndex((s) => s.id === playerId) + 1,
        players: scores.length,
        willContinue: state.willContinue,
        amReady: !!(state.ready && state.ready[playerId]),
        readyCount: Object.keys(state.ready || {}).length,
        countdown: state.advanceAt ? Math.max(0, Math.ceil((state.advanceAt - ctx.now()) / 1000)) : null,
        countdownType: state.countdownType,
      };
    }
    return {
      screen: "play",
      pool: state.pool,
      values: LETTER_VALUES,
      cleared: state.words.filter((w) => w.revealed).length,
      total: state.words.length,
      guesses,
    };
  },
};
