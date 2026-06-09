/* build 2026-06-08f */
/* Eras in order. The engine advances when `advance` requirements are met. */
window.GAME_ERAS = [
  {
    id: 'medieval',
    name: 'Medieval Age',
    title: 'Hamlet',
    blurb: 'Mud roads and timber halls. A handful of families look to you to lead.',
    advance: null // first era
  },
  {
    id: 'renaissance',
    name: 'Renaissance',
    title: 'Town',
    blurb: 'Trade, art and learning bloom. Guildhalls rise above the rooftops.',
    advance: { population: 55, techs: ['guilds', 'printing_press'] }
  },
  {
    id: 'industrial',
    name: 'Industrial Age',
    title: 'City',
    blurb: 'Smoke and steam. Factories thunder and the population swells.',
    advance: { population: 170, techs: ['steam_power', 'urban_planning'] }
  },
  {
    id: 'modern',
    name: 'Modern Era',
    title: 'Metropolis',
    blurb: 'Glass towers, transit lines and the hum of computers. The future is here.',
    advance: { population: 450, techs: ['medicine', 'computing'] }
  },
  {
    id: 'information',
    name: 'Information Age',
    title: 'Megacity',
    blurb: 'Data flows like water. AI, fusion and the network bind the megacity together.',
    advance: { population: 900, techs: ['internet', 'fusion'] }
  },
  {
    id: 'space',
    name: 'Space Age',
    title: 'Star City',
    blurb: 'Spires reach for orbit. Your civilization steps beyond the world that made it.',
    advance: { population: 1800, techs: ['space_flight', 'nanotech'] }
  }
];
