import { shuffle, sample, normalize, countIn, timesUp } from "./util.js";

const QUESTIONS = {
  animals: [
    { prompt: "The world's largest species of rabbit is the Flemish _____.", answer: "Giant" },
    { prompt: "A group of flamingos is called a _____.", answer: "Flamboyance" },
    { prompt: "A group of owls is called a _____.", answer: "Parliament" },
    { prompt: "A baby kangaroo is called a _____.", answer: "Joey" },
    { prompt: "The wobbly red thing on top of a rooster's head is called a _____.", answer: "Comb" },
    { prompt: "A group of crows is called a _____.", answer: "Murder" },
    { prompt: "A group of jellyfish is called a _____.", answer: "Smack" },
    { prompt: "Scotland's official national animal is the mythical _____.", answer: "Unicorn" },
  ],
  words: [
    { prompt: "The tiny plastic tip at the end of a shoelace is an _____.", answer: "Aglet" },
    { prompt: "The dot over a lowercase 'i' or 'j' is called a _____.", answer: "Tittle" },
    { prompt: "A single strand of spaghetti is called a _____.", answer: "Spaghetto" },
    { prompt: "The space between your eyebrows is called the _____.", answer: "Glabella" },
    { prompt: "The '#' symbol is technically called an _____.", answer: "Octothorpe" },
    { prompt: "The metal band that holds a pencil's eraser on is called a _____.", answer: "Ferrule" },
    { prompt: "The groove between your nose and upper lip is called the _____.", answer: "Philtrum" },
    { prompt: "The fear of long words is called Hippopotomonstrosesquippedalio_____.", answer: "phobia" },
  ],
  science: [
    { prompt: "A strawberry is technically an _____ fruit, not a berry.", answer: "Aggregate" },
    { prompt: "Archaeologists found still-edible honey in ancient _____ tombs.", answer: "Egyptian" },
    { prompt: "Wombat droppings are famously shaped like a _____.", answer: "Cube" },
    { prompt: "The pistol _____ can snap its claw loudly enough to stun prey.", answer: "Shrimp" },
    { prompt: "Sharks are older than _____ — they've existed longer.", answer: "Trees" },
    { prompt: "An octopus has this many hearts: _____.", answer: "Three" },
  ],
  food: [
    { prompt: "Cashews grow attached to a fruit called the cashew _____.", answer: "Apple" },
    { prompt: "In the 1830s, ketchup was actually sold as _____.", answer: "Medicine" },
    { prompt: "Carrots were originally _____ in color before orange ones.", answer: "Purple" },
    { prompt: "The little bumpy segments on a raspberry are called _____.", answer: "Drupelets" },
    { prompt: "Peanuts aren't nuts — they're actually _____.", answer: "Legumes" },
    { prompt: "The holes in Swiss cheese are officially called _____.", answer: "Eyes" },
  ],
};

// New categories + more facts (all verified) merged into the bank.
QUESTIONS.history = [
  { prompt: "Cleopatra lived closer in time to the Moon landing than to the building of the _____.", answer: "Pyramids" },
  { prompt: "The shortest war in recorded history lasted about _____ minutes.", answer: "38" },
  { prompt: "Nintendo was founded back in 1889 to make playing _____.", answer: "Cards" },
  { prompt: "The _____ machine was patented decades before the telephone was invented.", answer: "Fax" },
  { prompt: "Despite the popular image, real Vikings never actually wore _____ helmets.", answer: "Horned" },
  { prompt: "Tug of war used to be an official _____ sport.", answer: "Olympic" },
];
QUESTIONS.space = [
  { prompt: "A single day on Venus is longer than its entire _____.", answer: "Year" },
  { prompt: "Scientists believe it rains _____ inside the planet Neptune.", answer: "Diamonds" },
  { prompt: "Saturn is so low in density that it would _____ if placed in water.", answer: "Float" },
  { prompt: "The largest known volcano in the solar system is called _____.", answer: "Olympus Mons" },
  { prompt: "In the weightlessness of space, astronauts temporarily grow _____.", answer: "Taller" },
];
const MORE_LL = {
  animals: [
    { prompt: "A group of rhinoceroses is called a _____.", answer: "Crash" },
    { prompt: "A group of ferrets is called a _____.", answer: "Business" },
    { prompt: "A group of pandas is called an _____.", answer: "Embarrassment" },
    { prompt: "Hummingbirds are the only birds that can fly _____.", answer: "Backward" },
    { prompt: "Butterflies taste with their _____.", answer: "Feet" },
    { prompt: "A baby echidna is called a _____.", answer: "Puggle" },
  ],
  words: [
    { prompt: "The mathematical infinity symbol (∞) is properly called a _____.", answer: "Lemniscate" },
    { prompt: "The study of flags is called _____.", answer: "Vexillology" },
    { prompt: "The little wire cage holding a champagne cork in place is a _____.", answer: "Muselet" },
    { prompt: "The longest English word typed on only a keyboard's top row is _____.", answer: "Typewriter" },
    { prompt: "The archaic English word for 'the day after tomorrow' is _____.", answer: "Overmorrow" },
    { prompt: "A common English word with no A, E, I, O, or U is _____.", answer: "Rhythms" },
  ],
  science: [
    { prompt: "Because they contain potassium-40, bananas are slightly _____.", answer: "Radioactive" },
    { prompt: "The chemical element with the symbol 'W' is actually called _____.", answer: "Tungsten" },
    { prompt: "The pleasant earthy smell after rain on dry ground is called _____.", answer: "Petrichor" },
    { prompt: "The metal _____ has such a low melting point it turns liquid in your hand.", answer: "Gallium" },
    { prompt: "Sound travels roughly four times faster through _____ than through air.", answer: "Water" },
    { prompt: "The spiciness of a chili pepper is measured in _____ units.", answer: "Scoville" },
  ],
  food: [
    { prompt: "The red food dye carmine is made from crushed _____.", answer: "Insects" },
    { prompt: "Most 'wasabi' served outside Japan is actually dyed _____.", answer: "Horseradish" },
    { prompt: "Unlike milk and dark chocolate, white chocolate contains no cocoa _____.", answer: "Solids" },
    { prompt: "Natural vanilla flavor comes from the pod of an _____.", answer: "Orchid" },
    { prompt: "Botanically speaking, bananas are classified as _____.", answer: "Berries" },
    { prompt: "Studies repeatedly name _____ the most shoplifted food in the world.", answer: "Cheese" },
  ],
};
for (const c of Object.keys(MORE_LL)) QUESTIONS[c].push(...MORE_LL[c]);

// Second batch — deepens every category, with the biggest boost to the two
// thinnest pools (space, history) so a single game no longer exhausts them.
const MORE_LL2 = {
  animals: [
    { prompt: "A group of larks is called an _____.", answer: "Exaltation" },
    { prompt: "A group of porcupines is called a _____.", answer: "Prickle" },
    { prompt: "A group of giraffes is called a _____.", answer: "Tower" },
    { prompt: "A group of pugs is called a _____.", answer: "Grumble" },
    { prompt: "Sea otters hold _____ while they sleep so they don't drift apart.", answer: "Hands" },
    { prompt: "A baby hedgehog is called a _____.", answer: "Hoglet" },
  ],
  words: [
    { prompt: "The white crescent at the base of your fingernail is called the _____.", answer: "Lunula" },
    { prompt: "The dimple in the bottom of a wine bottle is called the _____.", answer: "Punt" },
    { prompt: "The cardboard sleeve around a hot coffee cup is called a _____.", answer: "Zarf" },
    { prompt: "The archaic English word for 'the day before yesterday' is _____.", answer: "Ereyesterday" },
    { prompt: "The tiny muscles that give you goosebumps are the arrector _____ muscles.", answer: "Pili" },
    { prompt: "The two dots over a vowel, as in 'naïve,' form a _____.", answer: "Diaeresis" },
  ],
  science: [
    { prompt: "Under the right conditions, hot water can freeze faster than cold — the _____ effect.", answer: "Mpemba" },
    { prompt: "A bolt of lightning is roughly five times hotter than the surface of the _____.", answer: "Sun" },
    { prompt: "Water can boil and freeze at the very same time at its _____ point.", answer: "Triple" },
    { prompt: "Inhaling the gas sulfur hexafluoride makes your voice sound much _____.", answer: "Deeper" },
    { prompt: "Bees can be trained to recognize individual human _____.", answer: "Faces" },
    { prompt: "Onions make you cry by releasing a mild form of sulfuric _____.", answer: "Acid" },
    { prompt: "Antarctica is technically the largest _____ on Earth.", answer: "Desert" },
    { prompt: "Because heat makes its iron expand, the Eiffel Tower is taller in _____ than in winter.", answer: "Summer" },
  ],
  food: [
    { prompt: "In large amounts, the common spice _____ is toxic and even hallucinogenic.", answer: "Nutmeg" },
    { prompt: "Apples float in water because they are about a quarter _____.", answer: "Air" },
    { prompt: "Pineapple 'bites back' because it contains an enzyme that digests _____.", answer: "Protein" },
    { prompt: "The Aztecs used cacao beans as a form of _____.", answer: "Currency" },
    { prompt: "Worcestershire sauce is traditionally fermented with _____.", answer: "Anchovies" },
    { prompt: "Every color of Froot Loops is actually the exact same _____.", answer: "Flavor" },
    { prompt: "An ear of corn almost always has an _____ number of rows.", answer: "Even" },
    { prompt: "Stored in large piles, pistachios can spontaneously _____.", answer: "Combust" },
  ],
  history: [
    { prompt: "Oxford University is older than the Aztec _____.", answer: "Empire" },
    { prompt: "Napoleon was actually about average _____ for his era, not short.", answer: "Height" },
    { prompt: "France carried out its last guillotine execution in _____, the same year Star Wars premiered.", answer: "1977" },
    { prompt: "Harvard University was founded before _____ was even invented.", answer: "Calculus" },
    { prompt: "The Eiffel Tower was built as a temporary structure meant to stand only _____ years.", answer: "Twenty" },
    { prompt: "In 1518, hundreds of people in Strasbourg were struck by a mysterious dancing _____.", answer: "Plague" },
    { prompt: "George Washington's famous 'wooden' teeth were never actually made of _____.", answer: "Wood" },
    { prompt: "Early versions of Coca-Cola really did contain traces of _____.", answer: "Cocaine" },
    { prompt: "Betty White was born before sliced _____ was invented.", answer: "Bread" },
    { prompt: "The very first ancient Olympics had a single event: a foot _____.", answer: "Race" },
    { prompt: "The very first product ever scanned by a barcode was a pack of _____.", answer: "Gum" },
    { prompt: "When Britain adopted the modern calendar in 1752, it simply skipped _____ days.", answer: "Eleven" },
  ],
  space: [
    { prompt: "There are more _____ in the universe than grains of sand on all of Earth's beaches.", answer: "Stars" },
    { prompt: "The astronauts' footprints on the Moon could last millions of years because it has no _____.", answer: "Wind" },
    { prompt: "The Sun makes up about 99.8% of the total _____ of the entire solar system.", answer: "Mass" },
    { prompt: "A single teaspoon of neutron star material would weigh about a billion _____.", answer: "Tons" },
    { prompt: "Because sound can't travel through a vacuum, outer space is completely _____.", answer: "Silent" },
    { prompt: "The Moon is slowly drifting away from Earth by a few centimeters every _____.", answer: "Year" },
    { prompt: "Jupiter's Great Red Spot is a single storm larger than the entire planet _____.", answer: "Earth" },
    { prompt: "Saturn's spectacular rings are made almost entirely of chunks of _____.", answer: "Ice" },
    { prompt: "Roughly one million _____ could fit inside the Sun.", answer: "Earths" },
    { prompt: "The hottest planet in our solar system is actually _____, not Mercury.", answer: "Venus" },
    { prompt: "Uranus is tilted so far over that it essentially orbits the Sun on its _____.", answer: "Side" },
    { prompt: "Near the center of our galaxy floats a giant cloud of _____.", answer: "Alcohol" },
    { prompt: "The International Space Station circles the entire Earth about once every 90 _____.", answer: "Minutes" },
  ],
};
for (const c of Object.keys(MORE_LL2)) QUESTIONS[c].push(...MORE_LL2[c]);

const MORE_LL3 = {
  animals: [
    { prompt: "A group of ravens is called an _____.", answer: "Unkindness" },
    { prompt: "A group of crocodiles is called a _____.", answer: "Bask" },
    { prompt: "A group of hippos is called a _____.", answer: "Bloat" },
    { prompt: "A group of zebras is called a _____.", answer: "Dazzle" },
    { prompt: "A group of eagles is called a _____.", answer: "Convocation" },
    { prompt: "A group of kittens is called a _____.", answer: "Kindle" },
    { prompt: "A group of foxes is called a _____.", answer: "Skulk" },
    { prompt: "A group of tigers is called an _____.", answer: "Ambush" },
    { prompt: "A baby swan is called a _____.", answer: "Cygnet" },
    { prompt: "A baby porcupine is called a _____.", answer: "Porcupette" },
    { prompt: "A baby oyster is called a _____.", answer: "Spat" },
    { prompt: "A baby eel is called an _____.", answer: "Elver" },
    { prompt: "An octopus actually has blue _____.", answer: "Blood" },
    { prompt: "The elephant is the only mammal that can't _____.", answer: "Jump" },
    { prompt: "A starfish doesn't have a _____.", answer: "Brain" },
    { prompt: "A slug has this many noses: _____.", answer: "Four" },
    { prompt: "Flamingos aren't born pink — they're actually born _____.", answer: "Grey" },
    { prompt: "Cows form close bonds and get stressed when separated from their _____ friends.", answer: "Best" },
    { prompt: "A shrimp's heart is located in its _____.", answer: "Head" },
    { prompt: "A snail can sleep for up to _____ years at a time.", answer: "Three" },
  ],
  words: [
    { prompt: "The prongs on a fork are called _____.", answer: "Tines" },
    { prompt: "The mark that combines a question mark and an exclamation point is an _____.", answer: "Interrobang" },
    { prompt: "The shapes and lights you see when you rub your closed eyes are called _____.", answer: "Phosphenes" },
    { prompt: "The rumbling growl of a hungry stomach is called _____.", answer: "Borborygmus" },
    { prompt: "The rays of sunlight that stream through gaps in clouds are called _____ rays.", answer: "Crepuscular" },
    { prompt: "The dangly bit of flesh at the back of your throat is the _____.", answer: "Uvula" },
    { prompt: "The gap between your two front teeth is called a _____.", answer: "Diastema" },
    { prompt: "The pleasant smell of an old book is called _____.", answer: "Bibliosmia" },
    { prompt: "The decorative flourish at the end of a signature is called a _____.", answer: "Paraph" },
    { prompt: "The medical name for brain freeze is sphenopalatine _____.", answer: "Ganglioneuralgia" },
    { prompt: "The stringy fibers on a peeled banana are called _____ bundles.", answer: "Phloem" },
    { prompt: "The tiny extra pocket in your jeans was originally made to hold a pocket _____.", answer: "Watch" },
    { prompt: "The vertical bar dividing the panes of a window is called a _____.", answer: "Mullion" },
    { prompt: "The proper name for a hangnail is an _____.", answer: "Agnail" },
    { prompt: "The '&' symbol is properly called an _____.", answer: "Ampersand" },
    { prompt: "The ridges around the edge of a coin are called _____.", answer: "Reeding" },
    { prompt: "The ornamental ball at the very top of a flagpole is called the _____.", answer: "Truck" },
    { prompt: "The little hook-shaped mark beneath the 'ç' is called a _____.", answer: "Cedilla" },
    { prompt: "The tiny bit of paper punched out by a hole puncher is called a _____.", answer: "Chad" },
    { prompt: "The metal plate surrounding a keyhole or door handle is called an _____.", answer: "Escutcheon" },
  ],
  science: [
    { prompt: "Glass isn't a true liquid or crystal — it's an amorphous _____.", answer: "Solid" },
    { prompt: "Humans share roughly 60% of their DNA with _____.", answer: "Bananas" },
    { prompt: "Scientists have successfully made diamonds out of _____.", answer: "Peanut Butter" },
    { prompt: "In theory, folding a single sheet of paper 42 times would make it reach the _____.", answer: "Moon" },
    { prompt: "It occasionally snows in the Sahara _____.", answer: "Desert" },
    { prompt: "Your stomach grows a new _____ every few days so its acid doesn't digest it.", answer: "Lining" },
    { prompt: "Because they barely age, lobsters are sometimes called biologically _____.", answer: "Immortal" },
    { prompt: "Ounce for ounce, human bone is stronger than _____.", answer: "Steel" },
    { prompt: "A ball made of solid _____ bounces higher than a rubber one.", answer: "Glass" },
    { prompt: "The only metal that is liquid at room temperature is _____.", answer: "Mercury" },
    { prompt: "Your nose can distinguish as many as a _____ different smells.", answer: "Trillion" },
    { prompt: "Rubies and sapphires are actually the exact same _____.", answer: "Mineral" },
    { prompt: "Light from the Sun takes about _____ minutes to reach Earth.", answer: "Eight" },
    { prompt: "An average fluffy cumulus cloud weighs around a million _____.", answer: "Pounds" },
    { prompt: "A 'jiffy' is an actual scientific unit of _____.", answer: "Time" },
    { prompt: "There is enough dissolved _____ in the oceans to make everyone on Earth rich.", answer: "Gold" },
    { prompt: "Two pieces of the same metal will fuse together in the vacuum of space — it's called cold _____.", answer: "Welding" },
    { prompt: "As Earth's spin gradually slows, each day is getting slightly _____.", answer: "Longer" },
    { prompt: "Water is unusual because it expands rather than shrinks when it _____.", answer: "Freezes" },
    { prompt: "The average human body contains enough iron to forge a small _____.", answer: "Nail" },
  ],
  food: [
    { prompt: "Honey is one of the only foods that essentially never _____.", answer: "Spoils" },
    { prompt: "Lobster was once considered cheap food and was fed to prisoners and _____.", answer: "Servants" },
    { prompt: "A fresh, ripe cranberry will actually _____ when you drop it.", answer: "Bounce" },
    { prompt: "For centuries, wealthy Europeans feared the tomato was _____.", answer: "Poisonous" },
    { prompt: "Almonds are actually seeds from a fruit closely related to the _____.", answer: "Peach" },
    { prompt: "Pound cake got its name from using a pound each of its four _____.", answer: "Ingredients" },
    { prompt: "Bagged 'baby carrots' are usually just big carrots cut down and _____.", answer: "Shaped" },
    { prompt: "The leaves of the rhubarb plant are actually mildly _____.", answer: "Toxic" },
    { prompt: "The world's priciest coffee, Kopi Luwak, is made from beans passed through a _____.", answer: "Civet" },
    { prompt: "Nutella uses roughly a quarter of the entire world's supply of _____.", answer: "Hazelnuts" },
    { prompt: "Marshmallows were originally made from the sap of the marsh _____ plant.", answer: "Mallow" },
    { prompt: "The world's most expensive spice, saffron, is harvested from a type of _____ flower.", answer: "Crocus" },
    { prompt: "Under ultraviolet light, ripe bananas glow bright _____.", answer: "Blue" },
    { prompt: "In medical emergencies, sterile coconut _____ has been used as an IV fluid.", answer: "Water" },
    { prompt: "Cut grapes can spark and create tiny bursts of _____ in a microwave.", answer: "Plasma" },
    { prompt: "The red liquid in a package of raw steak isn't blood — it's _____.", answer: "Myoglobin" },
    { prompt: "The modern orange is actually a hybrid of a pomelo and a _____.", answer: "Mandarin" },
    { prompt: "Raw cashews are never sold in the shell because it holds the same irritant as poison _____.", answer: "Ivy" },
    { prompt: "Botanically, apples belong to the same plant family as _____.", answer: "Roses" },
  ],
  history: [
    { prompt: "Ancient Romans famously used _____ as a mouthwash to whiten their teeth.", answer: "Urine" },
    { prompt: "The Wright brothers' first flight was shorter than the wingspan of a Boeing _____.", answer: "747" },
    { prompt: "Woolly mammoths were still alive when the Egyptians were building the Great Pyramid of _____.", answer: "Giza" },
    { prompt: "Anne Frank and Martin Luther King Jr. were both born in the year _____.", answer: "1929" },
    { prompt: "Abraham Lincoln was a skilled _____, later inducted into the Wrestling Hall of Fame.", answer: "Wrestler" },
    { prompt: "After being shot in 1912, Theodore Roosevelt still delivered a 90-minute _____.", answer: "Speech" },
    { prompt: "The Roman Colosseum could reportedly be flooded to stage mock _____ battles.", answer: "Naval" },
    { prompt: "Viking Leif Erikson reached North America roughly 500 years before _____.", answer: "Columbus" },
    { prompt: "The word 'quarantine' comes from the Italian words for _____ days.", answer: "Forty" },
    { prompt: "Roughly 1 in 200 men alive today are believed to be descended from Genghis _____.", answer: "Khan" },
    { prompt: "In the 1700s, pineapples were so pricey that people _____ them just to show off.", answer: "Rented" },
    { prompt: "The Statue of Liberty was originally the shiny brown color of bare _____.", answer: "Copper" },
    { prompt: "Despite its name, the Hundred Years' War actually lasted about 116 _____.", answer: "Years" },
    { prompt: "As a Member of Parliament, Isaac Newton reportedly spoke only once — to ask that a _____ be closed.", answer: "Window" },
    { prompt: "Contrary to legend, the Great Wall of China is not actually visible from _____.", answer: "Space" },
    { prompt: "Ancient Roman concrete actually grows stronger when exposed to _____.", answer: "Seawater" },
    { prompt: "The world's first computer programmer was a woman named Ada _____.", answer: "Lovelace" },
    { prompt: "The word 'salary' comes from the Latin word for _____.", answer: "Salt" },
    { prompt: "Albert Einstein was once formally offered the presidency of _____.", answer: "Israel" },
    { prompt: "In 1919, a giant wave of _____ flooded a Boston neighborhood and killed 21 people.", answer: "Molasses" },
  ],
  space: [
    { prompt: "Venus is the oddball planet that spins _____, opposite to almost every other planet.", answer: "Backward" },
    { prompt: "A single year on Mercury lasts only about 88 Earth _____.", answer: "Days" },
    { prompt: "Sunsets seen from the surface of Mars actually appear _____.", answer: "Blue" },
    { prompt: "Astronauts say space smells like seared steak or burnt _____.", answer: "Gunpowder" },
    { prompt: "Sunlight takes about eight _____ to travel all the way to Earth.", answer: "Minutes" },
    { prompt: "A comet's glowing tail always points _____ from the Sun.", answer: "Away" },
    { prompt: "Pluto still hasn't finished a single _____ of the Sun since its discovery in 1930.", answer: "Orbit" },
    { prompt: "Mercury and Venus are the only two planets with no _____.", answer: "Moons" },
    { prompt: "Astronauts aboard the Space Station see roughly 16 _____ every single day.", answer: "Sunrises" },
    { prompt: "Our Milky Way is on a slow collision course with the _____ galaxy.", answer: "Andromeda" },
    { prompt: "The Moon has its own gentle tremors, which scientists call _____.", answer: "Moonquakes" },
    { prompt: "Despite being the biggest planet, Jupiter has the shortest day, spinning once every 10 _____.", answer: "Hours" },
    { prompt: "Saturn's moon Titan has rivers and lakes filled with liquid _____.", answer: "Methane" },
    { prompt: "Jupiter's moon Europa is thought to hide a vast liquid _____ beneath its icy crust.", answer: "Ocean" },
    { prompt: "Seen from space, the Sun is actually the color _____, not yellow.", answer: "White" },
    { prompt: "Some planets, called rogue planets, drift through the galaxy without a _____.", answer: "Star" },
    { prompt: "Halley's Comet only swings past Earth once every 76 _____.", answer: "Years" },
    { prompt: "Collapsed stars called pulsars can spin hundreds of times every _____.", answer: "Second" },
    { prompt: "Jupiter is so massive that it and the Sun actually orbit a point just _____ the Sun.", answer: "Outside" },
    { prompt: "Mars has two tiny potato-shaped moons named Phobos and _____.", answer: "Deimos" },
  ],
};
for (const c of Object.keys(MORE_LL3)) if (QUESTIONS[c]) QUESTIONS[c].push(...MORE_LL3[c]);


const CATEGORY_LABEL = { mixed: "Mixed", animals: "Animals", words: "Words", science: "Science", food: "Food", history: "History", space: "Space" };

const WRITE_MS = 40_000;
const CHOOSE_MS = 30_000;
const REVEAL_MS = 7_000;

function beginWrite(state, ctx) {
  state.screen = "write";
  state.lies = {}; // playerId -> text
  state.picks = {}; // playerId -> optionId
  state.endsAt = ctx.now() + WRITE_MS;
  ctx.sync();
  const wDeadline = state.endsAt;
  state.timer = ctx.after(WRITE_MS, () => { if (state.screen === "write" && state.endsAt === wDeadline) timesUp(state, ctx, () => beginChoose(state, ctx)); });
  countdown(state, ctx, "write");
}

function beginChoose(state, ctx) {
  if (state.screen !== "write" && state.screen !== "timesup") return;
  const q = state.questions[state.index];
  const truthKey = normalize(q.answer);
  const options = [{ id: "truth", text: q.answer, truth: true, authors: [] }];

  for (const [pid, text] of Object.entries(state.lies)) {
    if (normalize(text) === truthKey) {
      // Accidentally guessed the truth — reward and don't add as a lie.
      ctx.award(pid, 500);
      state.accidental = state.accidental || [];
      state.accidental.push(pid);
      continue;
    }
    // Merge identical lies so duplicates share credit.
    const existing = options.find((o) => !o.truth && normalize(o.text) === normalize(text));
    if (existing) existing.authors.push(pid);
    else options.push({ id: `l_${pid}`, text: text.trim(), truth: false, authors: [pid] });
  }

  state.options = shuffle(options);
  state.screen = "choose";
  state.endsAt = ctx.now() + CHOOSE_MS;
  ctx.sync();
  const cDeadline = state.endsAt;
  state.timer = ctx.after(CHOOSE_MS, () => { if (state.screen === "choose" && state.endsAt === cDeadline) timesUp(state, ctx, () => reveal(state, ctx)); });
  countdown(state, ctx, "choose");
}

function reveal(state, ctx) {
  if (state.screen !== "choose" && state.screen !== "timesup") return;
  state.screen = "reveal";
  const byOption = {};
  for (const o of state.options) byOption[o.id] = [];
  for (const [pid, oid] of Object.entries(state.picks)) {
    if (byOption[oid]) byOption[oid].push(pid);
  }
  // Score: find truth → +1000. Fool someone with your lie → +500 each.
  // Final round is worth double.
  const mult = state.questions.length > 1 && state.index === state.questions.length - 1 ? 2 : 1;
  for (const o of state.options) {
    const pickers = byOption[o.id] || [];
    if (o.truth) {
      for (const pid of pickers) ctx.award(pid, 1000 * mult);
    } else {
      for (const author of o.authors) ctx.award(author, 500 * pickers.length * mult);
    }
  }
  state.revealData = state.options.map((o) => ({
    text: o.text,
    truth: o.truth,
    authors: o.authors.map((a) => ctx.player(a)?.name).filter(Boolean),
    pickedBy: (byOption[o.id] || []).map((a) => ctx.player(a)?.name).filter(Boolean),
  }));
  ctx.sync();

  ctx.after(REVEAL_MS, () => {
    state.index++;
    if (state.index >= state.questions.length) {
      state.screen = "final";
      ctx.sync();
    } else {
      beginWrite(state, ctx);
    }
  });
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
  id: "liarLiar",
  name: "Liar Liar",
  emoji: "🤥",
  blurb: "Write a convincing lie, then spot the real answer.",
  minPlayers: 2,
  howTo: [
    "A tricky question with a missing answer appears.",
    "On your phone, make up a believable fake answer to fool everyone.",
    "All the lies are mixed in with the real answer.",
    "Pick the truth to score — and earn points for every player your lie fools.",
    "Watch out — the final round is worth DOUBLE points!",
  ],
  options: [
    {
      key: "category", label: "Category", default: "mixed",
      choices: [
        { id: "mixed", label: "Mixed" },
        { id: "animals", label: "Animals" },
        { id: "words", label: "Words" },
        { id: "science", label: "Science" },
        { id: "food", label: "Food" },
        { id: "history", label: "History" },
        { id: "space", label: "Space" },
      ],
    },
    {
      key: "rounds", label: "Rounds", default: "4",
      choices: [{ id: "3", label: "3" }, { id: "4", label: "4" }, { id: "6", label: "6" }],
    },
  ],

  start(state, ctx, config = {}) {
    const cat = QUESTIONS[config.category] ? config.category : "mixed";
    const pool = cat === "mixed" ? Object.values(QUESTIONS).flat() : QUESTIONS[cat];
    const n = parseInt(config.rounds, 10) || 4;
    state.category = CATEGORY_LABEL[cat] || "Mixed";
    state.questions = sample(pool, Math.min(n, pool.length));
    state.index = 0;
    countIn(state, ctx, () => beginWrite(state, ctx));
  },

  onAction(state, playerId, action, ctx) {
    if (action.type === "lie" && state.screen === "write") {
      const text = (action.text || "").toString().trim().slice(0, 40);
      if (text) state.lies[playerId] = text;
      if (ctx.players().every((p) => state.lies[p.id])) beginChoose(state, ctx);
      else ctx.sync();
    } else if (action.type === "pick" && state.screen === "choose") {
      const opt = state.options.find((o) => o.id === action.optionId);
      if (!opt) return;
      if (opt.authors.includes(playerId)) return; // can't pick your own lie
      state.picks[playerId] = action.optionId;
      if (ctx.players().every((p) => state.picks[p.id] || (state.options.find(o => o.id === `l_${p.id}`)))) {
        // everyone who can pick has picked
        const canPick = ctx.players().filter((p) => !(state.accidental || []).includes(p.id));
        if (canPick.every((p) => state.picks[p.id])) reveal(state, ctx);
        else ctx.sync();
      } else ctx.sync();
    }
  },

  hostView(state, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    const q = state.questions[state.index];
    const timeLeft = Math.max(0, Math.ceil((state.endsAt - ctx.now()) / 1000));
    if (state.screen === "final") {
      return { screen: "final", leaderboard: ctx.gameLeaderboard() };
    }
    const view = {
      screen: state.screen,
      round: state.index + 1,
      total: state.questions.length,
      prompt: q.prompt,
      timeLeft,
      doubleRound: state.index === state.questions.length - 1 && state.questions.length > 1,
    };
    if (state.screen === "write") {
      view.submitted = Object.keys(state.lies).length;
      view.players = ctx.players().length;
    } else if (state.screen === "choose") {
      view.options = state.options.map((o) => ({ id: o.id, text: o.text }));
      view.picked = Object.keys(state.picks).length;
      view.players = ctx.players().length;
    } else if (state.screen === "reveal") {
      view.answer = q.answer;
      view.results = state.revealData;
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
    const view = { screen: state.screen, doubleRound: state.index === state.questions.length - 1 && state.questions.length > 1 };
    if (state.screen === "write") {
      view.prompt = state.questions[state.index].prompt;
      view.submitted = state.lies[playerId] != null;
    } else if (state.screen === "choose") {
      view.options = state.options
        .filter((o) => !o.authors.includes(playerId))
        .map((o) => ({ id: o.id, text: o.text }));
      view.myPick = state.picks[playerId] || null;
      view.isLiarOfTruth = (state.accidental || []).includes(playerId);
    } else if (state.screen === "reveal") {
      view.correct = state.picks[playerId]
        ? state.options.find((o) => o.id === state.picks[playerId])?.truth
        : false;
    }
    return view;
  },
};
