import { shuffle, sample, countIn, timesUp } from "./util.js";

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
PROMPTS.push(
  "A terrible name for a rollercoaster", "The worst thing to say on a first date", "A superpower that only works when you're asleep", "The real reason your socks disappear in the laundry", "A rejected flavor of toothpaste", "What your dog dreams about all day",
  "The worst possible theme for a funeral", "A bad name for a new energy drink", "Something you should NOT say to a lifeguard", "The most useless feature on a new car", "A terrible slogan for an airline", "What your houseplant would say if it could talk",
  "The worst gift to give a newborn baby", "A bad thing to hear your pilot say over the intercom", "A terrible name for a submarine", "The real reason the printer is always out of ink", "A terrible motivational quote for a Monday morning", "The worst thing to hear from your barber halfway through",
  "A rejected name for a brand of dog food", "What your microwave is secretly plotting at midnight", "The most passive-aggressive way to sign off an email", "A terrible superhero whose power is being mildly inconvenient", "The real reason the traffic light turned red just for you", "A bad thing to say while giving a wedding speech",
  "The worst possible name for a cat cafe", "A rejected slogan for a dentist's office", "What the crumbs at the bottom of the bag are dreaming of", "The worst way to answer 'how are you today'", "A terrible theme for a corporate retreat", "The real reason your phone dies at exactly 20 percent",
  "A confusing thing to shout at a sporting event", "The worst souvenir to bring home from a museum", "A rejected button for the next TV remote", "What your washing machine judges you for owning", "The worst possible name for a mattress company", "A terrible piece of advice for a first-time babysitter",
  "The real reason the coffee shop spelled your name wrong", "A bad name for a brand-new pizza chain", "The worst thing to find inside a birthday pinata", "A rejected exhibit at a very boring zoo", "What your shoes have been quietly putting up with", "The most useless thing to bring on a camping trip",
  "A terrible catchphrase for a weather forecaster", "The worst way to start a public speech", "A rejected national holiday that got canceled", "What the office fridge has been hiding all week", "The worst thing to whisper during a museum tour", "A terrible name for a marching band made of toddlers",
  "The real reason your online order took three weeks", "A bad opening line for a first phone call", "The worst possible mascot for a hospital", "A rejected competition for the county fair", "What your bicycle really thinks of your riding", "The worst thing to say to a barista before your coffee",
  "A terrible name for a fancy chocolate", "The real reason dogs bark at the mail carrier", "A bad theme for a high school reunion", "The worst item to auction at a charity gala", "A rejected sound effect for a video game", "What the umbrella in the closet is waiting for",
  "The worst thing to hear right before a rollercoaster starts", "A terrible name for a nature documentary", "The real reason your keys are never where you left them", "A superpower that only works underwater", "The most useless gadget sold on late-night TV", "A terrible slogan for a gym",
  "What your smartwatch really thinks of your workout", "The worst gift to bring to a housewarming party", "A bad thing to say while judging a bake-off", "A terrible name for a lighthouse", "The real reason the escalator is always broken", "A rejected name for a brand of bottled water",
  "What the leftovers in the back of the fridge are planning", "The most awkward thing to say in an elevator", "A terrible superhero who only saves the day on weekends", "The real reason your shoelaces come untied", "A bad thing to say while cutting someone's hair", "The worst possible name for a spa",
  "A rejected slogan for a library", "What the single glove without a pair is hoping for", "The worst way to respond to 'we need to talk'", "A terrible theme for a baby shower", "The real reason your plant grew in exactly the wrong direction", "A confusing thing to announce over a store intercom",
  "The worst thing to collect as a hobby", "A rejected setting on the office thermostat", "What your car keys do while you're asleep", "The worst possible name for a bakery", "A terrible piece of advice for a new pet owner", "The real reason the drive-thru always forgets your fries",
  "A bad name for a brand-new theme park", "The worst thing to find in a box of assorted chocolates", "A rejected float in the town parade", "What your umbrella thinks every time it rains", "The most useless app on your phone", "A terrible catchphrase for a superhero cat",
  "The worst way to end a voicemail", "A rejected month of the year", "What the tangled headphones in your pocket have been up to", "The worst thing to say during a moment of silence", "A terrible name for a knitting club for bikers", "The real reason your suitcase is always the last off the plane",
  "A bad opening line for a customer service call", "The worst possible mascot for a library", "A rejected event for the Olympics", "What your left shoe secretly resents about your right shoe", "The worst thing to say to your hairdresser afterward", "A terrible name for a hot air balloon",
  "The real reason your umbrella breaks the moment you open it", "A bad theme for a company picnic", "The worst item to sell in a hotel gift shop", "A rejected ringtone nobody wanted", "What the crumbs in your keyboard are living off of", "The worst thing to hear a flight attendant say",
  "A terrible name for a farmer's market band", "The real reason the office coffee always tastes like that", "A superpower that only works when nobody is watching", "The most useless thing to keep in your junk drawer", "A terrible slogan for a shoe brand", "What your fitness tracker really wants to tell you",
  "The worst gift to give a coworker on their last day", "A bad thing to say while narrating a wildlife show", "A terrible name for a ski resort", "The real reason your pen runs out mid-signature", "A rejected name for a new breakfast smoothie", "What the last French fry at the bottom of the bag fears",
  "The most awkward thing to say to your neighbor", "A terrible superhero whose only weakness is stairs", "The real reason the microwave beeps one more time", "A bad thing to say while hosting a talent show", "The worst possible name for a submarine sandwich shop", "A rejected slogan for a mattress store",
  "What the spare change in the couch is waiting for", "The worst way to introduce yourself at a party", "A terrible theme for a family game night", "The real reason your ice cream always drips on the good side", "A confusing thing to say to a tour guide", "The worst thing to keep in your car glovebox",
  "A rejected feature for the next pair of headphones", "What your toaster is quietly judging you for", "The worst possible name for a fitness studio", "A terrible piece of advice for a first-time gardener", "The real reason your umbrella turns inside out", "A bad name for a brand-new candy bar",
  "The worst thing to find floating in the community pool", "A rejected mascot for a cereal box", "What your welcome mat has silently endured", "The most useless thing to win at a carnival", "A terrible catchphrase for a talking GPS", "The worst way to answer a trivia question",
  "A rejected day of the week", "What the missing puzzle piece has been doing all this time", "The worst thing to say during a group photo", "A terrible name for a polka band for teenagers", "The real reason the bus arrives the second you give up waiting", "A bad opening line for a wedding toast to strangers",
  "The worst possible mascot for a dentist", "A rejected sport for the neighborhood field day", "What your phone charger really thinks of you", "The worst thing to say to a chef about their cooking", "A terrible name for a fancy candle", "The real reason your remote is always between the couch cushions"
);

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
ANSWER_CARDS.push(
  "A soggy french fry", "Gas station sushi", "A broken umbrella", "The office fridge smell", "A pigeon with attitude", "Uncle Larry at Thanksgiving",
  "A screaming kettle", "Wet cardboard", "A clogged toilet", "The last piece of tape", "A three-legged chair", "Grandma's fruitcake",
  "A malfunctioning robot", "The final boss", "A confused tourist", "Cold pizza for breakfast", "A sock with a hole", "The neighbor's rooster",
  "A drunk uncle", "Slippery ice", "A stubborn mule", "The kids' table", "A half-eaten sandwich", "Burnt popcorn",
  "A flat tire", "The Monday meeting", "A greasy handshake", "Dryer lint", "A lost sock", "The spare bedroom",
  "A creaky floorboard", "Lukewarm coffee", "An angry squirrel", "The junk drawer", "A broken escalator", "Stale bread",
  "A moody teenager", "The dollar store", "A tangled cord", "Overcooked broccoli", "A waterlogged phone", "The self-checkout line",
  "A feral cat", "Melted ice cream", "A squeaky wheel", "The waiting room", "A dented can", "Soggy cereal",
  "A lost puppy", "The parking meter", "A rusty bike", "Freezer burn", "A chatty barber", "The comment section",
  "A limp handshake", "Cafeteria mystery stew", "A broken zipper", "The dentist's chair", "A howling wolf", "Warm soda",
  "A stuck drawer", "The middle seat", "A napping cat", "Grocery store samples", "A stubbed toe", "The unread emails",
  "A cracked screen", "Wilted lettuce", "A loud chewer", "The buffet line", "A persistent mosquito", "Damp towels",
  "A slow walker", "The office gossip", "A tiny umbrella", "Chunky milk", "A spinning top", "The last parking spot",
  "A clumsy waiter", "Runny eggs", "A stray cat", "The dentist's drill", "A sleepy sloth", "Cold french fries",
  "A flickering light", "The snack aisle", "A grumpy cashier", "Soggy toast", "A wobbly table", "The complaint box",
  "A hungry hippo", "Warm potato chips", "A tangled slinky", "The lost remote", "A barking chihuahua", "Deflated balloons",
  "A fussy eater", "The airport delay", "A giant spider", "Cheap cologne", "A broken pencil", "The neighbor's leaf blower",
  "A sassy parrot", "Melting popsicles", "A sticky doorknob", "The hold music", "A confused pigeon", "Room-temperature butter",
  "A creepy mannequin", "The awkward hug", "A hyper puppy", "Burnt toast", "A leaky faucet", "The dentist's bill",
  "A spooked horse", "Flat champagne", "A broken shoelace", "The customer service line", "A waddling penguin", "Soggy nachos",
  "A ticking clock", "The endless meeting", "A sneezing cat", "Overripe bananas", "A squished bug", "The middle child",
  "A fainting goat", "Cheap fireworks", "A limp noodle", "The gym locker room", "A cranky baby", "Spilled coffee",
  "A one-eyed cat", "The lost luggage", "A chubby hamster", "Warm mayonnaise", "A spinning fan", "The dead battery",
  "A sleepy bulldog", "Cold nachos", "A broken record", "The last chicken nugget", "A hissing snake", "Dusty attic",
  "A stubborn cork", "The exit interview", "A waltzing bear", "Chunky peanut butter", "A drooling dog", "The porta-potty",
  "A prancing pony", "Overinflated ego", "A chattering monkey", "The blue screen of death", "A spooky basement"
);

// Classic mode plays noun cards, so it needs judgment/superlative prompts where
// ANY noun is a valid, funny answer (Apples-to-Apples style) — not the freedom
// prompts, which expect a written phrase ("the worst thing to SAY…").
const CLASSIC_PROMPTS = [
  "The worst thing to find in your bed", "Most likely to ruin a family vacation", "The secret to a long and happy life",
  "What the world could really do without", "The worst houseguest imaginable", "Scariest thing to meet in a dark alley",
  "The worst possible birthday present", "What's really clogging the sink", "The true cause of all my problems",
  "Most likely to show up uninvited", "The worst thing to step on at 3am", "What I'd sacrifice to the volcano",
  "The real reason I'm running late", "The worst thing to keep as a pet", "What's hiding in the back of the fridge",
  "The worst thing to bring to a job interview", "The most overrated thing in the world", "The worst superhero sidekick",
  "What the aliens abducted", "The worst thing to name a baby", "The grossest thing at the potluck",
  "What's living in the office ceiling", "The worst wedding gift", "Most likely to start a bar fight",
  "The real reason I'm so tired", "What I found in the lost and found", "The worst thing to microwave",
  "The mascot for my worst nightmare", "What ruined the picnic", "The worst thing to be reincarnated as",
  "What's really in the mystery meat", "The worst thing to hand a toddler", "Most likely to be haunted",
  "The worst thing to trip over in the dark", "What the cat dragged in", "The worst smell on an airplane",
  "My spirit animal, apparently", "The worst thing to win in a raffle", "What's behind the locked basement door",
  "The real MVP of the apocalypse", "What I most regret buying", "The worst thing scratching in the walls",
  "Most likely to make a grown adult cry", "The worst thing to serve at a fancy dinner", "The worst thing to bring camping",
  "What's clogging up my inbox", "The worst thing to keep in your bag", "The reason the party ended early",
  "The worst thing to find in your shoe", "Most likely to survive the winter", "The worst gift for a coworker",
  "What haunts the office bathroom", "The true villain of my morning", "What the dog buried in the yard",
  "The worst thing to leave in a hot car", "Most likely to embarrass you in public", "The worst thing to find in your soup",
  "The reason the neighbors complained", "What I keep meaning to throw out", "The grossest thing in the gym",
  "What crawled out of the drain", "The worst thing to inherit", "Most likely to cause a scene at the DMV",
  "The worst thing to find in a vending machine", "What the fortune cookie warned me about", "The worst thing to adopt",
  "The worst roommate you could ask for", "What's really under the couch cushions", "The worst thing to keep on your desk",
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
    const promptPool = state.mode === "classic" ? CLASSIC_PROMPTS : PROMPTS;
    state.prompts = sample(promptPool, Math.min(n, promptPool.length));
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
      return { screen: "final", leaderboard: ctx.gameLeaderboard() };
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
      view.leaderboard = ctx.gameLeaderboard();
    }
    return view;
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    if (state.screen === "final") {
      const r = ctx.gameRank(playerId);
      return { screen: "final", rank: r.rank, total: r.total, tied: r.tied };
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
