import { shuffle, sample, leaderboard, countIn, timesUp } from "./util.js";

const PROMPTS = [
  "A terrible name for a cruise ship",
  "The worst thing to say during a job interview",
  "A superpower that sounds cool but is actually useless",
  "The real reason the dinosaurs went extinct",
  "A rejected flavor of ice cream",
  "What your pet is really thinking about you",
  "The worst possible theme for a wedding",
  "A bad name for a new smartphone",
  "Something you should NOT say to a police officer",
  "The most useless invention of all time",
  "A terrible slogan for a toothpaste brand",
  "What aliens will say when they finally land on Earth",
  "The worst gift to give your boss",
  "A bad thing to hear your surgeon say mid-operation",
  "A terrible name for a boat",
  "The real reason your Wi-Fi stops working the moment you need it most",
  "A terrible motivational poster for the office break room",
  "The worst thing to hear from your dentist mid-procedure",
  "A rejected name for a breakfast cereal aimed at adults",
  "What your GPS is secretly thinking when you ignore its directions",
  "The most passive-aggressive thing to write in a group chat",
  "A terrible superhero whose only power activates on Tuesdays",
  "The real reason the vending machine ate your dollar",
  "A bad thing to say while officiating a wedding",
  "The worst possible name for a self-driving car",
  "A rejected slogan for a national park",
  "What the last cookie in the jar is plotting",
  "The worst way to answer 'so, tell me about yourself'",
  "A terrible theme for a children's birthday party",
  "The real reason your houseplant is dying",
  "A confusing thing to whisper to a barista",
  "The worst souvenir to bring back from vacation",
  "A rejected feature for the next social media app",
  "What your smart fridge judges you for at 2 a.m.",
  "The worst possible thing to name your fantasy sports team",
  "A terrible piece of advice to give a first-time skydiver",
  "The real reason the elevator is taking so long",
  "A bad name for a brand-new breakfast restaurant",
  "The worst thing to find in your hotel room minibar",
  "A rejected ride at a very cheap theme park",
  "What your car makes that noise for, according to the mechanic",
  "The most useless thing to pack for the apocalypse",
  "A terrible catchphrase for a game show host",
  "The worst way to end an important email",
  "A rejected holiday that never caught on",
  "What the office printer is angry about today",
  "The worst thing to yell during a quiet yoga class",
  "A terrible name for a heavy metal band made up of grandparents",
  "The real reason your package says 'out for delivery' for six days",
  "A bad opening line for a wedding toast",
  "The worst possible mascot for a bank",
  "A rejected reality TV show concept",
  "What your alarm clock is really trying to tell you",
  "The worst thing to say to your barber before they start cutting",
  "A terrible name for a luxury perfume",
  "The real reason cats knock things off tables",
  "A bad theme song for your own life",
  "The worst item to sell at a lemonade stand",
  "A rejected emoji nobody asked for",
  "What the moon is secretly up to when nobody's looking",
];

// Classic mode: a deck of answer cards players hold in a hand (Apples-to-Apples style).
const ANSWER_CARDS = [
  "Grandma's cooking", "A wet dog", "Monday mornings", "The internet", "Clowns", "Duct tape",
  "A screaming toddler", "Free samples", "The last slice of pizza", "Awkward silence", "A dad joke",
  "Traffic jams", "Glitter", "A sneeze that won't come out", "Reality TV", "Public restrooms",
  "The DMV", "A broken vending machine", "Autocorrect fails", "Karaoke night", "A haunted house",
  "Expired milk", "A pillow fort", "Nap time", "The group project", "A pop quiz", "Socks with sandals",
  "A pet rock", "Middle school dances", "Elevator music", "A soggy sandwich", "Reply-all emails",
  "A trampoline", "Bubble wrap", "The snooze button", "A magician", "Spicy food", "A conspiracy theory",
  "Mall Santa", "A rubber chicken", "Mystery meat", "A cardboard box", "Wi-Fi passwords",
  "A motivational speaker", "Instant noodles", "A dial-up modem", "A leaf blower at 7am",
  "The 'check engine' light", "Jury duty", "A bad haircut", "Gym class", "A double rainbow",
  "Overpriced coffee", "A juggling act", "The office microwave", "A backseat driver", "Roller coasters",
  "A tax audit", "Confetti", "A ferret", "Grandpa's stories", "A unicycle", "Escalators",
  "A fortune cookie", "The Sunday scaries", "A piñata", "A garden gnome", "A screaming goat",
  "Two raccoons in a trench coat", "A haunted doll", "Warm potato salad",
];

const ANSWER_MS = 45_000;
const VOTE_MS = 30_000;
const REVEAL_MS = 7_000;
const ROUNDS = 3;
const HAND_SIZE = 5;

function drawCard(state) {
  if (!state.deck.length) state.deck = shuffle(ANSWER_CARDS.slice());
  return state.deck.pop();
}
function dealHands(state, ctx) {
  state.hands = {};
  for (const p of ctx.players()) {
    state.hands[p.id] = [];
    for (let i = 0; i < HAND_SIZE; i++) state.hands[p.id].push(drawCard(state));
  }
}

function beginAnswer(state, ctx) {
  state.screen = "answer";
  state.answers = {}; // playerId -> text
  state.votes = {}; // voterId -> answerPlayerId
  state.endsAt = ctx.now() + ANSWER_MS;
  ctx.sync();
  const deadline = state.endsAt;
  ctx.after(ANSWER_MS, () => { if (state.screen === "answer" && state.endsAt === deadline) timesUp(state, ctx, () => beginVote(state, ctx)); });
  countdown(state, ctx, "answer");
}

function beginVote(state, ctx) {
  if (state.screen !== "answer" && state.screen !== "timesup") return;
  const entries = Object.entries(state.answers);
  if (entries.length === 0) {
    // Nobody answered — skip ahead.
    nextRound(state, ctx);
    return;
  }
  state.pool = shuffle(entries.map(([pid, text]) => ({ pid, text })));
  state.screen = "vote";
  state.endsAt = ctx.now() + VOTE_MS;
  ctx.sync();
  const deadline = state.endsAt;
  ctx.after(VOTE_MS, () => { if (state.screen === "vote" && state.endsAt === deadline) timesUp(state, ctx, () => reveal(state, ctx)); });
  countdown(state, ctx, "vote");
}

function reveal(state, ctx) {
  if (state.screen !== "vote" && state.screen !== "timesup") return;
  state.screen = "reveal";
  const tally = {};
  for (const a of state.pool) tally[a.pid] = 0;
  for (const target of Object.values(state.votes)) {
    if (tally[target] != null) tally[target]++;
  }
  for (const [pid, count] of Object.entries(tally)) {
    if (count > 0) ctx.award(pid, count * 100);
  }
  state.results = state.pool
    .map((a) => ({
      name: ctx.player(a.pid)?.name || "—",
      color: ctx.player(a.pid)?.color,
      text: a.text,
      votes: tally[a.pid] || 0,
    }))
    .sort((x, y) => y.votes - x.votes);
  ctx.sync();
  ctx.after(REVEAL_MS, () => nextRound(state, ctx));
}

function nextRound(state, ctx) {
  state.index++;
  if (state.index >= state.prompts.length) {
    state.screen = "final";
    ctx.sync();
  } else {
    beginAnswer(state, ctx);
  }
}

function countdown(state, ctx, screen) {
  const tick = () => {
    if (state.screen !== screen) return;
    ctx.syncHost();
    ctx.after(1000, tick);
  };
  ctx.after(1000, tick);
}

export default {
  id: "promptParty",
  name: "Prompt Party",
  emoji: "🎤",
  blurb: "Answer silly prompts, then vote for the funniest.",
  minPlayers: 2,
  howTo: [
    "A silly prompt appears each round.",
    "Freedom mode: type your own funny answer. Classic mode: play the best card from your hand.",
    "All answers are shown anonymously on the main screen.",
    "Vote for your favorite (not your own) — each vote scores points!",
  ],
  options: [
    {
      key: "mode", label: "Mode", default: "freedom",
      choices: [
        { id: "freedom", label: "Freedom", hint: "Type your own answer" },
        { id: "classic", label: "Classic", hint: "Play from a hand of cards" },
      ],
    },
    {
      key: "rounds", label: "Rounds", default: "3",
      choices: [{ id: "3", label: "3" }, { id: "5", label: "5" }],
    },
  ],

  start(state, ctx, config = {}) {
    state.mode = config.mode === "classic" ? "classic" : "freedom";
    const n = parseInt(config.rounds, 10) || 3;
    state.prompts = sample(PROMPTS, Math.min(n, PROMPTS.length));
    state.index = 0;
    if (state.mode === "classic") {
      state.deck = shuffle(ANSWER_CARDS.slice());
      dealHands(state, ctx);
    }
    countIn(state, ctx, () => beginAnswer(state, ctx));
  },

  onAction(state, playerId, action, ctx) {
    if (action.type === "answer" && state.screen === "answer" && state.mode !== "classic") {
      const text = (action.text || "").toString().trim().slice(0, 80);
      if (text) state.answers[playerId] = text;
      if (ctx.players().every((p) => state.answers[p.id])) beginVote(state, ctx);
      else ctx.sync();
    } else if (action.type === "play" && state.screen === "answer" && state.mode === "classic") {
      if (state.answers[playerId]) return; // already played this round
      const hand = state.hands[playerId] || (state.hands[playerId] = []);
      const idx = Number(action.card);
      if (!Number.isInteger(idx) || idx < 0 || idx >= hand.length) return;
      state.answers[playerId] = hand.splice(idx, 1)[0];
      hand.push(drawCard(state)); // refill the hand
      if (ctx.players().every((p) => state.answers[p.id])) beginVote(state, ctx);
      else ctx.sync();
    } else if (action.type === "vote" && state.screen === "vote") {
      if (action.target === playerId) return; // no voting for yourself
      if (!state.pool.some((a) => a.pid === action.target)) return;
      state.votes[playerId] = action.target;
      // Everyone who can vote has voted?
      const voters = ctx.players().filter((p) => state.pool.length > 1 || state.pool[0]?.pid !== p.id);
      if (voters.every((p) => state.votes[p.id])) reveal(state, ctx);
      else ctx.sync();
    }
  },

  hostView(state, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    const prompt = state.prompts[state.index];
    const timeLeft = Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000));
    if (state.screen === "final") {
      return { screen: "final", leaderboard: leaderboard(ctx.players()) };
    }
    const view = {
      screen: state.screen,
      round: state.index + 1,
      total: state.prompts.length,
      prompt,
      timeLeft,
      mode: state.mode,
    };
    if (state.screen === "answer") {
      view.submitted = Object.keys(state.answers).length;
      view.players = ctx.players().length;
    } else if (state.screen === "vote") {
      view.answers = state.pool.map((a, i) => ({ index: i, text: a.text }));
      view.voted = Object.keys(state.votes).length;
      view.players = ctx.players().length;
    } else if (state.screen === "reveal") {
      view.results = state.results;
      view.leaderboard = leaderboard(ctx.players());
    }
    return view;
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    if (state.screen === "final") {
      const lb = leaderboard(ctx.players());
      return { screen: "final", rank: lb.findIndex((p) => p.id === playerId) + 1, total: lb.length };
    }
    const view = { screen: state.screen, mode: state.mode };
    if (state.screen === "answer") {
      view.prompt = state.prompts[state.index];
      view.submitted = state.answers[playerId] != null;
      if (state.mode === "classic") view.hand = state.hands[playerId] || [];
    } else if (state.screen === "vote") {
      view.prompt = state.prompts[state.index];
      view.options = state.pool
        .filter((a) => a.pid !== playerId)
        .map((a) => ({ target: a.pid, text: a.text }));
      view.myVote = state.votes[playerId] || null;
      view.onlyMine = state.pool.length === 1 && state.pool[0].pid === playerId;
    } else if (state.screen === "reveal") {
      const mine = state.results.find((r) => r.name === ctx.player(playerId)?.name);
      view.myVotes = mine ? mine.votes : 0;
    }
    return view;
  },
};
