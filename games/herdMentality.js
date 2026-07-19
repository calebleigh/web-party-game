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
QUESTIONS.push(
  "Name a shape", "Name a primary color", "Name a color of a traffic light", "Name a color of the American flag", "Name something blue", "Name something yellow",
  "Name something green", "Name something orange", "Name something purple", "Name something pink", "Name something black", "Name something white",
  "Name something brown", "Name something round", "Name something square", "Name something soft", "Name something sticky", "Name something shiny",
  "Name something loud", "Name something bright", "Name something sharp", "Name something slippery", "Name something that floats", "Name something that bounces",
  "Name something with buttons", "Name something with a handle", "Name something you squeeze", "Name something you recycle", "Name something sweet", "Name something sour",
  "Name something spicy", "Name something salty", "Name something crunchy", "Name something fluffy", "Name something heavy", "Name something tiny",
  "Name something you plug in", "Name something with a screen", "Name something you charge", "Name a pizza chain", "Name a type of cheese", "Name a type of bread",
  "Name a type of nut", "Name a type of apple", "Name a citrus fruit", "Name a tropical fruit", "Name a type of melon", "Name a type of soup",
  "Name a coffee drink", "Name a type of tea", "Name a type of juice", "Name a soda brand", "Name a type of candy", "Name a type of cookie",
  "Name a type of pie", "Name a doughnut flavor", "Name a flavor of potato chip", "Name a breakfast cereal", "Name a condiment", "Name a spice",
  "Name a Mexican food", "Name an Italian food", "Name a Chinese takeout dish", "Name a taco filling", "Name a sandwich topping", "Name a salad ingredient",
  "Name a leafy green", "Name a root vegetable", "Name a type of bean", "Name a cooking herb", "Name a type of milk", "Name a seafood",
  "Name an ice cream topping", "Name a pancake topping", "Name a Thanksgiving food", "Name a Christmas food", "Name a picnic food", "Name a party snack",
  "Name a movie theater snack", "Name a food you get at the fair", "Name a barbecue food", "Name a food you eat with chopsticks", "Name a food you dip", "Name a food on a stick",
  "Name a burger topping", "Name a hot dog topping", "Name a pasta sauce", "Name a flavor of gum", "Name a jam flavor", "Name a milkshake flavor",
  "Name a smoothie ingredient", "Name a red fruit", "Name a yellow fruit", "Name a type of squash", "Name a fast food side", "Name a fast food dessert",
  "Name something you put on toast", "Name a baking ingredient", "Name a way to cook an egg", "Name a topping for a baked potato", "Name an ocean animal", "Name a reptile",
  "Name an amphibian", "Name a breed of cat", "Name a big cat", "Name a dinosaur", "Name a nocturnal animal", "Name an animal that hops",
  "Name an animal that flies", "Name a pond animal", "Name an animal you'd see on a safari", "Name an Arctic animal", "Name a desert animal", "Name an animal with stripes",
  "Name an animal with spots", "Name a mammal", "Name a rodent", "Name an animal that's black and white", "Name an animal you can ride", "Name a type of pet fish",
  "Name an animal at a petting zoo", "Name an animal with horns", "Name an animal that lives in water", "Name an animal that lays eggs", "Name a spiky animal", "Name a bird you might find on a farm",
  "Name a bug that flies", "Name a slow animal", "Name a fast animal", "Name a fuzzy animal", "Name a country in Asia", "Name a country in Africa",
  "Name a country in South America", "Name a US state", "Name a continent", "Name an ocean", "Name a room in a house", "Name a store at the mall",
  "Name a grocery store", "Name a place you go swimming", "Name a place with a lot of animals", "Name a place you wait in line", "Name a theme park ride", "Name a place you go on vacation",
  "Name a place you go to exercise", "Name a famous landmark", "Name a body of water", "Name a place you'd find sand", "Name a place you get a haircut", "Name a type of store",
  "Name a job that wears a uniform", "Name a job that helps people", "Name a school supply", "Name something in a classroom", "Name something in a pencil case", "Name a type of doctor",
  "Name a job with a vehicle", "Name a profession", "Name something a teacher uses", "Name a place you go to learn", "Name an Olympic sport", "Name a team sport",
  "Name a sport with a ball", "Name a sport played on ice", "Name a water sport", "Name a piece of sports equipment", "Name a video game console", "Name a playground game",
  "Name a game you play at recess", "Name a Disney movie", "Name a Disney princess", "Name a Pixar movie", "Name a cartoon character", "Name a fairy tale",
  "Name a nursery rhyme", "Name a Christmas movie", "Name a type of dance", "Name a hobby", "Name a toy", "Name a type of puzzle",
  "Name a suit in a deck of cards", "Name a chess piece", "Name a superpower", "Name a mythical creature", "Name a Halloween costume", "Name a monster",
  "Name something scary", "Name a genre of music", "Name a string instrument", "Name a percussion instrument", "Name a natural disaster", "Name a flower",
  "Name a garden plant", "Name a gemstone", "Name a metal", "Name a fruit tree", "Name something you see in a garden", "Name something you see in the daytime sky",
  "Name a type of storm", "Name something that falls from the sky", "Name something in a living room", "Name something in a bedroom", "Name something in a garage", "Name something in a fridge",
  "Name something in a toolbox", "Name a kitchen appliance", "Name a cleaning supply", "Name something in a backpack", "Name something in a first aid kit", "Name a piece of jewelry",
  "Name a type of hat", "Name a piece of clothing", "Name something you wear when it's cold", "Name something you wear to the beach", "Name a type of jacket", "Name a type of fabric",
  "Name a car brand", "Name a color of a car", "Name a brand of phone", "Name a brand of sneakers", "Name something you find in a desk drawer", "Name something you sit on",
  "Name something you open with a key", "Name something that keeps you warm", "Name something in a medicine cabinet", "Name something you'd pack in a lunchbox", "Name a part of the face", "Name a part of the hand",
  "Name one of the five senses", "Name a finger", "Name a way to exercise", "Name something you brush", "Name a holiday", "Name a winter holiday",
  "Name something at a birthday party", "Name a party decoration", "Name something you'd see at a wedding", "Name something you do on New Year's Eve", "Name a language", "Name a way to say hello",
  "Name a number between one and ten", "Name a vowel", "Name a US coin", "Name a US president", "Name a chore you do outside", "Name something you'd bring camping",
  "Name something you'd see at a carnival", "Name a type of ball", "Name something you'd see at a swimming pool", "Name a flavor of yogurt", "Name a type of pepper"
);

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
