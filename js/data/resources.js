/* build 2026-06-08f */
/* Resource definitions. Order = display order in the resource bar. */
window.GAME_RESOURCES = [
  { id: 'food',       name: 'Food',      icon: '🌾', start: 90,  desc: 'Feeds your people. Run out and they starve.' },
  { id: 'coin',       name: 'Coin',      icon: '🪙', start: 70,  desc: 'Pays for buildings and upkeep.' },
  { id: 'materials',  name: 'Materials', icon: '🪵', start: 95,  desc: 'Timber, stone and steel for construction.' },
  { id: 'population', name: 'People',    icon: '👤', start: 10,  desc: 'Workers fill jobs. They need food and housing.' },
  { id: 'happiness',  name: 'Mood',      icon: '😊', start: 65,  desc: 'Public morale, 0–100. Low mood shrinks your city.' },
  { id: 'knowledge',  name: 'Knowledge', icon: '📜', start: 5,   desc: 'Spent on research to unlock new ages.' }
];

/* Tuning constants the engine reads. */
window.GAME_TUNING = {
  FOOD_PER_POP: 0.5,     // food eaten per person per year
  TAX_PER_POP: 0.18,     // coin collected per person (scaled by mood)
  GROWTH_RATE: 0.12,     // max population growth fraction per year
  STARVE_RATE: 0.10,     // fraction of people lost per year when starving
  UNREST_RATE: 0.06,     // fraction of people lost per year when mood is very low
  HAPPINESS_DRIFT: 0.30, // how fast mood moves toward its target each year
  HAPPINESS_BASE: 50     // baseline mood with no modifiers
};
