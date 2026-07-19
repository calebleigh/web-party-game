import { shuffle, sample, leaderboard, countIn, timesUp } from "./util.js";

/* Questions grouped by category. Each: { q, options[4], answer index }. */
const QUESTIONS = {
  science: [
    { q: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], answer: 1 },
    { q: "What gas do plants absorb from the air?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], answer: 1 },
    { q: "What is the center of an atom called?", options: ["Nucleus", "Electron", "Proton", "Neutron"], answer: 0 },
    { q: "What force pulls objects toward the Earth?", options: ["Magnetism", "Gravity", "Friction", "Inertia"], answer: 1 },
    { q: "How many bones are in the adult human body?", options: ["106", "206", "306", "406"], answer: 1 },
    { q: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Quartz"], answer: 2 },
    { q: "What do bees make?", options: ["Silk", "Honey", "Wax only", "Milk"], answer: 1 },
    { q: "What is frozen water called?", options: ["Steam", "Ice", "Mist", "Vapor"], answer: 1 },
  ],
  geography: [
    { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Pacific", "Indian", "Arctic"], answer: 1 },
    { q: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Rome"], answer: 2 },
    { q: "Which is the largest hot desert in the world?", options: ["Gobi", "Sahara", "Mojave", "Kalahari"], answer: 1 },
    { q: "What is the capital of Japan?", options: ["Beijing", "Seoul", "Tokyo", "Bangkok"], answer: 2 },
    { q: "The Sahara Desert is on which continent?", options: ["Asia", "Africa", "Australia", "Europe"], answer: 1 },
    { q: "What is the smallest continent?", options: ["Europe", "Antarctica", "Australia", "Asia"], answer: 2 },
    { q: "Which ocean lies between America and Europe?", options: ["Pacific", "Atlantic", "Indian", "Arctic"], answer: 1 },
    { q: "The Great Wall is located in which country?", options: ["Japan", "India", "China", "Korea"], answer: 2 },
  ],
  history: [
    { q: "Who was the first President of the United States?", options: ["Lincoln", "Washington", "Jefferson", "Adams"], answer: 1 },
    { q: "The ancient pyramids of Giza are in which country?", options: ["Greece", "Egypt", "Mexico", "Iraq"], answer: 1 },
    { q: "What ship famously sank in 1912?", options: ["Titanic", "Lusitania", "Mayflower", "Bismarck"], answer: 0 },
    { q: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"], answer: 2 },
    { q: "Which ancient civilization built the Colosseum?", options: ["Greeks", "Romans", "Egyptians", "Persians"], answer: 1 },
    { q: "In what year did World War II end?", options: ["1918", "1945", "1939", "1950"], answer: 1 },
    { q: "Ancient Egyptians wrote on which material?", options: ["Bamboo", "Papyrus", "Silk", "Clay"], answer: 1 },
    { q: "Which explorer's fleet first sailed around the world?", options: ["Columbus", "Magellan", "Cook", "Drake"], answer: 1 },
  ],
  animals: [
    { q: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Horse", "Greyhound"], answer: 1 },
    { q: "How many legs does a spider have?", options: ["6", "8", "10", "4"], answer: 1 },
    { q: "What is the largest animal on Earth?", options: ["Elephant", "Blue whale", "Giraffe", "Shark"], answer: 1 },
    { q: "Which of these birds cannot fly?", options: ["Eagle", "Penguin", "Sparrow", "Owl"], answer: 1 },
    { q: "What do you call a baby kangaroo?", options: ["Cub", "Joey", "Kit", "Calf"], answer: 1 },
    { q: "How many hearts does an octopus have?", options: ["1", "2", "3", "4"], answer: 2 },
    { q: "What is the tallest animal in the world?", options: ["Elephant", "Giraffe", "Horse", "Camel"], answer: 1 },
    { q: "Which animal is known as the 'king of the jungle'?", options: ["Tiger", "Lion", "Gorilla", "Bear"], answer: 1 },
  ],
  entertainment: [
    { q: "What color is SpongeBob SquarePants?", options: ["Blue", "Yellow", "Green", "Pink"], answer: 1 },
    { q: "In 'Frozen', what is the snowman's name?", options: ["Sven", "Olaf", "Kristoff", "Hans"], answer: 1 },
    { q: "What is the wizard school in Harry Potter called?", options: ["Hogwarts", "Narnia", "Neverland", "Camelot"], answer: 0 },
    { q: "Which superhero is the 'Man of Steel'?", options: ["Batman", "Superman", "Spider-Man", "Iron Man"], answer: 1 },
    { q: "What kind of animal is Pikachu?", options: ["A cat", "A mouse", "A dog", "A rabbit"], answer: 1 },
    { q: "In Toy Story, what type of toy is Woody?", options: ["Astronaut", "Cowboy", "Dinosaur", "Robot"], answer: 1 },
    { q: "What color is the Hulk?", options: ["Red", "Blue", "Green", "Purple"], answer: 2 },
    { q: "Mickey Mouse is the mascot of which company?", options: ["Warner Bros", "Disney", "Pixar", "Universal"], answer: 1 },
  ],
  sports: [
    { q: "How many players from one soccer team are on the field?", options: ["9", "10", "11", "12"], answer: 2 },
    { q: "Which sport uses a racket and a shuttlecock?", options: ["Tennis", "Badminton", "Squash", "Cricket"], answer: 1 },
    { q: "How many points is a touchdown worth in American football?", options: ["3", "6", "7", "2"], answer: 1 },
    { q: "What sport is played at Wimbledon?", options: ["Golf", "Tennis", "Cricket", "Rugby"], answer: 1 },
    { q: "How often are the Summer Olympic Games held?", options: ["Every year", "Every 2 years", "Every 4 years", "Every 5 years"], answer: 2 },
    { q: "In which sport can you score a 'hole in one'?", options: ["Bowling", "Golf", "Darts", "Archery"], answer: 1 },
    { q: "How many rings are on the Olympic flag?", options: ["4", "5", "6", "7"], answer: 1 },
    { q: "How many points is a basketball free throw worth?", options: ["1", "2", "3", "4"], answer: 0 },
  ],
  food: [
    { q: "What fruit is traditionally used to make wine?", options: ["Apple", "Grape", "Orange", "Cherry"], answer: 1 },
    { q: "What is the main ingredient in guacamole?", options: ["Tomato", "Avocado", "Pepper", "Onion"], answer: 1 },
    { q: "Which of these is a citrus fruit?", options: ["Banana", "Lemon", "Apple", "Grape"], answer: 1 },
    { q: "What spice is the most expensive by weight?", options: ["Pepper", "Saffron", "Cinnamon", "Vanilla"], answer: 1 },
    { q: "What is sushi traditionally wrapped in?", options: ["Lettuce", "Seaweed", "Rice paper", "Foil"], answer: 1 },
    { q: "Which country is credited with inventing pizza?", options: ["France", "Italy", "Spain", "Greece"], answer: 1 },
    { q: "What bean is used to make chocolate?", options: ["Soy", "Cocoa", "Coffee", "Kidney"], answer: 1 },
    { q: "Which vegetable often makes you cry when you cut it?", options: ["Carrot", "Onion", "Potato", "Celery"], answer: 1 },
  ],
};

const CATEGORY_LABEL = {
  mixed: "Mixed", science: "Science", geography: "Geography", history: "History",
  animals: "Animals", entertainment: "Screen & Fun", sports: "Sports", food: "Food & Drink",
};

// Additional verified questions merged into the banks above.
const MORE = {
  science: [
    { q: "What is H2O more commonly known as?", options: ["Water", "Salt", "Sugar", "Ammonia"], answer: 0 },
    { q: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Earth", "Neptune"], answer: 1 },
    { q: "Which part of a cell is called its 'powerhouse'?", options: ["Nucleus", "Mitochondria", "Ribosome", "Membrane"], answer: 1 },
    { q: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], answer: 1 },
    { q: "What is the chemical symbol for gold?", options: ["Go", "Au", "Gd", "Ag"], answer: 1 },
    { q: "At what temperature (°C) does water boil at sea level?", options: ["90", "100", "110", "120"], answer: 1 },
    { q: "What is the largest planet in our solar system?", options: ["Saturn", "Jupiter", "Neptune", "Earth"], answer: 1 },
  ],
  geography: [
    { q: "What is the tallest mountain above sea level?", options: ["K2", "Mount Everest", "Kilimanjaro", "Denali"], answer: 1 },
    { q: "What is the capital of Italy?", options: ["Milan", "Venice", "Rome", "Naples"], answer: 2 },
    { q: "What is the capital of Canada?", options: ["Toronto", "Ottawa", "Vancouver", "Montreal"], answer: 1 },
    { q: "On which continent is the Amazon rainforest?", options: ["Africa", "Asia", "South America", "Australia"], answer: 2 },
    { q: "Which is the largest country in the world by area?", options: ["Canada", "China", "Russia", "United States"], answer: 2 },
    { q: "Which US state is nicknamed the 'Sunshine State'?", options: ["California", "Florida", "Texas", "Arizona"], answer: 1 },
    { q: "Mount Fuji is located in which country?", options: ["China", "Japan", "South Korea", "Nepal"], answer: 1 },
  ],
  history: [
    { q: "Who was the first person to walk on the Moon?", options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"], answer: 1 },
    { q: "In which country did the ancient Olympic Games originate?", options: ["Italy", "Greece", "Egypt", "Turkey"], answer: 1 },
    { q: "Who was the main author of the US Declaration of Independence?", options: ["George Washington", "Thomas Jefferson", "Benjamin Franklin", "James Madison"], answer: 1 },
    { q: "The Great Fire of 1666 devastated which city?", options: ["Paris", "London", "Rome", "Madrid"], answer: 1 },
    { q: "Who was British PM for most of World War II?", options: ["Neville Chamberlain", "Winston Churchill", "Clement Attlee", "Tony Blair"], answer: 1 },
    { q: "Which civilization built the city of Machu Picchu?", options: ["Aztec", "Maya", "Inca", "Olmec"], answer: 2 },
    { q: "In what year did humans first land on the Moon?", options: ["1959", "1965", "1969", "1972"], answer: 2 },
  ],
  animals: [
    { q: "How many legs does an insect have?", options: ["4", "6", "8", "10"], answer: 1 },
    { q: "What is the largest land animal on Earth?", options: ["Hippopotamus", "African elephant", "Rhinoceros", "Bison"], answer: 1 },
    { q: "Which bird fans colorful tail feathers during courtship?", options: ["Peacock", "Parrot", "Flamingo", "Toucan"], answer: 0 },
    { q: "What do you call a group of lions?", options: ["Pack", "Pride", "Herd", "Flock"], answer: 1 },
    { q: "Which animal is called 'man's best friend'?", options: ["Cat", "Dog", "Horse", "Rabbit"], answer: 1 },
    { q: "Which bird reaches the highest speed when diving?", options: ["Golden eagle", "Peregrine falcon", "Swift", "Albatross"], answer: 1 },
    { q: "Which is the only mammal capable of true flight?", options: ["Flying squirrel", "Bat", "Sugar glider", "Colugo"], answer: 1 },
    { q: "A tadpole grows up to become which animal?", options: ["Fish", "Frog", "Snake", "Lizard"], answer: 1 },
  ],
  entertainment: [
    { q: "In 'Frozen', what is the name of Elsa's sister?", options: ["Anna", "Ariel", "Aurora", "Belle"], answer: 0 },
    { q: "In 'Finding Nemo', what type of fish is Nemo?", options: ["Goldfish", "Clownfish", "Angelfish", "Guppy"], answer: 1 },
    { q: "How many strings does a standard guitar have?", options: ["4", "5", "6", "7"], answer: 2 },
    { q: "Which superhero is known as the 'Dark Knight'?", options: ["Superman", "Batman", "Spider-Man", "Iron Man"], answer: 1 },
    { q: "In 'The Lion King', what is the young lion who becomes king?", options: ["Simba", "Mufasa", "Scar", "Pumbaa"], answer: 0 },
    { q: "What color is the ogre Shrek?", options: ["Blue", "Green", "Yellow", "Purple"], answer: 1 },
    { q: "Which Disney princess has a pet tiger named Rajah?", options: ["Ariel", "Jasmine", "Cinderella", "Mulan"], answer: 1 },
  ],
  sports: [
    { q: "How many players from one team are on the court in basketball?", options: ["5", "6", "7", "9"], answer: 0 },
    { q: "In which sport would you perform a 'slam dunk'?", options: ["Volleyball", "Basketball", "Tennis", "Baseball"], answer: 1 },
    { q: "In baseball, how many strikes make an out?", options: ["2", "3", "4", "5"], answer: 1 },
    { q: "Which sport is played with a puck?", options: ["Cricket", "Ice hockey", "Rugby", "Lacrosse"], answer: 1 },
    { q: "How many holes are in a standard round of golf?", options: ["9", "12", "18", "24"], answer: 2 },
    { q: "In soccer, scoring three goals in one game is called a _____.", options: ["Triple", "Hat-trick", "Treble", "Trifecta"], answer: 1 },
    { q: "How many players does a baseball team field on defense?", options: ["7", "8", "9", "10"], answer: 2 },
  ],
  food: [
    { q: "What is the main ingredient in most bread?", options: ["Sugar", "Flour", "Rice", "Corn"], answer: 1 },
    { q: "Which fruit is traditionally used to make cider?", options: ["Apple", "Orange", "Grape", "Cherry"], answer: 0 },
    { q: "Which pasta is shaped like short, angled tubes?", options: ["Spaghetti", "Penne", "Lasagna", "Ravioli"], answer: 1 },
    { q: "Which vegetable is the main ingredient in coleslaw?", options: ["Lettuce", "Cabbage", "Spinach", "Celery"], answer: 1 },
    { q: "What is the main ingredient in hummus?", options: ["Lentils", "Chickpeas", "Black beans", "Peas"], answer: 1 },
    { q: "Sushi is a traditional dish from which country?", options: ["China", "Japan", "Thailand", "Korea"], answer: 1 },
    { q: "What vegetable are traditional French fries made from?", options: ["Corn", "Potatoes", "Cassava", "Turnips"], answer: 1 },
  ],
};
for (const c of Object.keys(MORE)) if (QUESTIONS[c]) QUESTIONS[c].push(...MORE[c]);

const QUESTION_MS = 15_000;
const REVEAL_MS = 4_000;

function startQuestion(state, ctx) {
  state.screen = "question";
  state.answers = {};
  state.startedAt = ctx.now();
  state.endsAt = ctx.now() + QUESTION_MS;
  ctx.sync();

  const deadline = state.endsAt;
  ctx.after(QUESTION_MS, () => { if (state.screen === "question" && state.endsAt === deadline) timesUp(state, ctx, () => revealQuestion(state, ctx)); });
  const tick = () => {
    if (state.screen !== "question") return;
    ctx.syncHost();
    ctx.after(1000, tick);
  };
  ctx.after(1000, tick);
}

function revealQuestion(state, ctx) {
  if (state.screen === "reveal") return;
  state.screen = "reveal";
  const q = state.questions[state.index];
  for (const [pid, a] of Object.entries(state.answers)) {
    if (a.choice === q.answer) {
      const elapsed = (a.at - state.startedAt) / QUESTION_MS;
      const speedBonus = Math.round(500 * (1 - Math.min(1, Math.max(0, elapsed))));
      ctx.award(pid, 500 + speedBonus);
    }
  }
  ctx.sync();

  ctx.after(REVEAL_MS, () => {
    state.index++;
    if (state.index >= state.questions.length) {
      state.screen = "final";
      ctx.sync();
    } else {
      startQuestion(state, ctx);
    }
  });
}

export default {
  id: "triviaRush",
  name: "Trivia Rush",
  emoji: "🧠",
  blurb: "Answer fast — the quicker you are, the more you score.",
  minPlayers: 1,
  howTo: [
    "A multiple-choice question appears on the main screen.",
    "Tap your answer on your phone before time runs out.",
    "Correct answers score — and the faster you lock in, the more you get.",
    "Highest score after all the questions wins.",
  ],
  options: [
    {
      key: "category", label: "Category", default: "mixed",
      choices: [
        { id: "mixed", label: "Mixed" },
        { id: "science", label: "Science" },
        { id: "geography", label: "Geography" },
        { id: "history", label: "History" },
        { id: "animals", label: "Animals" },
        { id: "entertainment", label: "Screen & Fun" },
        { id: "sports", label: "Sports" },
        { id: "food", label: "Food & Drink" },
      ],
    },
    {
      key: "length", label: "Questions", default: "8",
      choices: [
        { id: "5", label: "5" },
        { id: "8", label: "8" },
        { id: "12", label: "12" },
      ],
    },
  ],

  start(state, ctx, config = {}) {
    const cat = QUESTIONS[config.category] ? config.category : "mixed";
    const pool = cat === "mixed" ? Object.values(QUESTIONS).flat() : QUESTIONS[cat];
    const n = parseInt(config.length, 10) || 8;
    state.category = CATEGORY_LABEL[cat] || "Mixed";
    state.questions = sample(pool, Math.min(n, pool.length));
    state.index = 0;
    countIn(state, ctx, () => startQuestion(state, ctx));
  },

  onAction(state, playerId, action, ctx) {
    if (state.screen !== "question") return;
    if (action.type !== "answer") return;
    if (state.answers[playerId]) return;
    const choice = Number(action.choice);
    if (!Number.isInteger(choice) || choice < 0 || choice > 3) return;
    state.answers[playerId] = { choice, at: ctx.now() };

    if (ctx.players().every((p) => state.answers[p.id])) {
      revealQuestion(state, ctx);
    } else {
      ctx.sync();
    }
  },

  hostView(state, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    const q = state.questions[state.index];
    const timeLeft = Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000));
    if (state.screen === "final") {
      return { screen: "final", leaderboard: leaderboard(ctx.players()) };
    }
    const counts = [0, 0, 0, 0];
    for (const a of Object.values(state.answers)) counts[a.choice]++;
    return {
      screen: state.screen,
      category: state.category,
      qNum: state.index + 1,
      total: state.questions.length,
      question: q.q,
      options: q.options,
      timeLeft,
      answered: Object.keys(state.answers).length,
      players: ctx.players().length,
      correctIndex: state.screen === "reveal" ? q.answer : null,
      counts: state.screen === "reveal" ? counts : null,
      leaderboard: state.screen === "reveal" ? leaderboard(ctx.players()) : null,
    };
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    const q = state.questions[state.index];
    if (state.screen === "final") {
      const lb = leaderboard(ctx.players());
      const rank = lb.findIndex((p) => p.id === playerId) + 1;
      return { screen: "final", rank, total: lb.length, me: ctx.player(playerId)?.score };
    }
    const mine = state.answers[playerId];
    return {
      screen: state.screen,
      qNum: state.index + 1,
      total: state.questions.length,
      options: q.options,
      myChoice: mine ? mine.choice : null,
      correctIndex: state.screen === "reveal" ? q.answer : null,
      wasCorrect: state.screen === "reveal" && mine ? mine.choice === q.answer : null,
    };
  },
};
