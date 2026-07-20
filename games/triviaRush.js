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

const MORE3 = {
  science: [
    { q: "What is the chemical symbol for iron?", options: ["Fe","Ir","Zn","Fr"], answer: 0 },
    { q: "Which planet is famous for its prominent rings?", options: ["Jupiter","Saturn","Mars","Venus"], answer: 1 },
    { q: "Which gas makes up most of Earth's atmosphere?", options: ["Oxygen","Carbon dioxide","Nitrogen","Hydrogen"], answer: 2 },
    { q: "What is the chemical symbol for carbon?", options: ["Ca","Co","Cr","C"], answer: 3 },
    { q: "Which organ filters blood and produces urine?", options: ["Kidney","Liver","Lung","Heart"], answer: 0 },
    { q: "Which scientist developed the theory of relativity?", options: ["Newton","Einstein","Darwin","Galileo"], answer: 1 },
    { q: "What force resists motion between two surfaces?", options: ["Gravity","Magnetism","Friction","Tension"], answer: 2 },
    { q: "What is the largest organ of the human body?", options: ["Liver","Brain","Heart","Skin"], answer: 3 },
    { q: "Which metal is liquid at room temperature?", options: ["Mercury","Iron","Copper","Aluminum"], answer: 0 },
    { q: "Which planet has a famous 'Great Red Spot'?", options: ["Mars","Jupiter","Saturn","Neptune"], answer: 1 },
    { q: "What is the process of a liquid turning into a gas called?", options: ["Condensation","Melting","Evaporation","Freezing"], answer: 2 },
    { q: "What is the smallest unit of an element that keeps its properties?", options: ["Cell","Molecule","Proton","Atom"], answer: 3 },
    { q: "How many chambers does the human heart have?", options: ["4","2","3","6"], answer: 0 },
    { q: "How many teeth does a typical adult human have?", options: ["28","32","30","36"], answer: 1 },
    { q: "Which vitamin does the body make from sunlight?", options: ["Vitamin A","Vitamin C","Vitamin D","Vitamin K"], answer: 2 },
    { q: "What is molten rock beneath the Earth's surface called?", options: ["Lava","Ash","Basalt","Magma"], answer: 3 },
    { q: "Which scientist is famous for the laws of motion and gravity?", options: ["Newton","Einstein","Galileo","Tesla"], answer: 0 },
    { q: "What is the study of weather called?", options: ["Geology","Meteorology","Astronomy","Ecology"], answer: 1 },
    { q: "What is the freezing point of water in degrees Celsius?", options: ["100","10","0","32"], answer: 2 },
    { q: "What is the chemical symbol for hydrogen?", options: ["He","Ho","Hy","H"], answer: 3 },
    { q: "In which part of a plant does most photosynthesis happen?", options: ["Leaves","Roots","Stem","Flower"], answer: 0 },
    { q: "What is the chemical symbol for potassium?", options: ["P","K","Po","Pt"], answer: 1 },
    { q: "What is water in its gas form called?", options: ["Ice","Fog","Steam","Mist"], answer: 2 },
    { q: "What is at the center of our solar system?", options: ["Earth","Moon","Jupiter","The Sun"], answer: 3 },
    { q: "Which gas makes up most of the Sun?", options: ["Hydrogen","Oxygen","Helium","Carbon"], answer: 0 },
  ],
  geography: [
    { q: "What is the capital of Russia?", options: ["Moscow","St. Petersburg","Kiev","Minsk"], answer: 0 },
    { q: "What is the capital of China?", options: ["Shanghai","Beijing","Hong Kong","Guangzhou"], answer: 1 },
    { q: "What is the capital of England?", options: ["Paris","Dublin","London","Edinburgh"], answer: 2 },
    { q: "What is the capital of the United States?", options: ["New York","Los Angeles","Chicago","Washington, D.C."], answer: 3 },
    { q: "Which continent has the most countries?", options: ["Africa","Asia","Europe","South America"], answer: 0 },
    { q: "Kangaroos are native to which country?", options: ["New Zealand","Australia","South Africa","Brazil"], answer: 1 },
    { q: "The Leaning Tower of Pisa is in which country?", options: ["Greece","Spain","Italy","France"], answer: 2 },
    { q: "In which city is the Statue of Liberty located?", options: ["Boston","Washington","Chicago","New York City"], answer: 3 },
    { q: "Which is the smallest ocean on Earth?", options: ["Arctic","Indian","Atlantic","Southern"], answer: 0 },
    { q: "Mount Kilimanjaro is on which continent?", options: ["Asia","Africa","South America","Europe"], answer: 1 },
    { q: "The Taj Mahal is located in which country?", options: ["Pakistan","China","India","Nepal"], answer: 2 },
    { q: "What is the capital of Greece?", options: ["Rome","Cairo","Istanbul","Athens"], answer: 3 },
    { q: "What is the capital of Brazil?", options: ["Brasília","Rio de Janeiro","São Paulo","Buenos Aires"], answer: 0 },
    { q: "Egypt is located mostly on which continent?", options: ["Asia","Africa","Europe","Australia"], answer: 1 },
    { q: "Niagara Falls lies between the United States and which country?", options: ["Mexico","Russia","Canada","Brazil"], answer: 2 },
    { q: "What is the capital of India?", options: ["Mumbai","Kolkata","Bangalore","New Delhi"], answer: 3 },
    { q: "Which is the largest US state by area?", options: ["Alaska","Texas","California","Montana"], answer: 0 },
    { q: "Mount Everest is part of which mountain range?", options: ["Andes","Himalayas","Alps","Rockies"], answer: 1 },
    { q: "Which country is famous for tulips and windmills?", options: ["Belgium","Germany","Netherlands","Denmark"], answer: 2 },
    { q: "What is the capital of Portugal?", options: ["Madrid","Barcelona","Porto","Lisbon"], answer: 3 },
    { q: "The Nile River empties into which sea?", options: ["Mediterranean Sea","Red Sea","Black Sea","Caspian Sea"], answer: 0 },
    { q: "What is the capital of South Korea?", options: ["Busan","Seoul","Pyongyang","Tokyo"], answer: 1 },
    { q: "The Colosseum is located in which city?", options: ["Athens","Paris","Rome","Madrid"], answer: 2 },
    { q: "What is the capital of Mexico?", options: ["Cancun","Guadalajara","Tijuana","Mexico City"], answer: 3 },
    { q: "Which is the largest continent by area?", options: ["Asia","Africa","North America","Europe"], answer: 0 },
  ],
  history: [
    { q: "Who was the US president during the American Civil War?", options: ["Abraham Lincoln","George Washington","Thomas Jefferson","Ulysses Grant"], answer: 0 },
    { q: "Who wrote the play 'Romeo and Juliet'?", options: ["Charles Dickens","William Shakespeare","Mark Twain","Jane Austen"], answer: 1 },
    { q: "In which year was the US Declaration of Independence signed?", options: ["1492","1620","1776","1812"], answer: 2 },
    { q: "Which explorer sailed across the Atlantic in 1492?", options: ["Magellan","Cook","Vespucci","Columbus"], answer: 3 },
    { q: "The ancient Romans primarily spoke which language?", options: ["Latin","Greek","Italian","Etruscan"], answer: 0 },
    { q: "Who was the first human to travel into space?", options: ["Neil Armstrong","Yuri Gagarin","Alan Shepard","John Glenn"], answer: 1 },
    { q: "In which year did World War I begin?", options: ["1905","1910","1914","1918"], answer: 2 },
    { q: "Who painted the ceiling of the Sistine Chapel?", options: ["Raphael","Da Vinci","Donatello","Michelangelo"], answer: 3 },
    { q: "Julius Caesar was a leader of which ancient civilization?", options: ["Rome","Greece","Egypt","Persia"], answer: 0 },
    { q: "The Titanic sank after striking what?", options: ["A whale","An iceberg","A reef","A storm"], answer: 1 },
    { q: "Which British prime minister was known as the 'Iron Lady'?", options: ["Queen Victoria","Queen Elizabeth II","Margaret Thatcher","Theresa May"], answer: 2 },
    { q: "The Cold War was mainly between the United States and which country?", options: ["China","Germany","Cuba","Soviet Union"], answer: 3 },
    { q: "Who is credited with inventing the telephone?", options: ["Alexander Graham Bell","Thomas Edison","Nikola Tesla","Guglielmo Marconi"], answer: 0 },
    { q: "Who was the first Emperor of France?", options: ["Louis XIV","Napoleon Bonaparte","Charlemagne","Louis XVI"], answer: 1 },
    { q: "In which century was the American Civil War fought?", options: ["17th","18th","19th","20th"], answer: 2 },
    { q: "Who led India's nonviolent independence movement?", options: ["Nehru","Buddha","Mother Teresa","Mahatma Gandhi"], answer: 3 },
    { q: "Who is most commonly credited with inventing the light bulb?", options: ["Thomas Edison","Albert Einstein","Isaac Newton","Benjamin Franklin"], answer: 0 },
    { q: "The Vikings originally came from which region?", options: ["The Mediterranean","Scandinavia","North Africa","Central Asia"], answer: 1 },
    { q: "Who delivered the famous 'I Have a Dream' speech?", options: ["Malcolm X","John F. Kennedy","Martin Luther King Jr.","Rosa Parks"], answer: 2 },
    { q: "In which country did the Industrial Revolution begin?", options: ["France","Germany","United States","Britain"], answer: 3 },
    { q: "Which British queen gave her name to the Victorian era?", options: ["Queen Victoria","Queen Anne","Mary I","Elizabeth I"], answer: 0 },
    { q: "The first modern Olympic Games in 1896 were held in which city?", options: ["Paris","Athens","London","Rome"], answer: 1 },
    { q: "Whose tomb was famously discovered in Egypt in 1922?", options: ["Ramses","Khufu","Tutankhamun","Akhenaten"], answer: 2 },
    { q: "Who was the leader of the Soviet Union during most of World War II?", options: ["Lenin","Trotsky","Khrushchev","Joseph Stalin"], answer: 3 },
    { q: "The Wright brothers are famous for inventing the first what?", options: ["Airplane","Automobile","Rocket","Helicopter"], answer: 0 },
  ],
  animals: [
    { q: "What is a baby cat called?", options: ["Puppy","Cub","Calf","Kitten"], answer: 3 },
    { q: "What is the largest bird in the world?", options: ["Emu","Ostrich","Eagle","Albatross"], answer: 1 },
    { q: "What do you call a baby cow?", options: ["Kid","Foal","Calf","Lamb"], answer: 2 },
    { q: "What do you call a baby horse?", options: ["Foal","Cub","Kit","Joey"], answer: 0 },
    { q: "What do you call a baby sheep?", options: ["Calf","Kid","Foal","Lamb"], answer: 3 },
    { q: "Which bird is the national symbol of the United States?", options: ["Bald eagle","Turkey","Robin","Hawk"], answer: 0 },
    { q: "How many humps does a dromedary camel have?", options: ["None","One","Two","Three"], answer: 1 },
    { q: "Which reptile is known for carrying a hard shell?", options: ["Snake","Frog","Turtle","Lizard"], answer: 2 },
    { q: "Which of these is the slowest-moving mammal?", options: ["Koala","Panda","Sloth","Kangaroo"], answer: 2 },
    { q: "Which animal is known as the 'ship of the desert'?", options: ["Horse","Donkey","Llama","Camel"], answer: 3 },
    { q: "What is a male chicken called?", options: ["Hen","Rooster","Chick","Drake"], answer: 1 },
    { q: "What is a female deer called?", options: ["Mare","Ewe","Sow","Doe"], answer: 3 },
    { q: "Which sea mammal is famous for its intelligence and use of echolocation?", options: ["Dolphin","Shark","Seal","Turtle"], answer: 0 },
    { q: "What do you call a group of fish swimming together?", options: ["Herd","Pack","School","Flock"], answer: 2 },
    { q: "Which animal is famous for building dams in rivers?", options: ["Otter","Beaver","Muskrat","Platypus"], answer: 1 },
    { q: "What is a baby bear called?", options: ["Cub","Kit","Pup","Joey"], answer: 0 },
    { q: "Which bird is known for its bright pink feathers?", options: ["Parrot","Peacock","Swan","Flamingo"], answer: 3 },
    { q: "Which large animal is known for its long trunk?", options: ["Rhino","Hippo","Elephant","Buffalo"], answer: 2 },
    { q: "Which black-and-white animal eats mainly bamboo?", options: ["Skunk","Panda","Zebra","Penguin"], answer: 1 },
    { q: "What covers a bird's body?", options: ["Scales","Fur","Feathers","Shells"], answer: 2 },
    { q: "Which is the largest living reptile?", options: ["Komodo dragon","Saltwater crocodile","Green anaconda","Tortoise"], answer: 1 },
    { q: "What is a group of wolves called?", options: ["Pack","Pride","Herd","Colony"], answer: 0 },
    { q: "Which creature spins a web to catch its prey?", options: ["Ant","Bee","Beetle","Spider"], answer: 3 },
    { q: "Which bird is the only one that can fly backward?", options: ["Sparrow","Hummingbird","Eagle","Crow"], answer: 1 },
    { q: "What do you call a baby goat?", options: ["Kid","Lamb","Calf","Foal"], answer: 0 },
  ],
  entertainment: [
    { q: "Who is the classic friendly cartoon ghost?", options: ["Casper","Slimer","Boo","Danny"], answer: 0 },
    { q: "What is the surname of the yellow-skinned animated sitcom family?", options: ["Griffin","Simpson","Belcher","Smith"], answer: 1 },
    { q: "Which wooden puppet's nose grows when he tells a lie?", options: ["Geppetto","Peter Pan","Pinocchio","Bambi"], answer: 2 },
    { q: "In Winnie the Pooh, what is Pooh Bear's favorite food?", options: ["Berries","Nuts","Honey","Fish"], answer: 2 },
    { q: "Which musician is known as the 'King of Pop'?", options: ["Elvis Presley","Michael Jackson","Prince","Freddie Mercury"], answer: 1 },
    { q: "Which instrument has black and white keys?", options: ["Guitar","Violin","Drums","Piano"], answer: 3 },
    { q: "In The Wizard of Oz, what color is the brick road Dorothy follows?", options: ["Red","Blue","Green","Yellow"], answer: 3 },
    { q: "What is the name of Batman's loyal butler?", options: ["Alfred","Robin","Lucius","Gordon"], answer: 0 },
    { q: "In The Little Mermaid, what is the name of Ariel's fish friend?", options: ["Sebastian","Flounder","Nemo","Dory"], answer: 1 },
    { q: "Which superhero team includes Iron Man, Thor, and Captain America?", options: ["The Justice League","The X-Men","The Avengers","The Guardians"], answer: 2 },
    { q: "What color is the Grinch?", options: ["Red","Blue","Purple","Green"], answer: 3 },
    { q: "In the movie Cars, what kind of vehicle is Lightning McQueen?", options: ["Truck","Bus","Tractor","Race car"], answer: 3 },
    { q: "In Harry Potter, what sport is played on flying broomsticks?", options: ["Quidditch","Polo","Cricket","Curling"], answer: 0 },
    { q: "What is the name of SpongeBob SquarePants' pet snail?", options: ["Gary","Patrick","Squidward","Larry"], answer: 0 },
    { q: "Which band recorded the song 'Bohemian Rhapsody'?", options: ["The Beatles","Queen","ABBA","The Eagles"], answer: 1 },
    { q: "In the movie Avatar, what is the name of the lush alien moon?", options: ["Krypton","Vulcan","Pandora","Endor"], answer: 2 },
    { q: "What is the name of Nemo's father in Finding Nemo?", options: ["Marlin","Gill","Bruce","Crush"], answer: 0 },
    { q: "In Despicable Me, what is the main character's name?", options: ["Vector","Gru","Nefario","Kevin"], answer: 1 },
    { q: "Which Marvel superhero is the king of Wakanda?", options: ["Black Panther","Falcon","War Machine","Nick Fury"], answer: 0 },
    { q: "Which Pixar movie features a Scottish princess named Merida?", options: ["Tangled","Frozen","Moana","Brave"], answer: 3 },
    { q: "What is the name of Mickey Mouse's pet dog?", options: ["Goofy","Pluto","Max","Rex"], answer: 1 },
    { q: "In The Jungle Book, what kind of animal is Baloo?", options: ["Tiger","Panther","Bear","Wolf"], answer: 2 },
    { q: "Which singer released the hit song 'Rolling in the Deep'?", options: ["Beyoncé","Rihanna","Taylor Swift","Adele"], answer: 3 },
    { q: "Which movie series features dinosaurs brought back to life in a theme park?", options: ["Jurassic Park","King Kong","Godzilla","Ice Age"], answer: 0 },
    { q: "What is the name of the clownfish who gets lost in a Pixar film?", options: ["Marlin","Nemo","Dory","Bruce"], answer: 1 },
  ],
  sports: [
    { q: "How many players are on a cricket team?", options: ["9","10","11","12"], answer: 2 },
    { q: "In which sport can you score a 'home run'?", options: ["Cricket","Golf","Hockey","Baseball"], answer: 3 },
    { q: "In American football, how many points is a field goal worth?", options: ["2","3","6","7"], answer: 1 },
    { q: "Which sport features a play called a 'scrum'?", options: ["Rugby","Tennis","Golf","Swimming"], answer: 0 },
    { q: "In basketball, how many points is a shot from beyond the arc worth?", options: ["1","2","3","4"], answer: 2 },
    { q: "In which country did sumo wrestling originate?", options: ["Japan","China","Korea","Thailand"], answer: 0 },
    { q: "Which sport is Tiger Woods famous for?", options: ["Tennis","Boxing","Cricket","Golf"], answer: 3 },
    { q: "In soccer, which card sends a player off the field?", options: ["Yellow card","Green card","Blue card","Red card"], answer: 3 },
    { q: "Which sport features events on the balance beam and pommel horse?", options: ["Gymnastics","Diving","Skating","Fencing"], answer: 0 },
    { q: "How many minutes are in a standard professional soccer match?", options: ["60","75","90","120"], answer: 2 },
    { q: "Which swimming stroke shares its name with an insect?", options: ["Backstroke","Breaststroke","Butterfly","Freestyle"], answer: 2 },
    { q: "Which sport is played on ice using brooms and heavy stones?", options: ["Hockey","Curling","Skiing","Bobsled"], answer: 1 },
    { q: "On what surface is the Wimbledon tennis tournament played?", options: ["Grass","Clay","Hard court","Carpet"], answer: 0 },
    { q: "How many players are on a rugby union team?", options: ["11","13","15","18"], answer: 2 },
    { q: "Which boxer was famously nicknamed 'The Greatest'?", options: ["Mike Tyson","Muhammad Ali","Joe Frazier","Rocky Marciano"], answer: 1 },
    { q: "In which sport do athletes compete in the Tour de France?", options: ["Running","Rowing","Skiing","Cycling"], answer: 3 },
    { q: "Which sport uses the terms 'strike' and 'spare'?", options: ["Bowling","Darts","Pool","Archery"], answer: 0 },
    { q: "In soccer, which player is allowed to use their hands?", options: ["Striker","Defender","Goalkeeper","Midfielder"], answer: 2 },
    { q: "How many periods are in a standard ice hockey game?", options: ["2","3","4","5"], answer: 1 },
    { q: "In Formula 1 racing, what flag signals the end of the race?", options: ["Red flag","Yellow flag","Checkered flag","Green flag"], answer: 2 },
    { q: "Which martial art originated in Korea?", options: ["Karate","Judo","Taekwondo","Kung Fu"], answer: 2 },
    { q: "How many pins are set up in a game of ten-pin bowling?", options: ["10","8","9","12"], answer: 0 },
    { q: "Which sport is Serena Williams famous for?", options: ["Golf","Tennis","Basketball","Swimming"], answer: 1 },
    { q: "What is the small ball used in table tennis commonly called?", options: ["Puck","Ping-pong ball","Shuttlecock","Birdie"], answer: 1 },
    { q: "In which sport would you use a 'putter'?", options: ["Baseball","Hockey","Cricket","Golf"], answer: 3 },
  ],
  food: [
    { q: "Which fruit is said to 'keep the doctor away'?", options: ["Banana","Apple","Orange","Pear"], answer: 1 },
    { q: "What is the main ingredient in ketchup?", options: ["Tomato","Pepper","Onion","Carrot"], answer: 0 },
    { q: "What grain is the main ingredient in risotto?", options: ["Wheat","Barley","Oats","Rice"], answer: 3 },
    { q: "What is tofu primarily made from?", options: ["Soybeans","Corn","Rice","Wheat"], answer: 0 },
    { q: "Which herb is used to top a classic Margherita pizza?", options: ["Parsley","Mint","Basil","Thyme"], answer: 2 },
    { q: "Raisins are the dried version of which fruit?", options: ["Plums","Grapes","Cherries","Figs"], answer: 1 },
    { q: "What is the yellow center of an egg called?", options: ["White","Shell","Yolk","Membrane"], answer: 2 },
    { q: "Which lettuce is traditionally used in a Caesar salad?", options: ["Iceberg","Butterhead","Spinach","Romaine"], answer: 3 },
    { q: "Which spice comes from the bark of a tree?", options: ["Nutmeg","Ginger","Cinnamon","Clove"], answer: 2 },
    { q: "Which nut is the main ingredient in marzipan?", options: ["Walnut","Almond","Cashew","Pecan"], answer: 1 },
    { q: "Which hot beverage is brewed from leaves and is very popular in Britain?", options: ["Coffee","Cocoa","Cider","Tea"], answer: 3 },
    { q: "Which white cheese is a key ingredient in a Greek salad?", options: ["Cheddar","Mozzarella","Feta","Brie"], answer: 2 },
    { q: "Which fruit is squeezed to make lemonade?", options: ["Lime","Lemon","Orange","Grapefruit"], answer: 1 },
    { q: "What is the Italian frozen dessert similar to ice cream called?", options: ["Sorbet","Custard","Sherbet","Gelato"], answer: 3 },
    { q: "Cheddar is a type of what food?", options: ["Bread","Cheese","Pasta","Meat"], answer: 1 },
    { q: "Which vegetable is pickled to make a classic dill pickle?", options: ["Zucchini","Cucumber","Eggplant","Squash"], answer: 1 },
    { q: "Which spice is bright red and made from dried ground peppers?", options: ["Paprika","Turmeric","Saffron","Cumin"], answer: 0 },
    { q: "What liquid is the base ingredient for making most cheese?", options: ["Water","Cream","Broth","Milk"], answer: 3 },
    { q: "Which meat is in a classic BLT sandwich?", options: ["Ham","Turkey","Bacon","Chicken"], answer: 2 },
    { q: "Which spice gives gingerbread its distinctive flavor?", options: ["Cinnamon","Ginger","Clove","Nutmeg"], answer: 1 },
    { q: "What is the main ingredient in mashed potatoes?", options: ["Potatoes","Turnips","Carrots","Parsnips"], answer: 0 },
    { q: "Which country is famous for originating pasta dishes like spaghetti?", options: ["France","Spain","Italy","Greece"], answer: 2 },
    { q: "What are the two main fillings in a classic PB&J sandwich?", options: ["Cheese and ham","Butter and honey","Cream and jam","Peanut butter and jelly"], answer: 3 },
    { q: "What is the main ingredient in French onion soup?", options: ["Onions","Garlic","Leeks","Celery"], answer: 0 },
  ],
  disney: [
    { q: "In Tangled, what is special about Rapunzel's hair?", options: ["Her eyes glow","It changes color","It glows when she sings","It never tangles"], answer: 2 },
    { q: "In The Lion King, what kind of animal is Timon?", options: ["Warthog","Meerkat","Mongoose","Lemur"], answer: 1 },
    { q: "In The Lion King, what kind of animal is Pumbaa?", options: ["Boar","Hippo","Rhino","Warthog"], answer: 3 },
    { q: "In Cinderella, what does Cinderella leave behind at the ball?", options: ["A glass slipper","A glove","A necklace","A ring"], answer: 0 },
    { q: "In Sleeping Beauty, what is the princess's name?", options: ["Belle","Snow White","Aurora","Jasmine"], answer: 2 },
    { q: "In Beauty and the Beast, what is the heroine's name?", options: ["Ariel","Aurora","Mulan","Belle"], answer: 3 },
    { q: "In Aladdin, what is the name of Jasmine's pet tiger?", options: ["Rajah","Abu","Iago","Khan"], answer: 0 },
    { q: "In Pinocchio, what happens when Pinocchio tells a lie?", options: ["His ears grow","His nose grows","He shrinks","He turns blue"], answer: 1 },
    { q: "What kind of animal is Dumbo?", options: ["A mouse","A bird","An elephant","A donkey"], answer: 2 },
    { q: "In 101 Dalmatians, what is the villain's name?", options: ["Ursula","Maleficent","Yzma","Cruella de Vil"], answer: 3 },
    { q: "In The Little Mermaid, what is the name of the sea witch?", options: ["Maleficent","Ursula","Cruella","Morgana"], answer: 1 },
    { q: "In Mulan, what is the name of Mulan's small dragon guardian?", options: ["Mushu","Cri-Kee","Khan","Sisu"], answer: 0 },
    { q: "In Up, how does Carl's house fly into the sky?", options: ["Rockets","Wings","Balloons","Magic"], answer: 2 },
    { q: "In Monsters, Inc., what do the monsters collect from children?", options: ["Dreams","Teeth","Toys","Screams"], answer: 3 },
    { q: "In Ratatouille, what kind of animal is Remy?", options: ["A mouse","A rat","A raccoon","A hamster"], answer: 1 },
    { q: "In Toy Story 2, which cowgirl doll joins the toys?", options: ["Bo Peep","Barbie","Jessie","Dolly"], answer: 2 },
    { q: "In Frozen, what kind of animal is Sven?", options: ["A reindeer","A horse","A moose","A deer"], answer: 0 },
    { q: "In Moana, what is the name of the demigod who helps Moana?", options: ["Tamatoa","Maui","Chief Tui","Heihei"], answer: 1 },
    { q: "In Wreck-It Ralph, what is Ralph's role in his arcade game?", options: ["Hero","Referee","Racer","Villain"], answer: 3 },
    { q: "In Zootopia, what kind of animal is Judy Hopps?", options: ["A rabbit","A fox","A sloth","A cat"], answer: 0 },
    { q: "In Zootopia, what kind of animal is Nick Wilde?", options: ["A wolf","A dog","A fox","A weasel"], answer: 2 },
    { q: "In The Incredibles, what is Mr. Incredible's superpower?", options: ["Invisibility","Super strength","Flight","Super speed"], answer: 1 },
    { q: "In Coco, what magical place does Miguel end up in?", options: ["The Underworld","Neverland","The Spirit World","The Land of the Dead"], answer: 3 },
    { q: "What kind of animal is Bambi?", options: ["A deer","A rabbit","A fox","A bear"], answer: 0 },
    { q: "In Snow White, how many dwarfs are there?", options: ["Five","Six","Seven","Eight"], answer: 2 },
  ],
  starwars: [
    { q: "What color is Yoda's lightsaber?", options: ["Blue","Green","Red","Purple"], answer: 1 },
    { q: "What color is a Sith lightsaber usually?", options: ["Blue","Green","Red","Yellow"], answer: 2 },
    { q: "Who is Luke Skywalker's twin sister?", options: ["Leia","Rey","Padmé","Jyn"], answer: 0 },
    { q: "On which forest moon do the Ewoks live?", options: ["Endor","Hoth","Naboo","Dagobah"], answer: 0 },
    { q: "On which icy planet do the rebels hide in The Empire Strikes Back?", options: ["Endor","Naboo","Hoth","Mustafar"], answer: 2 },
    { q: "What is the name of the armored bounty hunter in the original trilogy?", options: ["Jango Fett","Din Djarin","Boba Fett","Cad Bane"], answer: 2 },
    { q: "What kind of droid is R2-D2?", options: ["Astromech droid","Protocol droid","Battle droid","Medical droid"], answer: 0 },
    { q: "Which planet is Princess Leia associated with?", options: ["Naboo","Alderaan","Coruscant","Tatooine"], answer: 1 },
    { q: "Who is the Emperor ruling the Galactic Empire?", options: ["Darth Maul","Palpatine","Count Dooku","Grievous"], answer: 1 },
    { q: "What is the energy field that gives the Jedi their powers?", options: ["The Ether","The Aura","The Force","The Flow"], answer: 2 },
    { q: "Which small, round droid appears in the sequel trilogy?", options: ["BB-8","R5-D4","D-O","IG-11"], answer: 0 },
    { q: "What species is Jabba?", options: ["Wookiee","Ewok","Jawa","Hutt"], answer: 3 },
    { q: "What is the name of Anakin Skywalker's mother?", options: ["Padmé","Shmi","Beru","Mon Mothma"], answer: 1 },
    { q: "Which battle station destroyed the planet Alderaan?", options: ["Star Destroyer","Super Laser","Ion Cannon","Death Star"], answer: 3 },
    { q: "Which Jedi Master wields a purple lightsaber?", options: ["Mace Windu","Kit Fisto","Plo Koon","Ki-Adi-Mundi"], answer: 0 },
    { q: "In the prequels, who is the queen and later senator of Naboo?", options: ["Leia","Rey","Sabé","Padmé"], answer: 3 },
    { q: "What creature does Luke ride across the snow on Hoth?", options: ["Bantha","Dewback","Ronto","Tauntaun"], answer: 3 },
    { q: "What are the small, hooded scavengers on Tatooine called?", options: ["Ewoks","Tuskens","Jawas","Gungans"], answer: 2 },
    { q: "What is the name of the clumsy Gungan in the prequels?", options: ["Jar Jar Binks","Watto","Sebulba","Boss Nass"], answer: 0 },
    { q: "Who owned the Millennium Falcon before Han Solo won it?", options: ["Chewbacca","Boba Fett","Greedo","Lando Calrissian"], answer: 3 },
    { q: "What is Han Solo frozen in during The Empire Strikes Back?", options: ["Ice","Carbonite","Amber","Concrete"], answer: 1 },
    { q: "What governed the galaxy before the Empire rose to power?", options: ["The Federation","The Alliance","The Republic","The Coalition"], answer: 2 },
    { q: "In The Mandalorian, what is the character nicknamed 'Baby Yoda' actually called?", options: ["Grogu","Yaddle","Yoda","Din"], answer: 0 },
    { q: "Which starfighter is a signature ship of the Rebel Alliance?", options: ["TIE Fighter","Star Destroyer","Millennium Falcon","X-wing"], answer: 3 },
    { q: "Who cuts off Luke's hand in The Empire Strikes Back?", options: ["Boba Fett","Darth Vader","Palpatine","Obi-Wan Kenobi"], answer: 1 },
  ],
  pokemon: [
    { q: "What is the final evolution of Bulbasaur?", options: ["Ivysaur","Vileplume","Venusaur","Meganium"], answer: 2 },
    { q: "What is the final evolution of Squirtle?", options: ["Blastoise","Wartortle","Gyarados","Feraligatr"], answer: 0 },
    { q: "What is Bulbasaur's secondary type?", options: ["Ground","Flying","Bug","Poison"], answer: 3 },
    { q: "What does Pikachu evolve into?", options: ["Pichu","Raichu","Voltorb","Electabuzz"], answer: 1 },
    { q: "What is the pre-evolution of Pikachu?", options: ["Raichu","Plusle","Pichu","Togepi"], answer: 2 },
    { q: "Which Pokémon is a large orange, fire-breathing, dragon-like creature?", options: ["Charizard","Dragonite","Gyarados","Salamence"], answer: 0 },
    { q: "What is the villainous team in the Kanto games?", options: ["Team Magma","Team Galactic","Team Aqua","Team Rocket"], answer: 3 },
    { q: "Which duo travels with a talking Meowth in the anime?", options: ["Cassidy and Butch","Jessie and James","Brock and Misty","May and Max"], answer: 1 },
    { q: "Which Pokémon rides on Ash's shoulder instead of staying in its Poké Ball?", options: ["Charizard","Bulbasaur","Pikachu","Squirtle"], answer: 2 },
    { q: "Which legendary bird is an Electric type?", options: ["Zapdos","Articuno","Moltres","Ho-Oh"], answer: 0 },
    { q: "Which legendary bird is an Ice type?", options: ["Zapdos","Articuno","Moltres","Lugia"], answer: 1 },
    { q: "Which legendary bird is a Fire type?", options: ["Articuno","Zapdos","Lugia","Moltres"], answer: 3 },
    { q: "Which type is super effective against Water?", options: ["Fire","Rock","Grass","Flying"], answer: 2 },
    { q: "Which type is super effective against Fire?", options: ["Water","Grass","Electric","Bug"], answer: 0 },
    { q: "Which pink mythical Pokémon is number 151 in the Pokédex?", options: ["Mewtwo","Mew","Ditto","Clefairy"], answer: 1 },
    { q: "Which Pokémon can transform into other Pokémon?", options: ["Mew","Zorua","Smeargle","Ditto"], answer: 3 },
    { q: "Which region is the setting of Pokémon Red and Blue?", options: ["Kanto","Johto","Hoenn","Sinnoh"], answer: 0 },
    { q: "Which region features Pokémon Gold and Silver?", options: ["Kanto","Hoenn","Johto","Unova"], answer: 2 },
    { q: "What is the name of the Pokémon Professor in the Kanto games?", options: ["Professor Elm","Professor Oak","Professor Birch","Professor Rowan"], answer: 1 },
    { q: "Who is Ash's rival and Professor Oak's grandson in the original anime?", options: ["Brock","Misty","Tracey","Gary"], answer: 3 },
    { q: "Which item restores a Pokémon's HP?", options: ["Potion","Repel","Antidote","Escape Rope"], answer: 0 },
    { q: "Which Pokémon evolves into Gyarados?", options: ["Goldeen","Feebas","Magikarp","Seaking"], answer: 2 },
    { q: "Which Pokémon is number 001 in the Pokédex?", options: ["Bulbasaur","Pikachu","Charmander","Mew"], answer: 0 },
    { q: "How many Pokémon were in the original Generation I games?", options: ["100","150","249","151"], answer: 3 },
    { q: "Which stone evolves Eevee into Vaporeon?", options: ["Fire Stone","Water Stone","Thunder Stone","Leaf Stone"], answer: 1 },
  ],
  gaming: [
    { q: "In The Legend of Zelda, what is the name of the princess?", options: ["Peach","Zelda","Midna","Impa"], answer: 1 },
    { q: "In the Mario games, what is the name of the green dinosaur?", options: ["Yoshi","Bowser","Toad","Koopa"], answer: 0 },
    { q: "Who is the main villain in the Super Mario series?", options: ["Wario","Donkey Kong","Bowser","Waluigi"], answer: 2 },
    { q: "Who is the main villain in the Sonic the Hedgehog games?", options: ["Knuckles","Tails","Shadow","Dr. Eggman"], answer: 3 },
    { q: "In Sonic the Hedgehog, what is the name of the two-tailed fox?", options: ["Knuckles","Tails","Amy","Shadow"], answer: 1 },
    { q: "In Minecraft, what block is used to build a Nether portal?", options: ["Obsidian","Diamond","Bedrock","Netherite"], answer: 0 },
    { q: "In Minecraft, what pickaxe do you need to mine diamond ore?", options: ["Wooden pickaxe","Stone pickaxe","Iron pickaxe","Golden pickaxe"], answer: 2 },
    { q: "Which game is the best-selling video game of all time?", options: ["Tetris","Minecraft","Grand Theft Auto V","Wii Sports"], answer: 1 },
    { q: "In Pac-Man, how many ghosts chase Pac-Man?", options: ["Two","Three","Five","Four"], answer: 3 },
    { q: "In Among Us, what are the bad players called?", options: ["Impostors","Crewmates","Ghosts","Traitors"], answer: 0 },
    { q: "Which battle royale game rewards a win with a 'Victory Royale'?", options: ["Apex Legends","PUBG","Fortnite","Warzone"], answer: 2 },
    { q: "In the classic Donkey Kong arcade game, what does he throw at the player?", options: ["Bananas","Barrels","Rocks","Bombs"], answer: 1 },
    { q: "Which company makes the PlayStation console?", options: ["Microsoft","Nintendo","Sega","Sony"], answer: 3 },
    { q: "Which company makes the Xbox console?", options: ["Microsoft","Sony","Nintendo","Atari"], answer: 0 },
    { q: "In Animal Crossing, what kind of animal is Tom Nook?", options: ["A dog","A cat","A raccoon","A fox"], answer: 2 },
    { q: "In Mario Kart, which item gives you a quick speed boost?", options: ["Banana","Mushroom","Green shell","Bob-omb"], answer: 1 },
    { q: "In Mario Kart, which item famously targets the racer in first place?", options: ["Red shell","Green shell","Banana","Blue shell"], answer: 3 },
    { q: "In Minecraft, what is the name of the final boss dragon?", options: ["Ender Dragon","Wither","Warden","Ravager"], answer: 0 },
    { q: "In the arcade game Space Invaders, what are you shooting at?", options: ["Asteroids","Ghosts","Aliens","Zombies"], answer: 2 },
    { q: "Which Nintendo handheld was known for having two screens?", options: ["Game Boy","Nintendo DS","PSP","Switch"], answer: 1 },
    { q: "In The Legend of Zelda, what is the name of Link's legendary sword?", options: ["Excalibur","Buster Sword","Keyblade","Master Sword"], answer: 3 },
    { q: "Which Nintendo character is a pink puffball that inhales enemies?", options: ["Kirby","Jigglypuff","Yoshi","Toad"], answer: 0 },
    { q: "In Street Fighter, what is Ryu's signature fireball move called?", options: ["Shoryuken","Sonic Boom","Hadouken","Kamehameha"], answer: 2 },
    { q: "What genre is the Call of Duty series?", options: ["Racing","First-person shooter","Puzzle","Sports"], answer: 1 },
    { q: "What is Nintendo's hybrid home-and-handheld console released in 2017?", options: ["Nintendo Switch","Wii U","3DS","GameCube"], answer: 0 },
  ],
};
for (const c of Object.keys(MORE3)) if (QUESTIONS[c]) QUESTIONS[c].push(...MORE3[c]);


const QUESTION_MS = 15_000;
const REVEAL_MS = 4_000;

function startQuestion(state, ctx) {
  state.screen = "question";
  state.answers = {};
  state.startedAt = ctx.now();
  state.endsAt = ctx.now() + QUESTION_MS;
  // A per-question token: every timer captures it and no-ops if a newer
  // question (or reveal) has since started. Guards against any stale timer
  // firing into a later round (e.g. an early "times up").
  const token = (state.qToken || 0) + 1;
  state.qToken = token;
  ctx.sync();

  ctx.after(QUESTION_MS, () => { if (state.screen === "question" && state.qToken === token) timesUp(state, ctx, () => revealQuestion(state, ctx, token)); });
  const tick = () => {
    if (state.screen !== "question" || state.qToken !== token) return;
    ctx.syncHost();
    ctx.after(1000, tick);
  };
  ctx.after(1000, tick);
}

function revealQuestion(state, ctx, token) {
  if (state.screen === "reveal") return;
  if (token != null && token !== state.qToken) return; // a newer question already started
  state.screen = "reveal";
  const revealToken = state.qToken;
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
    if (state.qToken !== revealToken) return; // stale reveal — a newer question is live
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
      revealQuestion(state, ctx, state.qToken);
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
