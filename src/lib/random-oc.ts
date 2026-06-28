export const RANDOM_NAMES = [
  "Velira",
  "Kael",
  "Mira",
  "Zephyr",
  "Luna",
  "Orion",
  "Nyx",
  "Sol",
  "Astra",
  "Riven",
  "Echo",
  "Nova",
  "Cassian",
  "Elara",
  "Thorne",
  "Piper",
  "Jinx",
  "Finn",
  "Sable",
  "Quinn",
];

export const RANDOM_SPECIES = [
  "Human",
  "Elf",
  "Demon",
  "Angel",
  "Android",
  "Werewolf",
  "Vampire",
  "Fae",
  "Neko",
  "Dragonkin",
  "Alien",
  "Ghost",
  "Mermaid",
  "Cyborg",
  "Shapeshifter",
];

export const RANDOM_GENDERS = [
  "Female",
  "Male",
  "Non-binary",
  "Genderfluid",
  "Transfeminine",
  "Transmasculine",
  "Agender",
];

export const RANDOM_ORIENTATIONS = [
  "Bisexual",
  "Pansexual",
  "Gay",
  "Lesbian",
  "Straight",
  "Asexual",
  "Demisexual",
  "Omnisexual",
];

export const RANDOM_OCCUPATIONS = [
  "Bounty Hunter",
  "Coffee Shop Barista",
  "Intergalactic Courier",
  "Underground DJ",
  "Rogue Mage",
  "Tech Engineer",
  "Cafe Owner",
  "Starship Pilot",
  "Street Racer",
  "Archaeologist",
  "Assassin",
  "Artist",
  "Scientist",
  "Thief",
];

export const RANDOM_HOMEWORLDS = [
  "Neo-Tokyo",
  "Lunar Colony Alpha",
  "The Feywilds",
  "Inferno-7",
  "Elysium Station",
  "Old Earth",
  "The Undercity",
  "Aethelgard",
  "Mars Dome 4",
  "The Void",
];

export const RANDOM_TRAITS = [
  "chaotic",
  "flirty",
  "tsundere",
  "soft",
  "protective",
  "mischievous",
  "loyal",
  "mysterious",
  "playful",
  "edgy",
  "hopeless romantic",
  "sarcastic",
  "gentle giant",
  "yandere",
  "ambitious",
];

export const RANDOM_LIKES = [
  "late-night drives",
  "neon lights",
  "rainy days",
  "spicy ramen",
  "stargazing",
  "old books",
  "cats",
  "synthwave music",
  "black coffee",
  "comic books",
  "board games",
  "hacking",
  "gardening",
];

export const RANDOM_DISLIKES = [
  "loud crowds",
  "mornings",
  "pickles",
  "boredom",
  "dishonesty",
  "cold pizza",
  "small talk",
  "formality",
  "being ignored",
  "pineapple on pizza",
  "paperwork",
  "loud alarms",
];

export const RANDOM_PERSONALITIES = [
  "A whirlwind of chaotic energy wrapped in charm. They say the wrong thing at the right time and somehow make it work.",
  "Soft-spoken but fiercely loyal. Will remember your birthday, your coffee order, and that one embarrassing story you told at 2am.",
  "Cold exterior, secretly melting. Pretends not to care but has already named the future pet you will adopt together.",
  "Endlessly curious and slightly reckless. Lives for adventure, bad decisions, and meaningful conversations at 3am.",
  "The calculated heartbreaker who actually just wants someone to binge-watch terrible shows with.",
];

export const RANDOM_APPEARANCES = [
  "Tall and sharp-edged, with eyes that catch the light like stained glass. Dresses in layers of black and silver.",
  "Petite and expressive, covered in freckles and questionable fashion choices. Always has paint or oil stains somewhere.",
  "Athletic build with a lazy smile and a scar they wont explain. Wears the same leather jacket in every weather.",
  "Ethereal and unsettlingly perfect, like a dream you half-remember. Their hair never seems to obey gravity.",
  "Cute but deadly. Soft features, bright eyes, and combat boots polished enough to see your reflection in.",
];

export const RANDOM_BACKSTORIES = [
  "Grew up on a dying space station and learned to fix anything with duct tape and hope. Still carries a photo of the sunsets they never saw.",
  "Raised by wolves. Not metaphorically. It complicates family dinners but makes them excellent at reading people.",
  "Escaped a cult, a corporation, and a bad relationship in the same year. Now they are just trying to be soft without feeling weak.",
  "Former royal guard turned bartender. Has too many stories, not enough listeners, and a weakness for anyone who asks the right question.",
  "An experiment that worked too well. Searching for the meaning of free will between shifts at a convenience store.",
];

export const RANDOM_TRUTHS = [
  "I once saved a civilization with a broken blender and a lot of confidence.",
  "I have a secret playlist of love songs I pretend to hate.",
  "I can speak three languages but freeze when ordering coffee.",
  "I have never lost a staring contest.",
  "I write poetry but burn it afterward.",
];

export const RANDOM_LIES = [
  "I have never been in love.",
  "I hate surprises.",
  "I am totally normal and not hiding anything.",
  "I do not care what people think of me.",
  "I have never cried at a movie.",
];

export function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export interface RandomOCData {
  name: string;
  species: string;
  gender: string;
  sexualOrientation: string;
  romanticOrientation: string;
  age: number;
  heightInches: number;
  personality: string;
  tags: string[];
  likes: string;
  dislikes: string;
  appearance: string;
  occupation: string;
  homeworld: string;
  backstory: string;
  truths: [string, string];
  lie: string;
  openFeed: string;
}

export function generateRandomOC(): RandomOCData {
  const truths = pickMany(RANDOM_TRUTHS, 2) as [string, string];
  return {
    name: pickOne(RANDOM_NAMES),
    species: pickOne(RANDOM_SPECIES),
    gender: pickOne(RANDOM_GENDERS),
    sexualOrientation: pickOne(RANDOM_ORIENTATIONS),
    romanticOrientation: pickOne(RANDOM_ORIENTATIONS),
    age: Math.floor(Math.random() * 15) + 18,
    heightInches: Math.floor(Math.random() * 36) + 55,
    personality: pickOne(RANDOM_PERSONALITIES),
    tags: pickMany(RANDOM_TRAITS, 3),
    likes: pickMany(RANDOM_LIKES, 3).join(", "),
    dislikes: pickMany(RANDOM_DISLIKES, 2).join(", "),
    appearance: pickOne(RANDOM_APPEARANCES),
    occupation: pickOne(RANDOM_OCCUPATIONS),
    homeworld: pickOne(RANDOM_HOMEWORLDS),
    backstory: pickOne(RANDOM_BACKSTORIES),
    truths,
    lie: pickOne(RANDOM_LIES),
    openFeed: "Just landed on this wild platform. Swipe right if you can handle chaos.",
  };
}
