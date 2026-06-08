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
    advance: { population: 40, techs: ['guilds', 'printing_press'] }
  },
  {
    id: 'industrial',
    name: 'Industrial Age',
    title: 'City',
    blurb: 'Smoke and steam. Factories thunder and the population swells.',
    advance: { population: 120, techs: ['steam_power', 'urban_planning'] }
  },
  {
    id: 'modern',
    name: 'Modern Era',
    title: 'Metropolis',
    blurb: 'Glass towers, transit lines and the hum of computers. The future is here.',
    advance: { population: 300, techs: ['medicine', 'computing'] }
  }
];
