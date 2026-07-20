import { shuffle, countIn } from "./util.js";

/* Crazy Eights — match the top card by rank or suit; 8s are wild (you pick the
 * next suit). First to empty their hand wins. Turn-based; hand is private on
 * your phone, the discard pile + player zones show on the big screen. */

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];
const TURN_MS = 40_000;

function buildDeck() {
  const d = [];
  for (const r of RANKS) for (const s of SUITS) d.push({ rank: r, suit: s, id: r + s });
  return shuffle(d);
}
const playable = (c, top, suit) => c.rank === "8" || c.rank === top.rank || c.suit === suit;
const hasPlay = (hand, top, suit) => hand.some((c) => playable(c, top, suit));

function countdown(state, ctx) {
  const tick = () => { if (state.screen !== "play") return; ctx.syncHost(); ctx.after(1000, tick); };
  ctx.after(1000, tick);
}

/* Refill the stock from the discard pile (keeping the top card) when it runs dry. */
function ensureStock(state) {
  if (state.deck.length > 0) return;
  if (state.discard.length <= 1) return;
  const top = state.discard.pop();
  state.deck = shuffle(state.discard);
  state.discard = [top];
}

function finish(state, ctx) {
  state.screen = "final";
  for (const id of state.order) {
    const left = state.hands[id].length;
    ctx.award(id, Math.max(0, 120 - left * 12) + (left === 0 ? 80 : 0));
  }
  ctx.sync();
}

function beginTurn(state, ctx) {
  if (state.screen === "final") return;
  state.screen = "play";
  state.drewThisTurn = false;
  state.locked = false; // set once a move resolves, so no second move sneaks in before the turn advances
  state.lastAction = null;
  const cur = state.turnId;
  state.canPlay = hasPlay(state.hands[cur], state.topCard, state.currentSuit);
  state.endsAt = ctx.now() + TURN_MS;
  ctx.sync();
  const dl = state.endsAt;
  state.timer = ctx.after(TURN_MS, () => { if (state.screen === "play" && state.turnId === cur && state.endsAt === dl) autoPlay(state, ctx); });
  countdown(state, ctx);
}

function nextTurn(state, ctx) {
  state.turnIdx = (state.turnIdx + 1) % state.order.length;
  state.turnId = state.order[state.turnIdx];
  beginTurn(state, ctx);
}

function autoPlay(state, ctx) {
  const cur = state.turnId;
  const hand = state.hands[cur];
  const opts = hand.filter((c) => playable(c, state.topCard, state.currentSuit));
  if (opts.length) {
    const card = opts[Math.floor(Math.random() * opts.length)];
    const suit = card.rank === "8" ? SUITS[Math.floor(Math.random() * 4)] : null;
    doPlay(state, ctx, cur, card.id, suit);
  } else {
    doDraw(state, ctx, cur);
  }
}

function doPlay(state, ctx, pid, cardId, suit) {
  const hand = state.hands[pid];
  const idx = hand.findIndex((c) => c.id === cardId);
  if (idx < 0) return;
  const card = hand[idx];
  if (!playable(card, state.topCard, state.currentSuit)) return;
  state.locked = true; // lock the turn the instant a valid play lands
  hand.splice(idx, 1);
  state.discard.push(card);
  state.topCard = card;
  state.currentSuit = card.rank === "8" && SUITS.includes(suit) ? suit : card.suit;
  const p = ctx.player(pid);
  state.log.unshift({ text: `${p?.name} played ${card.rank}${card.suit}${card.rank === "8" ? ` → ${state.currentSuit}` : ""}${hand.length === 0 ? " — and went out!" : ""}`, color: p?.color });
  state.log = state.log.slice(0, 6);
  state.lastAction = { type: "play", pid, card, suit: state.currentSuit, eight: card.rank === "8" };
  if (hand.length === 0) { ctx.sync(); ctx.after(1200, () => finish(state, ctx)); return; }
  ctx.sync();
  ctx.after(900, () => { if (state.screen === "play") nextTurn(state, ctx); });
}

function doDraw(state, ctx, pid) {
  ensureStock(state);
  const p = ctx.player(pid);
  if (state.deck.length === 0) {
    // Nothing to draw and no play — pass.
    state.locked = true;
    state.log.unshift({ text: `${p?.name} couldn't play — passed`, color: p?.color });
    state.log = state.log.slice(0, 6);
    ctx.sync();
    ctx.after(700, () => { if (state.screen === "play") nextTurn(state, ctx); });
    return;
  }
  const card = state.deck.pop();
  state.hands[pid].push(card);
  state.drewThisTurn = true;
  state.lastAction = { type: "draw", pid };
  if (playable(card, state.topCard, state.currentSuit)) {
    // Drawn card is playable — let them play it (turn stays with them).
    state.canPlay = true;
    state.endsAt = ctx.now() + TURN_MS;
    ctx.sync();
    const dl = state.endsAt;
    state.timer = ctx.after(TURN_MS, () => { if (state.screen === "play" && state.turnId === pid && state.endsAt === dl) autoPlay(state, ctx); });
  } else {
    state.locked = true;
    state.log.unshift({ text: `${p?.name} drew a card — no play`, color: p?.color });
    state.log = state.log.slice(0, 6);
    ctx.sync();
    ctx.after(900, () => { if (state.screen === "play") nextTurn(state, ctx); });
  }
}

export default {
  id: "crazyEights",
  name: "Crazy Eights",
  emoji: "🎴",
  blurb: "Match the pile by rank or suit — 8s are wild. First to empty their hand wins!",
  minPlayers: 2,
  category: "cards",
  howTo: [
    "You get a hand of cards on your phone.",
    "On your turn, play a card matching the pile's rank OR suit.",
    "8s are wild — play one anytime and name the next suit.",
    "No match? Draw from the deck.",
    "First player to get rid of all their cards wins!",
  ],
  options: [],

  start(state, ctx) {
    const players = ctx.players();
    const deck = buildDeck();
    const dealCount = players.length <= 2 ? 7 : 5;
    state.hands = {};
    for (const p of players) state.hands[p.id] = deck.splice(0, dealCount);
    // Flip a non-8 starter for the discard pile.
    let starter = deck.pop();
    while (starter.rank === "8" && deck.length) { deck.unshift(starter); starter = deck.pop(); }
    state.discard = [starter];
    state.topCard = starter;
    state.currentSuit = starter.suit;
    state.deck = deck;
    state.order = players.map((p) => p.id);
    state.turnIdx = 0;
    state.turnId = state.order[0];
    state.log = [];
    state.lastAction = null;
    state.screen = "countin";
    countIn(state, ctx, () => beginTurn(state, ctx));
  },

  onAction(state, playerId, action, ctx) {
    if (state.screen !== "play" || playerId !== state.turnId || state.locked) return;
    if (action.type === "play") {
      doPlay(state, ctx, playerId, action.cardId, action.suit);
    } else if (action.type === "draw") {
      if (hasPlay(state.hands[playerId], state.topCard, state.currentSuit)) return; // must play if able
      doDraw(state, ctx, playerId);
    }
  },

  hostView(state, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "final") {
      const standings = ctx.players()
        .map((p) => ({ id: p.id, name: p.name, color: p.color, score: state.hands[p.id].length }))
        .sort((a, b) => a.score - b.score);
      return { screen: "final", standings, leaderboard: ctx.gameLeaderboard() };
    }
    const timeLeft = Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000));
    return {
      screen: "play",
      turnName: ctx.player(state.turnId)?.name,
      turnColor: ctx.player(state.turnId)?.color,
      timeLeft,
      top: state.topCard,
      suit: state.currentSuit,
      pool: state.deck.length,
      players: ctx.players().map((p) => ({ id: p.id, name: p.name, color: p.color, cards: state.hands[p.id].length, isTurn: p.id === state.turnId })),
      log: state.log,
      lastAction: state.lastAction,
    };
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "final") {
      const r = ctx.gameRank(playerId);
      return { screen: "final", rank: r.rank, total: r.total, tied: r.tied, cardsLeft: state.hands[playerId].length };
    }
    const hand = [...state.hands[playerId]].sort((a, b) => (a.suit.localeCompare(b.suit)) || (RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)));
    const myTurn = state.turnId === playerId;
    return {
      screen: "play",
      myTurn,
      turnName: ctx.player(state.turnId)?.name,
      top: state.topCard,
      suit: state.currentSuit,
      hand: hand.map((c) => ({ ...c, playable: myTurn && playable(c, state.topCard, state.currentSuit) })),
      canPlay: myTurn && hasPlay(state.hands[playerId], state.topCard, state.currentSuit),
    };
  },
};
