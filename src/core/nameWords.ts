/**
 * The word lists the name generator fills its blanks from. Plain data, kept
 * kid-safe, for the family to add to. Each template's {blanks} name a list.
 */
export const NAME_WORDS = {
  templates: ["{adjective} {thing}", "{title} {thing}", "{thing} the {adjective}", "{title} {start}{end}", "{start}{end}"],
  adjective: [
    "Wobbly", "Fuzzy", "Giggly", "Sparkly", "Squishy", "Bouncy", "Grumpy", "Sleepy",
    "Tiny", "Mighty", "Wiggly", "Fluffy", "Zippy", "Sneezy", "Lumpy", "Jolly",
  ],
  thing: [
    "Noodle", "Pickle", "Muffin", "Puddle", "Gumdrop", "Waffle", "Biscuit", "Pebble",
    "Sprout", "Button", "Pancake", "Jellybean", "Turnip", "Marshmallow", "Pudding", "Sock",
  ],
  title: ["Sir", "Lady", "Captain", "Professor", "Little", "Big", "Doctor", "King", "Queen"],
  start: ["Bloop", "Zib", "Wum", "Snor", "Fizz", "Gloop", "Plim", "Boing", "Squee", "Mog"],
  end: ["zilla", "ington", "bottom", "kins", "wump", "doodle", "snout", "ster", "boo", "flop"],
};
