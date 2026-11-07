/**
 * The Temperaments a kid can pick from, each shown as a word and an icon.
 * Ticket 08 gives each one its own behavior during the Catch.
 */
export const TEMPERAMENTS = [
  { id: "speedy", word: "Speedy", icon: "⚡" },
  { id: "sneaky", word: "Sneaky", icon: "🤫" },
  { id: "bouncy", word: "Bouncy", icon: "🦘" },
  { id: "sturdy", word: "Sturdy", icon: "🪨" },
  { id: "sleepy", word: "Sleepy", icon: "😴" },
] as const;

export type Temperament = (typeof TEMPERAMENTS)[number]["id"];
