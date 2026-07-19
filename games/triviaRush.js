import { shuffle, sample, countIn, timesUp } from "./util.js";

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
  funmix: "Fun Mix", disney: "Disney", starwars: "Star Wars", pokemon: "Pokémon", gaming: "Gaming",
};
// Two families: general-knowledge categories vs pop-culture "fun" categories.
// "Mixed" draws only from GENERAL so fandom trivia never leaks into the general
// pool; "Fun Mix" draws only from FUN.
const GENERAL_CATS = ["science", "geography", "history", "animals", "entertainment", "sports", "food"];
const FUN_CATS = ["disney", "starwars", "pokemon", "gaming"];

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

// Second content batch — deepens every category so single-category games don't
// repeat quickly (mixed pool grows to ~175 questions).
const MORE2 = {
  science: [
    { q: "What is the chemical symbol for oxygen?", options: ["Ox", "O", "Om", "Og"], answer: 1 },
    { q: "What is the closest star to Earth?", options: ["The Sun", "Proxima Centauri", "Sirius", "Polaris"], answer: 0 },
    { q: "What gas do humans need to breathe to survive?", options: ["Nitrogen", "Carbon dioxide", "Oxygen", "Helium"], answer: 2 },
    { q: "What is the process by which plants make food using sunlight?", options: ["Respiration", "Digestion", "Photosynthesis", "Evaporation"], answer: 2 },
    { q: "How many colors are in a rainbow?", options: ["5", "6", "7", "8"], answer: 2 },
    { q: "What organ pumps blood around the human body?", options: ["Lungs", "Heart", "Liver", "Brain"], answer: 1 },
    { q: "Which blood cells help fight infection?", options: ["Red blood cells", "White blood cells", "Platelets", "Plasma"], answer: 1 },
    { q: "What is the chemical symbol for sodium?", options: ["So", "Na", "Sd", "Sn"], answer: 1 },
    { q: "What is the study of living things called?", options: ["Geology", "Chemistry", "Biology", "Physics"], answer: 2 },
    { q: "Sound cannot travel through which of these?", options: ["Water", "Air", "A vacuum", "Metal"], answer: 2 },
  ],
  geography: [
    { q: "What is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: 1 },
    { q: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: 2 },
    { q: "The Eiffel Tower is located in which city?", options: ["London", "Paris", "Rome", "Madrid"], answer: 1 },
    { q: "Which country is shaped like a boot?", options: ["Spain", "Greece", "Italy", "Portugal"], answer: 2 },
    { q: "What is the capital of Egypt?", options: ["Cairo", "Alexandria", "Giza", "Luxor"], answer: 0 },
    { q: "Which continent is the coldest?", options: ["Europe", "Asia", "Antarctica", "South America"], answer: 2 },
    { q: "What is the capital of Germany?", options: ["Munich", "Hamburg", "Frankfurt", "Berlin"], answer: 3 },
    { q: "Which country has the most people in the world?", options: ["China", "India", "United States", "Indonesia"], answer: 1 },
    { q: "What is the capital of Spain?", options: ["Barcelona", "Madrid", "Seville", "Valencia"], answer: 1 },
    { q: "Which US city is known as the 'Big Apple'?", options: ["Los Angeles", "Chicago", "New York City", "Boston"], answer: 2 },
  ],
  history: [
    { q: "Who was the famous queen of ancient Egypt?", options: ["Nefertiti", "Cleopatra", "Hatshepsut", "Isis"], answer: 1 },
    { q: "The Statue of Liberty was a gift to the US from which country?", options: ["Britain", "Spain", "France", "Italy"], answer: 2 },
    { q: "Which US president is on the one-dollar bill?", options: ["Abraham Lincoln", "George Washington", "Thomas Jefferson", "Benjamin Franklin"], answer: 1 },
    { q: "In which country was the Great Wall built?", options: ["Japan", "China", "India", "Mongolia"], answer: 1 },
    { q: "Who was the leader of Nazi Germany during World War II?", options: ["Mussolini", "Stalin", "Hitler", "Franco"], answer: 2 },
    { q: "The Renaissance began in which country?", options: ["France", "England", "Germany", "Italy"], answer: 3 },
    { q: "Which country is home to the ancient Great Pyramid of Giza?", options: ["Greece", "Egypt", "Mexico", "Peru"], answer: 1 },
    { q: "Who was assassinated in Dallas in 1963?", options: ["Abraham Lincoln", "John F. Kennedy", "Martin Luther King Jr.", "Robert Kennedy"], answer: 1 },
    { q: "What was the name of the ship that brought the Pilgrims to America?", options: ["Santa Maria", "Mayflower", "Endeavour", "Beagle"], answer: 1 },
    { q: "Which wall fell in 1989, reuniting a divided city?", options: ["Berlin Wall", "Great Wall", "Hadrian's Wall", "Wailing Wall"], answer: 0 },
  ],
  animals: [
    { q: "What is a baby dog called?", options: ["Kitten", "Puppy", "Cub", "Foal"], answer: 1 },
    { q: "Which animal is known for changing the color of its skin?", options: ["Chameleon", "Zebra", "Panda", "Kangaroo"], answer: 0 },
    { q: "What is the largest species of shark?", options: ["Great white shark", "Whale shark", "Hammerhead shark", "Tiger shark"], answer: 1 },
    { q: "Which animal is famous for its black and white stripes?", options: ["Leopard", "Zebra", "Cheetah", "Hyena"], answer: 1 },
    { q: "What do caterpillars turn into?", options: ["Beetles", "Spiders", "Butterflies", "Bees"], answer: 2 },
    { q: "Which sea creature has eight arms?", options: ["Squid", "Jellyfish", "Starfish", "Octopus"], answer: 3 },
    { q: "What is the largest big cat in the world?", options: ["Lion", "Tiger", "Jaguar", "Leopard"], answer: 1 },
    { q: "Which animal sleeps hanging upside down?", options: ["Owl", "Bat", "Sloth", "Squirrel"], answer: 1 },
    { q: "What do you call an animal that eats only plants?", options: ["Carnivore", "Herbivore", "Omnivore", "Insectivore"], answer: 1 },
    { q: "Which bird is known for saying 'hoot' at night?", options: ["Robin", "Owl", "Crow", "Dove"], answer: 1 },
  ],
  entertainment: [
    { q: "What is the name of the coffee shop in the TV show 'Friends'?", options: ["Central Perk", "The Grind", "Java Joe's", "Cafe Nervosa"], answer: 0 },
    { q: "Which movie features a shark terrorizing a beach town?", options: ["Jaws", "Titanic", "Aquaman", "Free Willy"], answer: 0 },
    { q: "In Star Wars, who is Luke Skywalker's father?", options: ["Obi-Wan Kenobi", "Yoda", "Darth Vader", "Han Solo"], answer: 2 },
    { q: "What is the name of Woody's owner in 'Toy Story'?", options: ["Andy", "Sid", "Bonnie", "Al"], answer: 0 },
    { q: "Which band sang 'Hey Jude'?", options: ["The Rolling Stones", "The Beatles", "Queen", "The Who"], answer: 1 },
    { q: "In 'Aladdin', what is the name of the pet monkey?", options: ["Abu", "Iago", "Rajah", "Jafar"], answer: 0 },
    { q: "What is the name of the fairy in 'Peter Pan'?", options: ["Wendy", "Tinker Bell", "Cinderella", "Thumbelina"], answer: 1 },
    { q: "Which superhero swings between buildings using webs?", options: ["Batman", "Superman", "Spider-Man", "Thor"], answer: 2 },
    { q: "What color are the Minions in 'Despicable Me'?", options: ["Green", "Blue", "Yellow", "Orange"], answer: 2 },
    { q: "Which movie features a young lion named Simba?", options: ["Madagascar", "The Lion King", "Zootopia", "Kung Fu Panda"], answer: 1 },
  ],
  sports: [
    { q: "How many players are on a volleyball team on the court?", options: ["5", "6", "7", "8"], answer: 1 },
    { q: "In tennis, what is a score of zero called?", options: ["Nil", "Love", "Duck", "Blank"], answer: 1 },
    { q: "Which country hosts the Wimbledon tennis tournament?", options: ["United States", "France", "England", "Australia"], answer: 2 },
    { q: "What shape is a soccer goal net opening?", options: ["Circle", "Triangle", "Rectangle", "Oval"], answer: 2 },
    { q: "In boxing, what does 'KO' stand for?", options: ["Knock Out", "Keep On", "Kick Off", "Knee Out"], answer: 0 },
    { q: "How many bases are there in baseball?", options: ["3", "4", "5", "6"], answer: 1 },
    { q: "Which sport features terms like 'birdie' and 'bogey'?", options: ["Tennis", "Golf", "Cricket", "Bowling"], answer: 1 },
    { q: "In which sport do teams compete for the Stanley Cup?", options: ["Basketball", "Ice hockey", "Baseball", "Football"], answer: 1 },
    { q: "What is the maximum score with a single dart throw on a standard board?", options: ["50", "60", "40", "20"], answer: 1 },
    { q: "How long is a marathon, roughly?", options: ["10 miles", "26 miles", "50 miles", "100 miles"], answer: 1 },
  ],
  food: [
    { q: "What is the main ingredient in an omelette?", options: ["Cheese", "Eggs", "Flour", "Milk"], answer: 1 },
    { q: "Which drink is made from roasted beans and is popular in the morning?", options: ["Tea", "Coffee", "Juice", "Cocoa"], answer: 1 },
    { q: "What is traditionally served on top of a pizza?", options: ["Chocolate", "Cheese", "Jam", "Icing"], answer: 1 },
    { q: "Which fruit is yellow and curved?", options: ["Apple", "Banana", "Grape", "Cherry"], answer: 1 },
    { q: "What food is a 'baguette' a type of?", options: ["Cheese", "Bread", "Pasta", "Soup"], answer: 1 },
    { q: "Which nut is used to make peanut butter?", options: ["Almond", "Walnut", "Peanut", "Cashew"], answer: 2 },
    { q: "What is the frozen dessert often served in a cone?", options: ["Cake", "Ice cream", "Pudding", "Pie"], answer: 1 },
    { q: "Which vegetable is orange and loved by rabbits?", options: ["Broccoli", "Carrot", "Celery", "Cucumber"], answer: 1 },
    { q: "What dairy product is churned to make butter?", options: ["Yogurt", "Cream", "Cheese", "Ice"], answer: 1 },
    { q: "Which spice gives curry its yellow color?", options: ["Paprika", "Turmeric", "Cinnamon", "Ginger"], answer: 1 },
  ],
};
for (const c of Object.keys(MORE2)) if (QUESTIONS[c]) QUESTIONS[c].push(...MORE2[c]);

// Pop-culture categories — new selectable categories that also feed the Mixed pool.
// Pokémon includes "Who's that Pokémon?" silhouette rounds: a question with a
// `silhouette` dex number renders the official artwork as a black silhouette
// (host applies a brightness(0) filter) that reveals in full color on the answer.
const POP = {
  disney: [
    { q: "What is the name of the snowman in Frozen?", options: ["Olaf", "Sven", "Kristoff", "Hans"], answer: 0 },
    { q: "In The Lion King, who is Simba's father?", options: ["Scar", "Zazu", "Rafiki", "Mufasa"], answer: 3 },
    { q: "In Toy Story, what type of toy is Woody?", options: ["Astronaut", "Dinosaur", "Cowboy", "Pig"], answer: 2 },
    { q: "In Moana, what kind of animal is Heihei?", options: ["Rooster", "Pig", "Goat", "Crab"], answer: 0 },
    { q: "What is the family's surname in Encanto?", options: ["Herrera", "Madrigal", "Guevara", "Morales"], answer: 1 },
    { q: "In Finding Nemo, what type of fish is Nemo?", options: ["Blue tang", "Goldfish", "Clownfish", "Shark"], answer: 2 },
    { q: "What is the name of the mermaid in The Little Mermaid?", options: ["Jasmine", "Aurora", "Tiana", "Ariel"], answer: 3 },
    { q: "In Aladdin, where does the Genie live?", options: ["A lamp", "A ring", "A bottle", "A cave"], answer: 0 },
    { q: "In Beauty and the Beast, which character is the enchanted candelabra?", options: ["Cogsworth", "Lumière", "Mrs. Potts", "Chip"], answer: 1 },
    { q: "In Toy Story, which character is a space ranger action figure?", options: ["Woody", "Rex", "Buzz Lightyear", "Hamm"], answer: 2 },
    { q: "Which hit song is from the movie Encanto?", options: ["How Far I'll Go", "Let It Go", "Surface Pressure", "We Don't Talk About Bruno"], answer: 3 },
    { q: "In Frozen, who is Elsa's younger sister?", options: ["Merida", "Anna", "Rapunzel", "Belle"], answer: 1 },
  ],
  starwars: [
    { q: "Who is revealed to be Luke Skywalker's father?", options: ["Obi-Wan Kenobi", "Darth Vader", "Yoda", "Han Solo"], answer: 1 },
    { q: "What is the name of Han Solo's ship?", options: ["X-Wing", "Star Destroyer", "Millennium Falcon", "Star Cruiser"], answer: 2 },
    { q: "What is the name of the small, green Jedi Master?", options: ["Mace Windu", "Yoda", "Qui-Gon Jinn", "Palpatine"], answer: 1 },
    { q: "What kind of creature is Chewbacca?", options: ["Wookiee", "Ewok", "Jawa", "Droid"], answer: 0 },
    { q: "Which weapon is associated with the Jedi?", options: ["Blaster", "Lightsaber", "Bowcaster", "Thermal detonator"], answer: 1 },
    { q: "Who trained Anakin Skywalker as a Padawan?", options: ["Yoda", "Mace Windu", "Obi-Wan Kenobi", "Count Dooku"], answer: 2 },
    { q: "On which desert planet did Luke Skywalker grow up?", options: ["Hoth", "Endor", "Naboo", "Tatooine"], answer: 3 },
    { q: "In the sequel trilogy, who is the scavenger heroine?", options: ["Rey", "Jyn", "Padmé", "Leia"], answer: 0 },
    { q: "Which of these is the golden protocol droid?", options: ["R2-D2", "BB-8", "K-2SO", "C-3PO"], answer: 3 },
    { q: "What is the evil galactic regime in the original trilogy called?", options: ["The Republic", "The Rebellion", "The Empire", "The Resistance"], answer: 2 },
    { q: "What is Darth Vader's real name?", options: ["Anakin Skywalker", "Ben Solo", "Sheev Palpatine", "Boba Fett"], answer: 0 },
    { q: "In the sequel trilogy, who is the masked villain and son of Han and Leia?", options: ["Finn", "Poe Dameron", "Snoke", "Kylo Ren"], answer: 3 },
  ],
  pokemon: [
    { q: "What type is Pikachu?", options: ["Fire", "Grass", "Water", "Electric"], answer: 3 },
    { q: "What does Charmander evolve into first?", options: ["Charizard", "Charmeleon", "Wartortle", "Ivysaur"], answer: 1 },
    { q: "What is Charmander's final evolution?", options: ["Blastoise", "Venusaur", "Charizard", "Charmeleon"], answer: 2 },
    { q: "Which Pokémon is the mascot of the franchise?", options: ["Pikachu", "Charizard", "Mewtwo", "Eevee"], answer: 0 },
    { q: "What is Bulbasaur's primary type?", options: ["Fire", "Water", "Electric", "Grass"], answer: 3 },
    { q: "What type is Squirtle?", options: ["Fire", "Water", "Grass", "Rock"], answer: 1 },
    { q: "What item is used to catch a Pokémon?", options: ["Potion", "Berry", "Poké Ball", "Gym Badge"], answer: 2 },
    { q: "Eevee is famous for having many of what?", options: ["Evolutions", "Types", "Moves", "Colors"], answer: 0 },
    { q: "Which legendary Pokémon was created from Mew's DNA?", options: ["Lugia", "Mewtwo", "Rayquaza", "Zapdos"], answer: 1 },
    { q: "In the anime, who is the main trainer traveling with Pikachu?", options: ["Brock", "Misty", "Gary", "Ash Ketchum"], answer: 3 },
    { q: "Which is the Water-type starter in the Kanto region?", options: ["Squirtle", "Charmander", "Bulbasaur", "Pikachu"], answer: 0 },
    { q: "What color is Pikachu?", options: ["Red", "Blue", "Yellow", "Green"], answer: 2 },
    { q: "Who's that Pokémon?", silhouette: 25, options: ["Pikachu", "Raichu", "Pichu", "Plusle"], answer: 0 },
    { q: "Who's that Pokémon?", silhouette: 6, options: ["Charmeleon", "Charizard", "Dragonite", "Salamence"], answer: 1 },
    { q: "Who's that Pokémon?", silhouette: 1, options: ["Chikorita", "Oddish", "Bulbasaur", "Treecko"], answer: 2 },
    { q: "Who's that Pokémon?", silhouette: 7, options: ["Totodile", "Mudkip", "Piplup", "Squirtle"], answer: 3 },
    { q: "Who's that Pokémon?", silhouette: 39, options: ["Jigglypuff", "Clefairy", "Chansey", "Wigglytuff"], answer: 0 },
    { q: "Who's that Pokémon?", silhouette: 143, options: ["Munchlax", "Snorlax", "Golem", "Rhydon"], answer: 1 },
    { q: "Who's that Pokémon?", silhouette: 94, options: ["Haunter", "Misdreavus", "Gengar", "Banette"], answer: 2 },
    { q: "Who's that Pokémon?", silhouette: 133, options: ["Growlithe", "Vulpix", "Furret", "Eevee"], answer: 3 },
    { q: "Who's that Pokémon?", silhouette: 150, options: ["Mewtwo", "Mew", "Deoxys", "Lugia"], answer: 0 },
    { q: "Who's that Pokémon?", silhouette: 129, options: ["Feebas", "Magikarp", "Goldeen", "Remoraid"], answer: 1 },
  ],
  gaming: [
    { q: "What is Mario's profession?", options: ["Chef", "Doctor", "Carpenter", "Plumber"], answer: 3 },
    { q: "What is the name of Mario's brother?", options: ["Luigi", "Wario", "Toad", "Yoshi"], answer: 0 },
    { q: "In The Legend of Zelda, what is the name of the hero?", options: ["Zelda", "Ganon", "Link", "Epona"], answer: 2 },
    { q: "In Minecraft, which hostile creature explodes?", options: ["Zombie", "Creeper", "Skeleton", "Enderman"], answer: 1 },
    { q: "What color is Sonic the Hedgehog?", options: ["Red", "Green", "Yellow", "Blue"], answer: 3 },
    { q: "In Pac-Man, what does Pac-Man eat to turn the tables on the ghosts?", options: ["Power pellets", "Cherries", "Keys", "Bells"], answer: 0 },
    { q: "What are the falling shapes in Tetris called?", options: ["Spheres", "Tetrominoes", "Triangles", "Stars"], answer: 1 },
    { q: "In Fortnite, what closing hazard forces players together?", options: ["The Fog", "The Wall", "The Storm", "The Grid"], answer: 2 },
    { q: "Which company created Super Mario?", options: ["Sega", "Sony", "Microsoft", "Nintendo"], answer: 3 },
    { q: "Which gem is used to craft some of the strongest tools in Minecraft?", options: ["Diamond", "Ruby", "Emerald", "Sapphire"], answer: 0 },
    { q: "Which princess does Mario often rescue?", options: ["Daisy", "Peach", "Rosalina", "Zelda"], answer: 1 },
    { q: "In Mario games, collecting 100 of what gives an extra life?", options: ["Stars", "Mushrooms", "Coins", "Flowers"], answer: 2 },
  ],
};
Object.assign(QUESTIONS, POP);

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
        { id: "mixed", label: "Mixed", group: "General Knowledge" },
        { id: "science", label: "Science", group: "General Knowledge" },
        { id: "geography", label: "Geography", group: "General Knowledge" },
        { id: "history", label: "History", group: "General Knowledge" },
        { id: "animals", label: "Animals", group: "General Knowledge" },
        { id: "entertainment", label: "Screen & Fun", group: "General Knowledge" },
        { id: "sports", label: "Sports", group: "General Knowledge" },
        { id: "food", label: "Food & Drink", group: "General Knowledge" },
        { id: "funmix", label: "Fun Mix", group: "Fun & Fandom" },
        { id: "disney", label: "Disney", group: "Fun & Fandom" },
        { id: "starwars", label: "Star Wars", group: "Fun & Fandom" },
        { id: "pokemon", label: "Pokémon", group: "Fun & Fandom" },
        { id: "gaming", label: "Gaming", group: "Fun & Fandom" },
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
    let cat = config.category || "mixed";
    let pool;
    if (cat === "funmix") pool = FUN_CATS.flatMap((c) => QUESTIONS[c] || []);
    else if (cat !== "mixed" && QUESTIONS[cat]) pool = QUESTIONS[cat];
    else { cat = "mixed"; pool = GENERAL_CATS.flatMap((c) => QUESTIONS[c] || []); }
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
      return { screen: "final", leaderboard: ctx.gameLeaderboard() };
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
      silhouette: q.silhouette != null ? q.silhouette : null,
      answerName: state.screen === "reveal" && q.silhouette != null ? q.options[q.answer] : null,
      timeLeft,
      answered: Object.keys(state.answers).length,
      players: ctx.players().length,
      correctIndex: state.screen === "reveal" ? q.answer : null,
      counts: state.screen === "reveal" ? counts : null,
      leaderboard: state.screen === "reveal" ? ctx.gameLeaderboard() : null,
    };
  },

  playerView(state, playerId, ctx) {
    if (state.screen === "countin") return { screen: "countin", count: state.countin };
    if (state.screen === "timesup") return { screen: "timesup", label: state.timesUpLabel };
    const q = state.questions[state.index];
    if (state.screen === "final") {
      const r = ctx.gameRank(playerId);
      return { screen: "final", rank: r.rank, total: r.total, tied: r.tied, me: ctx.gameScore(playerId) };
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
