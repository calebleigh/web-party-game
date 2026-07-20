import { shuffle, countIn } from "./util.js";

/* Go Fish — collect books (4 of a kind) by asking other players for ranks.
 * Turn-based: your hand is private on your phone; the big screen shows each
 * player's card/book counts, the ocean pile, and cards flying between them. */

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"]; // ♠ ♥ ♦ ♣
const TURN_MS = 45_000;
const RESULT_MS = 2800;

function buildDeck() {
  const d = [];
  for (const r of RANKS) for (const s of SUITS) d.push({ rank: r, suit: s, id: r + s });
  return shuffle(d);
}
const rankCount = (hand, rank) => hand.filter((c) => c.rank === rank).length;

/* Move any completed 4-of-a-kind out of a hand into that player's books. */
function pullBooks(state, pid, ctx) {
  const made = [];
  let found = true;
  while (found) {
    found = false;
    for (const r of RANKS) {
      if (rankCount(state.hands[pid], r) === 4) {
        state.hands[pid] = state.hands[pid].filter((c) => c.rank !== r);
        state.books[pid].push(r);
        ctx.award(pid, 100);
        made.push(r);
        found = true;
        break;
      }
    }
  }
  return made;
}

function countdown(state, ctx) {
  const tick = () => { if (state.screen !== "play") return; ctx.syncHost(); ctx.after(1000, tick); };
  ctx.after(1000, tick);
}

function checkEnd(state, ctx) {
  const totalBooks = Object.values(state.books).reduce((a, b) => a + b.length, 0);
  const cardsLeft = state.deck.length + Object.values(state.hands).reduce((a, h) => a + h.length, 0);
  if (totalBooks === 13 || cardsLeft === 0) { state.screen = "final"; ctx.sync(); return true; }
  return false;
}

function beginTurn(state, ctx) {
  if (state.screen === "final") return;
  state.screen = "play";
  const cur = state.turnId;
  // A player with no cards draws one to stay in (if the ocean still has cards).
  if (state.hands[cur].length === 0) {
    if (state.deck.length > 0) { state.hands[cur].push(state.deck.pop()); pullBooks(state, cur, ctx); }
    else { return nextTurn(state, ctx); }
  }
  if (checkEnd(state, ctx)) return;
  state.lastAction = null;
  state.endsAt = ctx.now() + TURN_MS;
  ctx.sync();
  const dl = state.endsAt;
  state.timer = ctx.after(TURN_MS, () => {
    if (state.screen === "play" && state.turnId === cur && state.endsAt === dl) autoAsk(state, ctx);
  });
  countdown(state, ctx);
}

function nextTurn(state, ctx) {
  const n = state.order.length;
  for (let k = 0; k < n; k++) {
    state.turnIdx = (state.turnIdx + 1) % n;
    const id = state.order[state.turnIdx];
    if (state.hands[id].length > 0 || state.deck.length > 0) { state.turnId = id; return beginTurn(state, ctx); }
  }
  state.screen = "final";
  ctx.sync();
}

function autoAsk(state, ctx) {
  const cur = state.turnId;
  const ranks = [...new Set(state.hands[cur].map((c) => c.rank))];
  const targets = state.order.filter((id) => id !== cur && state.hands[id].length > 0);
  if (!ranks.length || !targets.length) return nextTurn(state, ctx);
  resolveAsk(state, ctx, cur, targets[Math.floor(Math.random() * targets.length)], ranks[Math.floor(Math.random() * ranks.length)]);
}

function resolveAsk(state, ctx, askerId, targetId, rank) {
  const asker = ctx.player(askerId), target = ctx.player(targetId);
  const matches = state.hands[targetId].filter((c) => c.rank === rank);
  let goAgain = false;
  const plural = rank === "6" ? "6s" : rank; // display helper below handles apostrophes
  if (matches.length > 0) {
    state.hands[targetId] = state.hands[targetId].filter((c) => c.rank !== rank);
    state.hands[askerId].push(...matches);
    const books = pullBooks(state, askerId, ctx);
    state.log.unshift({ text: `${asker?.name} got ${matches.length}× ${rank} from ${target?.name}${books.length ? ` — booked ${books.join(", ")}!` : ""}`, color: asker?.color });
    state.lastAction = { type: "give", askerId, targetId, rank, count: matches.length, books };
    goAgain = true;
  } else {
    let drewAsked = false, drew = null;
    if (state.deck.length > 0) { drew = state.deck.pop(); state.hands[askerId].push(drew); drewAsked = drew.rank === rank; pullBooks(state, askerId, ctx); }
    state.log.unshift({ text: `${asker?.name} asked ${target?.name} for ${rank}s — Go Fish!${drewAsked ? " Lucky draw!" : ""}`, color: asker?.color });
    state.lastAction = { type: "gofish", askerId, targetId, rank, drewAsked };
    goAgain = drewAsked;
  }
  state.log = state.log.slice(0, 6);
  ctx.sync(); // show the result + let the client animate
  ctx.after(RESULT_MS, () => {
    if (state.screen === "final") return;
    if (checkEnd(state, ctx)) return;
    if (goAgain && state.hands[askerId].length > 0) {
      state.lastAction = null;
      state.endsAt = ctx.now() + TURN_MS;
      ctx.sync();
      const dl = state.endsAt;
      state.timer = ctx.after(TURN_MS, () => { if (state.screen === "play" && state.turnId === askerId && state.endsAt === dl) autoAsk(state, ctx); });
      countdown(state, ctx);
    } else {
      nextTurn(state, ctx);
    }
  });
}

export default {
  id: "goFish",
  name: "Go Fish",
  emoji: "🎣",
  blurb: "Ask for cards, collect four of a kind — but watch out for Go Fish!",
  minPlayers: 2,
  howTo: [
    "Everyone gets a hand of cards on their phone.",
    "On your turn, ask another player for a rank you already hold.",
    "If they have it, they hand it all over — and you go again!",
    "If not, it's Go Fish: draw from the ocean pile.",
    "Collect all four of a rank to score a 'book'. Most books wins!",
  ],
  options: [],

  start(state, ctx) {
    const players = ctx.players();
    const deck = buildDeck();
    const dealCount = players.length <= 3 ? 7 : 5;
    state.hands = {}; state.books = {};
    for (const p of players) { state.hands[p.id] = deck.splice(0, dealCount); state.books[p.id] = []; }
    state.deck = deck;
    for (const p of players) pullBooks(state, p.id, ctx);
    state.order = players.map((p) => p.id);
    state.turnIdx = 0;
    state.turnId = state.order[0];
    state.log = [];
    state.lastAction = null;
    state.screen = "countin";
    countIn(state, ctx, () => beginTurn(state, ctx));
  },

  onAction(state, playerId, action, ctx) {
    if (action.type !== "ask" || state.screen !== "play") return;
    if (playerId !== state.turnId) return;
    const rank = action.rank;
    if (!RANKS.includes(rank)) return;
    if (rankCount(state.hands[playerId], rank) === 0) return; // must hold the rank you ask for
    const targetId = action.targetId;
    if (targetId === playerId || !state.order.includes(targetId)) return;
    if (state.hands[targetId].length === 0) return; // can't ask an empty-handed player
    resolveAsk(state, ctx, playerId, targetId, rank);
  },

  hostView(state, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "final") {
      const standings = ctx.players()
        .map((p) => ({ id: p.id, name: p.name, color: p.color, score: (state.books[p.id] || []).length }))
        .sort((a, b) => b.score - a.score);
      return { screen: "final", standings, leaderboard: ctx.gameLeaderboard() };
    }
    const timeLeft = Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000));
    return {
      screen: "play",
      turnId: state.turnId,
      turnName: ctx.player(state.turnId)?.name,
      timeLeft,
      pool: state.deck.length,
      players: ctx.players().map((p) => ({
        id: p.id, name: p.name, color: p.color,
        cards: (state.hands[p.id] || []).length,
        books: (state.books[p.id] || []).length,
        isTurn: p.id === state.turnId,
      })),
      log: state.log,
      lastAction: state.lastAction,
    };
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "final") {
      const r = ctx.gameRank(playerId);
      return { screen: "final", rank: r.rank, total: r.total, tied: r.tied, books: (state.books[playerId] || []).length };
    }
    const hand = [...(state.hands[playerId] || [])].sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
    const myTurn = state.turnId === playerId;
    return {
      screen: "play",
      myTurn,
      turnName: ctx.player(state.turnId)?.name,
      hand,
      myRanks: [...new Set(hand.map((c) => c.rank))],
      books: (state.books[playerId] || []).map((r) => r),
      targets: myTurn ? ctx.players().filter((p) => p.id !== playerId && state.hands[p.id].length > 0).map((p) => ({ id: p.id, name: p.name, color: p.color, cards: state.hands[p.id].length })) : [],
      lastAction: state.lastAction,
    };
  },
};
