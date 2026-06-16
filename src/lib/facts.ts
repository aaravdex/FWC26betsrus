// A small built-in set of true football facts, rotated through the UI (e.g. the
// fact banner on the fixtures and leaderboard pages). Client-safe (no imports).

export const FOOTBALL_FACTS: string[] = [
  "The first FIFA World Cup was held in Uruguay in 1930, and the hosts won it.",
  "Brazil are the only nation to have played in every World Cup finals tournament.",
  "Brazil have won the World Cup a record five times.",
  "The 2026 World Cup is the first to feature 48 teams, up from 32.",
  "The 2026 edition is co-hosted by Canada, Mexico and the United States.",
  "Mexico's Estadio Azteca is set to become the first stadium to host games at three different World Cups.",
  "Miroslav Klose holds the record for most World Cup goals, with 16.",
  "Just Fontaine scored 13 goals at a single World Cup — France, 1958 — a record that still stands.",
  "A regulation football pitch is between 100 and 110 metres long for international matches.",
  "The maximum length of a football match is decided by added time; there is no clock stoppage like other sports.",
  "Lionel Messi captained Argentina to the 2022 World Cup title in Qatar.",
  "Only eight different nations have ever won the men's World Cup.",
  "Pelé is the only player to win three World Cups (1958, 1962 and 1970).",
  "The Maracanã in Brazil once held nearly 200,000 fans for the 1950 World Cup final.",
  "Goal-line technology was used at a World Cup for the first time in 2014.",
  "The fastest goal in World Cup history was scored by Hakan Şükür after 11 seconds in 2002.",
  "A football is officially a 'size 5' for adult play, with a circumference of about 68–70 cm.",
  "Germany and Brazil have each reached the most World Cup semi-finals.",
  "The World Cup trophy is made of 18-carat gold and stands 36.8 cm tall.",
  "VAR (Video Assistant Referee) made its World Cup debut at the 2018 tournament in Russia.",
];

/** Deterministic pick by index (wraps). Useful for server render without hydration mismatch. */
export function factAt(index: number): string {
  const i = ((index % FOOTBALL_FACTS.length) + FOOTBALL_FACTS.length) % FOOTBALL_FACTS.length;
  return FOOTBALL_FACTS[i];
}
