import { sample, shuffle, countIn } from "./util.js";
import { IMPOSTER_PROMPTS } from "./data/imposterPrompts.js";

/* Imposter — everyone answers a personal numeric question, except one secret
 * imposter who only sees the number RANGE and must bluff. Numbers are revealed,
 * everyone votes on who's faking, then the imposter guesses the real question. */

const ANSWER_MS = 45_000;
const VOTE_MS = 45_000;
const GUESS_MS = 20_000;
const RESULT_MS = 9_000;

function countdown(state, ctx, screen) {
  const tick = () => { if (state.screen !== screen) return; ctx.syncHost(); ctx.after(1000, tick); };
  ctx.after(1000, tick);
}

function rangeBounds(range) {
  const [lo, hi] = String(range).split("-").map((n) => parseInt(n, 10));
  return { lo: Number.isFinite(lo) ? lo : 0, hi: Number.isFinite(hi) ? hi : 9999 };
}

function beginRound(state, ctx) {
  const players = ctx.players();
  state.imposterId = state.order[state.round % state.order.length];
  if (!players.some((p) => p.id === state.imposterId)) state.imposterId = players[0]?.id;
  state.prompt = state.questions[state.round];
  state.numbers = {}; // pid -> number
  state.votes = {};   // pid -> voted-for pid
  state.imposterGuess = null;
  state.questionOptions = null;
  state.screen = "answer";
  state.endsAt = ctx.now() + ANSWER_MS;
  ctx.sync();
  const dl = state.endsAt;
  state.timer = ctx.after(ANSWER_MS, () => { if (state.screen === "answer" && state.endsAt === dl) beginVote(state, ctx); });
  countdown(state, ctx, "answer");
}

function beginVote(state, ctx) {
  if (state.screen !== "answer") return;
  state.screen = "vote";
  state.endsAt = ctx.now() + VOTE_MS;
  ctx.sync();
  const dl = state.endsAt;
  state.timer = ctx.after(VOTE_MS, () => { if (state.screen === "vote" && state.endsAt === dl) beginImposterGuess(state, ctx); });
  countdown(state, ctx, "vote");
}

function beginImposterGuess(state, ctx) {
  if (state.screen !== "vote") return;
  const decoys = sample(IMPOSTER_PROMPTS.filter((p) => p.q !== state.prompt.q), 3).map((p) => p.q);
  state.questionOptions = shuffle([state.prompt.q, ...decoys]);
  state.screen = "imposterGuess";
  state.endsAt = ctx.now() + GUESS_MS;
  ctx.sync();
  const dl = state.endsAt;
  state.timer = ctx.after(GUESS_MS, () => { if (state.screen === "imposterGuess" && state.endsAt === dl) showResults(state, ctx); });
  countdown(state, ctx, "imposterGuess");
}

function showResults(state, ctx) {
  if (state.screen === "results" || state.screen === "final") return;
  state.screen = "results";
  const players = ctx.players();
  const impId = state.imposterId;

  const tally = {}; // pid -> votes received
  for (const v of Object.values(state.votes)) tally[v] = (tally[v] || 0) + 1;

  // Insiders who correctly voted for the imposter score.
  let caughtCount = 0;
  for (const [pid, v] of Object.entries(state.votes)) {
    if (pid !== impId && v === impId) { ctx.award(pid, 150); caughtCount++; }
  }
  // Imposter scores for every insider they fooled (who didn't vote for them).
  const insiders = players.filter((p) => p.id !== impId);
  const fooled = insiders.filter((p) => state.votes[p.id] !== impId).length;
  ctx.award(impId, fooled * 100);
  // Bonus if the imposter figures out the real question.
  const guessedRight = state.imposterGuess != null && state.imposterGuess === state.prompt.q;
  if (guessedRight) ctx.award(impId, 250);

  // Was the imposter the (or a) most-voted player?
  const maxVotes = Math.max(0, ...Object.values(tally));
  const caught = maxVotes > 0 && (tally[impId] || 0) === maxVotes;

  state.result = {
    imposterName: ctx.player(impId)?.name,
    imposterColor: ctx.player(impId)?.color,
    question: state.prompt.q,
    range: state.prompt.range,
    caught,
    caughtCount,
    insiderCount: insiders.length,
    fooled,
    guessedRight,
    imposterGuess: state.imposterGuess,
    numbers: players.map((p) => ({
      name: p.name, color: p.color,
      number: state.numbers[p.id],
      isImposter: p.id === impId,
      votes: tally[p.id] || 0,
    })),
  };
  ctx.sync();
  ctx.after(RESULT_MS, () => {
    state.round++;
    if (state.round >= state.totalRounds) { state.screen = "final"; ctx.sync(); }
    else beginRound(state, ctx);
  });
}

export default {
  id: "imposter",
  name: "Imposter",
  emoji: "🕵️",
  blurb: "Everyone answers a question — except the imposter, who's faking it.",
  minPlayers: 3,
  howTo: [
    "Everyone gets the same question with a number answer.",
    "But one secret Imposter only sees a number range — not the question!",
    "The Imposter has to bluff a number that blends in.",
    "All numbers are revealed — then vote for who's faking it.",
    "Catch the Imposter to score. The Imposter scores for fooling you.",
  ],
  options: [
    {
      key: "rounds", label: "Rounds", default: "5",
      choices: [{ id: "3", label: "3" }, { id: "5", label: "5" }, { id: "8", label: "8" }],
    },
  ],

  start(state, ctx, config = {}) {
    const players = ctx.players();
    state.order = shuffle(players.map((p) => p.id));
    const n = parseInt(config.rounds, 10) || 5;
    state.totalRounds = n;
    state.questions = sample(IMPOSTER_PROMPTS, Math.min(n, IMPOSTER_PROMPTS.length));
    state.round = 0;
    countIn(state, ctx, () => beginRound(state, ctx));
  },

  onAction(state, playerId, action, ctx) {
    if (action.type === "number" && state.screen === "answer") {
      let num = parseInt(action.value, 10);
      if (!Number.isFinite(num)) return;
      num = Math.max(0, Math.min(9999, num));
      // Keep the imposter's bluff inside the range so it can't be an obvious tell.
      if (playerId === state.imposterId) {
        const { lo, hi } = rangeBounds(state.prompt.range);
        num = Math.max(lo, Math.min(hi, num));
      }
      state.numbers[playerId] = num;
      if (ctx.players().every((p) => state.numbers[p.id] != null)) beginVote(state, ctx);
      else ctx.sync();
    } else if (action.type === "vote" && state.screen === "vote") {
      if (action.target === playerId) return;
      if (!ctx.players().some((p) => p.id === action.target)) return;
      state.votes[playerId] = action.target;
      if (ctx.players().every((p) => state.votes[p.id])) beginImposterGuess(state, ctx);
      else ctx.sync();
    } else if (action.type === "guessQuestion" && state.screen === "imposterGuess") {
      if (playerId !== state.imposterId) return;
      const q = state.questionOptions && state.questionOptions[action.i];
      if (q == null) return;
      state.imposterGuess = q;
      showResults(state, ctx);
    }
  },

  hostView(state, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "final") return { screen: "final", leaderboard: ctx.gameLeaderboard() };
    const timeLeft = Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000));
    const view = { screen: state.screen, round: state.round + 1, total: state.totalRounds, timeLeft };
    if (state.screen === "answer") {
      view.answered = Object.keys(state.numbers).length;
      view.players = ctx.players().length;
    } else if (state.screen === "vote") {
      view.numbers = ctx.players().map((p) => ({ id: p.id, name: p.name, color: p.color, number: state.numbers[p.id] }));
      view.voted = Object.keys(state.votes).length;
      view.players = ctx.players().length;
    } else if (state.screen === "imposterGuess") {
      view.imposterName = ctx.player(state.imposterId)?.name;
    } else if (state.screen === "results") {
      view.result = state.result;
      view.leaderboard = ctx.gameLeaderboard();
    }
    return view;
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "final") {
      const r = ctx.gameRank(playerId);
      return { screen: "final", rank: r.rank, total: r.total, tied: r.tied };
    }
    const isImposter = playerId === state.imposterId;
    const view = { screen: state.screen, isImposter };
    if (state.screen === "answer") {
      view.question = isImposter ? null : state.prompt.q;
      view.range = isImposter ? state.prompt.range : null;
      view.submitted = state.numbers[playerId] != null;
    } else if (state.screen === "vote") {
      view.myNumber = state.numbers[playerId];
      view.myVote = state.votes[playerId] || null;
      view.options = ctx.players().filter((p) => p.id !== playerId).map((p) => ({ id: p.id, name: p.name, color: p.color }));
    } else if (state.screen === "imposterGuess") {
      if (isImposter) {
        view.options = state.questionOptions || [];
        view.guessed = state.imposterGuess != null;
      }
    } else if (state.screen === "results") {
      view.wasImposter = isImposter;
      view.votedImposter = state.votes[playerId] === state.imposterId;
      view.caught = state.result.caught;
      view.guessedRight = state.result.guessedRight;
      view.question = state.result.question;
    }
    return view;
  },
};
