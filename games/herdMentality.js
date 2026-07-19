import { sample, normalize, countIn, timesUp } from "./util.js";

/* Herd Mentality — answer the question; you score only if your answer matches
 * the majority (the "herd"). Think like everyone else! */

const QUESTIONS = [
  "Name a pizza topping",
  "Name a color of the rainbow",
  "Name a farm animal",
  "Name a fast food restaurant",
  "Name a superhero",
  "Name a fruit",
  "Name a day of the week",
  "Name a body part",
  "Name a sport",
  "Name an ice cream flavor",
  "Name a country in Europe",
  "Name a way to travel",
  "Name a school subject",
  "Name a season of the year",
  "Name a planet",
  "Name a breakfast food",
  "Name something in a kitchen",
  "Name a zoo animal",
  "Name a board game",
  "Name a type of weather",
  "Name a vegetable", "Name a wild jungle animal", "Name a type of tree",
  "Name something you find at the beach", "Name a flavor of soda", "Name a pet",
  "Name a color of the crayon box", "Name something you keep in your wallet",
  "Name a type of shoe", "Name a musical instrument", "Name a hot drink",
  "Name something you find in a bathroom", "Name a type of dog", "Name something you do before bed",
  "Name a flavor of cake", "Name a bird", "Name a piece of furniture", "Name something red",
  "Name a month of the year", "Name a type of pasta", "Name something you take on vacation",
  "Name a green vegetable", "Name a card game", "Name something with wheels",
  "Name a type of sandwich", "Name a place you go on a date", "Name something in the sky at night",
  "Name a chore around the house", "Name a type of berry", "Name something you wear on your head",
  "Name a candy bar", "Name a big city in the world", "Name something cold", "Name an insect",
  "Name something you find in a park",
];

const ANSWER_MS = 22_000;
const REVEAL_MS = 6_500;

function beginQuestion(state, ctx) {
  state.screen = "answer";
  state.answers = {}; // pid -> { text, norm }
  state.endsAt = ctx.now() + ANSWER_MS;
  ctx.sync();

  const deadline = state.endsAt;
  ctx.after(ANSWER_MS, () => { if (state.screen === "answer" && state.endsAt === deadline) timesUp(state, ctx, () => reveal(state, ctx)); });
  const tick = () => {
    if (state.screen !== "answer") return;
    ctx.syncHost();
    ctx.after(1000, tick);
  };
  ctx.after(1000, tick);
}

function reveal(state, ctx) {
  if (state.screen !== "answer" && state.screen !== "timesup") return;
  state.screen = "reveal";

  const groups = {};
  for (const [pid, a] of Object.entries(state.answers)) {
    if (!groups[a.norm]) groups[a.norm] = { text: a.text, members: [] };
    groups[a.norm].members.push(pid);
  }
  const max = Object.values(groups).reduce((m, g) => Math.max(m, g.members.length), 0);
  const isHerd = (g) => max >= 2 && g.members.length === max;

  state.herdPids = [];
  for (const g of Object.values(groups)) {
    if (isHerd(g)) {
      for (const pid of g.members) { ctx.award(pid, 100); state.herdPids.push(pid); }
    }
  }

  state.result = {
    noHerd: max < 2,
    groups: Object.values(groups)
      .map((g) => ({
        text: g.text,
        count: g.members.length,
        isHerd: isHerd(g),
        members: g.members.map((pid) => {
          const p = ctx.player(pid);
          return { name: p?.name, color: p?.color };
        }),
      }))
      .sort((a, b) => b.count - a.count),
  };
  ctx.sync();

  ctx.after(REVEAL_MS, () => {
    state.index++;
    if (state.index >= state.questions.length) {
      state.screen = "final";
      ctx.sync();
    } else {
      beginQuestion(state, ctx);
    }
  });
}

export default {
  id: "herdMentality",
  name: "Herd Mentality",
  emoji: "🐄",
  blurb: "Answer the question — but match the majority to score!",
  minPlayers: 2,
  joinMidGame: true,
  howTo: [
    "A simple question appears — like 'Name a pizza topping'.",
    "Type your answer on your phone.",
    "You score only if your answer matches the majority — the herd!",
    "Think like everyone else, not what's clever. Most points wins.",
  ],
  options: [
    {
      key: "length", label: "Questions", default: "8",
      choices: [{ id: "5", label: "5" }, { id: "8", label: "8" }, { id: "12", label: "12" }],
    },
  ],

  start(state, ctx, config = {}) {
    const n = parseInt(config.length, 10) || 8;
    state.questions = sample(QUESTIONS, Math.min(n, QUESTIONS.length));
    state.index = 0;
    countIn(state, ctx, () => beginQuestion(state, ctx));
  },

  onAction(state, playerId, action, ctx) {
    if (state.screen !== "answer") return;
    if (action.type !== "answer") return;
    const text = (action.text || "").trim().slice(0, 24);
    if (!text) return;
    state.answers[playerId] = { text, norm: normalize(text) };
    if (ctx.players().every((p) => state.answers[p.id])) reveal(state, ctx);
    else ctx.sync();
  },

  hostView(state, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    const q = state.questions[state.index];
    const timeLeft = Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000));
    if (state.screen === "final") {
      return { screen: "final", leaderboard: ctx.gameLeaderboard() };
    }
    if (state.screen === "reveal") {
      return {
        screen: "reveal",
        qNum: state.index + 1,
        total: state.questions.length,
        question: q,
        result: state.result,
        leaderboard: ctx.gameLeaderboard(),
      };
    }
    return {
      screen: "answer",
      qNum: state.index + 1,
      total: state.questions.length,
      question: q,
      timeLeft,
      answered: Object.keys(state.answers).length,
      players: ctx.players().length,
    };
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    if (state.screen === "final") {
      const r = ctx.gameRank(playerId);
      return { screen: "final", rank: r.rank, total: r.total, tied: r.tied };
    }
    if (state.screen === "reveal") {
      const answered = !!state.answers[playerId];
      const matched = (state.herdPids || []).includes(playerId);
      return { screen: "reveal", answered, matched, myAnswer: state.answers[playerId]?.text || null };
    }
    return {
      screen: "answer",
      question: state.questions[state.index],
      submitted: !!state.answers[playerId],
    };
  },
};
