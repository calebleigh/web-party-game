import { shuffle, pick, leaderboard } from "./util.js";

/* Reflex Rush — a mix of fast reaction minigames, one per round. */

const RESULT_MS = 4_500;
const POINTS = [100, 70, 50, 40, 30]; // 1st..5th; others who succeed get 20

const COLORS = [
  { id: "red", name: "RED", css: "#ff5c7a" },
  { id: "blue", name: "BLUE", css: "#4d9fff" },
  { id: "green", name: "GREEN", css: "#3ddc97" },
  { id: "yellow", name: "YELLOW", css: "#ffd93d" },
];
const ALL_TYPES = ["greenlight", "target", "math"];
const rint = (n) => Math.floor(Math.random() * n);

function beginRound(state, ctx) {
  state.round++;
  state.taps = {}; // pid -> reactionMs (>=0 = success) | -1 (early/wrong = out)
  state.goAt = null;
  const type = pick(state.pool.length ? state.pool : ALL_TYPES);
  state.type = type;
  state.screen = "ready";

  if (type === "target") {
    state.colors = shuffle(COLORS);
    state.target = pick(COLORS).id;
  } else if (type === "math") {
    const a = 2 + rint(9), b = 2 + rint(9), ans = a + b;
    const cand = shuffle([-2, -1, 1, 2, 3, -3]).map((o) => ans + o).filter((d) => d > 0 && d !== ans);
    const opts = shuffle([ans, ...cand.slice(0, 3)]);
    state.mathQ = `${a} + ${b}`;
    state.mathOpts = opts;
    state.mathAnswer = opts.indexOf(ans);
  }
  ctx.sync();

  ctx.after(1800, () => {
    if (state.screen !== "ready") return;
    state.screen = "armed";
    ctx.sync();
    const delay = type === "greenlight" ? 1500 + rint(3500) : 1200 + rint(1600);
    ctx.after(delay, () => {
      if (state.screen !== "armed") return;
      state.screen = "go";
      state.goAt = ctx.now();
      ctx.sync();
      ctx.after(6000, () => endRound(state, ctx));
    });
  });
}

function isCorrect(state, choice) {
  if (state.type === "greenlight") return true;
  if (state.type === "target") return state.colors[choice] && state.colors[choice].id === state.target;
  if (state.type === "math") return choice === state.mathAnswer;
  return false;
}

function endRound(state, ctx) {
  if (state.screen !== "go") return;
  state.screen = "result";
  const ranked = Object.entries(state.taps).filter(([, ms]) => ms >= 0).sort((a, b) => a[1] - b[1]);
  ranked.forEach(([pid], i) => ctx.award(pid, POINTS[i] ?? 20));
  state.roundResults = ranked.map(([pid, ms], i) => ({
    name: ctx.player(pid)?.name, color: ctx.player(pid)?.color, ms, points: POINTS[i] ?? 20,
  }));
  state.missed = Object.entries(state.taps).filter(([, ms]) => ms < 0).map(([pid]) => ctx.player(pid)?.name).filter(Boolean);
  ctx.sync();

  ctx.after(RESULT_MS, () => {
    if (state.round >= state.totalRounds) { state.screen = "final"; ctx.sync(); }
    else beginRound(state, ctx);
  });
}

export default {
  id: "reflexRush",
  name: "Quick Draw",
  emoji: "⚡",
  blurb: "React fast — tap green, hit the color, solve the math. Fastest wins!",
  minPlayers: 1,
  joinMidGame: true,
  howTo: [
    "Each round is a fast reaction challenge.",
    "Green Light: wait for green, then TAP as fast as you can.",
    "Tap the Color: tap the color the screen calls out.",
    "Quick Math: tap the correct answer first.",
    "Fastest each round scores most — jump early or tap wrong and you're out!",
  ],
  options: [
    {
      key: "minigames", label: "Minigames", type: "multi", default: ["greenlight", "target", "math"],
      choices: [
        { id: "greenlight", label: "Green Light", hint: "Wait for green, tap" },
        { id: "target", label: "Tap the Color", hint: "Tap the called color" },
        { id: "math", label: "Quick Math", hint: "Tap the answer" },
      ],
    },
    {
      key: "rounds", label: "Rounds", default: "6",
      choices: [{ id: "4", label: "4" }, { id: "6", label: "6" }, { id: "8", label: "8" }],
    },
  ],

  start(state, ctx, config = {}) {
    const sel = Array.isArray(config.minigames) ? config.minigames.filter((t) => ALL_TYPES.includes(t)) : [];
    state.pool = sel.length ? sel : ALL_TYPES.slice();
    state.totalRounds = parseInt(config.rounds, 10) || 6;
    state.round = 0;
    beginRound(state, ctx);
  },

  onAction(state, playerId, action, ctx) {
    if (action.type !== "tap") return;
    if (state.taps[playerId] != null) return; // one per round

    if (state.type === "greenlight") {
      if (state.screen === "armed" || state.screen === "ready") { state.taps[playerId] = -1; ctx.sync(); return; }
      if (state.screen === "go") state.taps[playerId] = ctx.now() - state.goAt;
      else return;
    } else {
      if (state.screen !== "go") { state.taps[playerId] = -1; ctx.sync(); return; } // tapped before "go" = out
      const choice = Number(action.choice);
      state.taps[playerId] = isCorrect(state, choice) ? ctx.now() - state.goAt : -1;
    }

    if (ctx.players().every((p) => state.taps[p.id] != null)) endRound(state, ctx);
    else ctx.sync();
  },

  hostView(state, ctx) {
    if (state.screen === "final") return { screen: "final", leaderboard: leaderboard(ctx.players()) };
    const base = {
      screen: state.screen, type: state.type, round: state.round, total: state.totalRounds,
      tapped: Object.keys(state.taps).length, players: ctx.players().length,
    };
    if (state.type === "target") {
      const t = COLORS.find((c) => c.id === state.target);
      base.target = t?.name; base.targetCss = t?.css;
    }
    if (state.type === "math") base.mathQ = state.mathQ;
    if (state.screen === "result") {
      base.results = state.roundResults;
      base.missed = state.missed;
      base.wrongLabel = state.type === "greenlight" ? "Too early" : "Missed / too early";
      base.leaderboard = leaderboard(ctx.players());
    }
    return base;
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "final") {
      const lb = leaderboard(ctx.players());
      return { screen: "final", rank: lb.findIndex((p) => p.id === playerId) + 1, total: lb.length };
    }
    const mine = state.taps[playerId];
    const base = {
      screen: state.screen, type: state.type, round: state.round, total: state.totalRounds,
      tapped: mine != null, myMs: mine != null && mine >= 0 ? mine : null, out: mine === -1,
    };
    if (state.screen === "go") {
      if (state.type === "target") {
        base.colors = state.colors.map((c) => ({ css: c.css }));
        base.targetName = COLORS.find((c) => c.id === state.target)?.name;
      } else if (state.type === "math") {
        base.mathOpts = state.mathOpts;
        base.mathQ = state.mathQ;
      }
    }
    return base;
  },
};
