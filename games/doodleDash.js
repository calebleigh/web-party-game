import { shuffle, pick, normalize, leaderboard, countIn, timesUp } from "./util.js";

/* Doodle Dash — one player draws a secret word; everyone else races to guess it. */

const WORDS = [
  "cat", "dog", "house", "tree", "sun", "star", "fish", "car", "boat", "flower",
  "apple", "banana", "pizza", "cake", "ice cream", "snowman", "robot", "rocket",
  "ghost", "spider", "snake", "butterfly", "umbrella", "guitar", "hat", "shoe",
  "key", "clock", "book", "cup", "balloon", "kite", "rainbow", "cloud", "moon",
  "heart", "crown", "castle", "dragon", "dinosaur", "elephant", "giraffe",
  "penguin", "owl", "bee", "frog", "turtle", "whale", "camera", "phone",
  "glasses", "chair", "ladder", "lighthouse", "cactus", "mushroom", "anchor",
  "wizard", "mermaid", "unicorn", "volcano", "bicycle", "train", "airplane",
  "hamburger", "donut", "candle", "scissors", "hammer", "tent", "windmill",
];

// Themed word packs let the room pick a vibe (and keep games from repeating).
const PACKS = {
  classic: WORDS,
  animals: [
    "cat", "dog", "fish", "snake", "spider", "butterfly", "bee", "frog", "turtle",
    "whale", "penguin", "owl", "elephant", "giraffe", "dragon", "dinosaur", "unicorn",
    "mermaid", "shark", "crab", "octopus", "panda", "tiger", "lion", "monkey",
    "rabbit", "horse", "cow", "snail", "kangaroo", "hedgehog", "flamingo", "peacock",
  ],
  food: [
    "apple", "banana", "pizza", "cake", "ice cream", "hamburger", "donut", "hot dog",
    "taco", "sushi", "cookie", "cupcake", "popcorn", "pineapple", "strawberry",
    "carrot", "cheese", "egg", "bread", "sandwich", "watermelon", "lollipop",
    "pancakes", "fries", "coffee", "grapes", "corn", "pretzel", "waffle", "burrito",
  ],
  places: [
    "house", "castle", "lighthouse", "volcano", "windmill", "tent", "bridge", "beach",
    "mountain", "island", "city", "farm", "pyramid", "igloo", "cave", "waterfall",
    "desert", "forest", "harbor", "skyscraper", "treehouse", "barn", "tower", "cabin",
  ],
};

const RESULT_MS = 6_000;

function beginRound(state, ctx) {
  const players = ctx.players();
  // Rotate the drawer through everyone in order.
  state.drawerId = state.order[state.round % state.order.length];
  if (!players.some((p) => p.id === state.drawerId)) {
    // Drawer left — pick anyone still here.
    state.drawerId = players[0]?.id;
  }
  const bank = state.wordBank;
  if (!state.usedWords || state.usedWords.length >= bank.length) state.usedWords = [];
  let word;
  do { word = pick(bank); } while (state.usedWords.includes(word) && state.usedWords.length < bank.length);
  state.usedWords.push(word);

  state.word = word;
  state.drawing = []; // strokes: {id, color, width, pts:[{x,y}...]}
  state.correct = {}; // guesserId -> { order, points }
  state.screen = "draw";
  state.endsAt = ctx.now() + state.drawMs;
  ctx.sync();

  const deadline = state.endsAt;
  ctx.after(state.drawMs, () => { if (state.screen === "draw" && state.endsAt === deadline) timesUp(state, ctx, () => endRound(state, ctx)); });
  const tick = () => { if (state.screen !== "draw") return; ctx.syncHost(); ctx.after(1000, tick); };
  ctx.after(1000, tick);
}

function guessers(state, ctx) {
  return ctx.players().filter((p) => p.id !== state.drawerId);
}

function endRound(state, ctx) {
  if (state.screen !== "draw" && state.screen !== "timesup") return;
  state.screen = "result";
  const drawer = ctx.player(state.drawerId);
  state.result = {
    word: state.word,
    drawerName: drawer?.name || "—",
    guessed: guessers(state, ctx).map((p) => ({
      name: p.name, color: p.color, got: !!state.correct[p.id], points: state.correct[p.id]?.points || 0,
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
  id: "doodleDash",
  name: "Doodle Dash",
  emoji: "✏️",
  blurb: "One player draws a secret word — everyone races to guess it!",
  minPlayers: 2,
  howTo: [
    "Each round one player is the drawer and gets a secret word.",
    "The drawer sketches it on their phone — it appears live on the big screen.",
    "Everyone else types guesses as fast as they can.",
    "Guess right to score (faster = more), and the drawer scores for each correct guess!",
    "Everyone gets a turn to draw.",
  ],
  options: [
    {
      key: "pack", label: "Word pack", default: "classic",
      choices: [
        { id: "classic", label: "Classic", hint: "A bit of everything" },
        { id: "animals", label: "Animals", hint: "Critters & creatures" },
        { id: "food", label: "Food", hint: "Tasty things" },
        { id: "places", label: "Places", hint: "Spots & structures" },
      ],
    },
    {
      key: "laps", label: "Turns each", default: "1",
      choices: [{ id: "1", label: "1" }, { id: "2", label: "2" }],
    },
    {
      key: "drawtime", label: "Draw time", default: "70",
      choices: [{ id: "50", label: "50s" }, { id: "70", label: "70s" }, { id: "90", label: "90s" }],
    },
  ],

  start(state, ctx, config = {}) {
    state.wordBank = (PACKS[config.pack] || PACKS.classic).slice();
    state.drawMs = (parseInt(config.drawtime, 10) || 70) * 1000;
    const laps = parseInt(config.laps, 10) || 1;
    state.order = shuffle(ctx.players().map((p) => p.id));
    state.totalRounds = state.order.length * laps; // each player draws `laps` time(s)
    state.round = 0;
    state.usedWords = [];
    countIn(state, ctx, () => beginRound(state, ctx));
  },

  onAction(state, playerId, action, ctx) {
    // ---- Drawer's live drawing (relayed, never a full re-render) ----
    if (action.type === "draw") {
      if (playerId !== state.drawerId || state.screen !== "draw") return;
      if (action.op === "clear") {
        state.drawing = [];
        ctx.broadcast("doodle:clear", {});
      } else if (action.op === "seg" && Array.isArray(action.pts)) {
        let stroke = state.drawing.find((s) => s.id === action.id);
        if (!stroke) {
          stroke = { id: action.id, color: action.color || "#2b2150", width: action.width || 6, pts: [] };
          state.drawing.push(stroke);
          if (state.drawing.length > 400) state.drawing.shift(); // safety cap
        }
        for (const p of action.pts) stroke.pts.push({ x: p.x, y: p.y });
        ctx.broadcast("doodle:seg", { id: action.id, pts: action.pts, color: stroke.color, width: stroke.width });
      }
      return;
    }

    // ---- Guessing ----
    if (action.type === "guess" && state.screen === "draw") {
      if (playerId === state.drawerId) return;
      if (state.correct[playerId]) return;
      const g = normalize(action.text);
      if (!g) return;
      if (g === normalize(state.word)) {
        const order = Object.keys(state.correct).length;
        const points = Math.max(150, 400 - order * 50);
        ctx.award(playerId, points);
        ctx.award(state.drawerId, 100); // drawer scores per correct guess
        state.correct[playerId] = { order, points };
        // Everyone guessed? End early. Otherwise sync (host redraws canvas from strokes).
        if (guessers(state, ctx).every((pl) => state.correct[pl.id])) endRound(state, ctx);
        else ctx.sync();
      } else {
        ctx.emitTo(playerId, "doodle:wrong", {}); // just a little "nope" on their phone
      }
    }
  },

  hostView(state, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    if (state.screen === "final") return { screen: "final", leaderboard: leaderboard(ctx.players()) };
    const drawer = ctx.player(state.drawerId);
    if (state.screen === "result") {
      return { screen: "result", round: state.round + 1, total: state.totalRounds, result: state.result, leaderboard: leaderboard(ctx.players()) };
    }
    return {
      screen: "draw",
      round: state.round + 1,
      total: state.totalRounds,
      drawerName: drawer?.name || "—",
      drawerColor: drawer?.color,
      wordLen: state.word.split(" ").map((w) => w.length), // blanks per word
      timeLeft: Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000)),
      drawing: state.drawing, // for re-render / host reconnect
      guessed: guessers(state, ctx).map((p) => ({ name: p.name, color: p.color, got: !!state.correct[p.id] })),
      gotCount: Object.keys(state.correct).length,
      guesserCount: guessers(state, ctx).length,
    };
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    if (state.screen === "final") {
      const lb = leaderboard(ctx.players());
      return { screen: "final", rank: lb.findIndex((p) => p.id === playerId) + 1, total: lb.length };
    }
    const isDrawer = playerId === state.drawerId;
    if (state.screen === "result") {
      return { screen: "result", word: state.result.word, isDrawer, got: !!state.correct?.[playerId] };
    }
    return {
      screen: "draw",
      isDrawer,
      word: isDrawer ? state.word : null,
      drawerName: ctx.player(state.drawerId)?.name || "—",
      gotIt: !!state.correct[playerId],
      timeLeft: Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000)),
    };
  },
};
