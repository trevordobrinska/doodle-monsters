import type { Temperament } from "./temperaments";

/**
 * The word lists the Bio generator fills its blanks from. Plain data, kept
 * kid-safe, for the family to add to.
 *
 * Every template must use {eyes}, {color} and {temperament}, so each Bio
 * mentions real facts about its Monster. The other blanks name a list
 * below; {name} is the Monster's name and {habit} comes from its
 * Temperament's own list.
 */
export const BIO_WORDS = {
  templates: [
    "{name} is a {temperament} {color} Monster with {eyes}. It loves {snack} and {hobby}.",
    "Meet {name}! This {color} Monster has {eyes} and is very, very {temperament}. It {habit}.",
    "{name} has {eyes}, a {color} tummy and a {temperament} heart. Its favorite snack is {snack}.",
    "Nobody is more {temperament} than {name}. It uses its {eyes} for {hobby}, and dreams of {dream} somewhere very {color}.",
    "{name} is the most {temperament} {color} Monster in the Zoo. It {habit}, then blinks its {eyes} at you.",
  ],
  snack: [
    "crunchy clouds", "jelly socks", "upside-down pancakes", "rainbow noodles", "bubble soup",
    "moon cheese", "fizzy pebbles", "pickle pops", "marshmallow mud", "giggle crackers",
  ],
  hobby: [
    "counting ladybugs", "humming to snails", "collecting shiny buttons", "spotting shapes in clouds",
    "building pillow forts", "tickling flowers", "racing raindrops", "telling jokes to the moon",
  ],
  dream: [
    "riding a kite", "a bath full of jelly", "a hat made of pudding", "dancing with a giraffe",
    "a castle of socks", "swimming in lemonade", "a picnic on a rainbow",
  ],
  /** Things a Monster of each Temperament gets up to. */
  habit: {
    speedy: ["zooms round the Habitat before breakfast", "runs so fast its shadow can't keep up", "races butterflies, and wins"],
    sneaky: ["tiptoes everywhere, even in its sleep", "hides behind tiny pebbles", "plays hide-and-seek with itself"],
    bouncy: ["boings higher than a tree", "can't stop hopping, even at bedtime", "bounces on puddles for fun"],
    sturdy: ["never falls over, not even in a big wind", "can carry a whole pile of pillows", "stands as still as a rock when it's thinking"],
    sleepy: ["naps nine times a day", "yawns louder than a lion", "snores little bubbles"],
  } satisfies Record<Temperament, readonly string[]>,
  /** How each number of Googly Eyes is said, from one to five. */
  eyeCounts: ["one googly eye", "two googly eyes", "three googly eyes", "four googly eyes", "five googly eyes"],
};
