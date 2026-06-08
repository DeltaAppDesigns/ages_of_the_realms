/* Tech tree.
   cost            : knowledge to research
   prereq          : tech ids that must be researched first
   era             : earliest era this tech appears (gates the Research list)
   unlocks         : building ids it makes buildable (shown for player clarity)
   bonus           : optional global modifier { type, value }
                     types: food_mult, materials_mult, coin_mult, knowledge_mult,
                            happiness_flat, growth_mult, all_mult
*/
window.GAME_TECH = [
  /* ----- Medieval ----- */
  { id:'agriculture', name:'Crop Rotation', icon:'🌱', era:'medieval', cost:20, prereq:[],
    desc:'Smarter farming. +25% food output.', bonus:{type:'food_mult', value:0.25} },
  { id:'carpentry', name:'Carpentry', icon:'🪚', era:'medieval', cost:20, prereq:[],
    desc:'Better tools and joinery. +25% materials.', bonus:{type:'materials_mult', value:0.25} },
  { id:'trade_routes', name:'Trade Routes', icon:'🧭', era:'medieval', cost:25, prereq:[],
    desc:'Roads to neighboring lands. +25% coin.', bonus:{type:'coin_mult', value:0.25} },
  { id:'writing', name:'Writing', icon:'✒️', era:'medieval', cost:18, prereq:[],
    desc:'Record-keeping spreads ideas. +25% knowledge.', bonus:{type:'knowledge_mult', value:0.25} },
  { id:'guilds', name:'Craft Guilds', icon:'⚒️', era:'medieval', cost:45, prereq:['carpentry','trade_routes'],
    desc:'Organized artisans. Unlocks the Workshop. A key to the Renaissance.', unlocks:['workshop'] },
  { id:'printing_press', name:'Printing Press', icon:'🖨️', era:'medieval', cost:50, prereq:['writing'],
    desc:'Knowledge for the masses. Unlocks the University. A key to the Renaissance.', unlocks:['university'] },

  /* ----- Renaissance ----- */
  { id:'banking', name:'Banking', icon:'💰', era:'renaissance', cost:55, prereq:['trade_routes'],
    desc:'Credit and ledgers. Unlocks the Bank.', unlocks:['bank'] },
  { id:'masonry', name:'Masonry', icon:'🧱', era:'renaissance', cost:45, prereq:[],
    desc:'Stone construction. Unlocks Townhouses and the Theater.', unlocks:['townhouse','theater'] },
  { id:'engineering', name:'Engineering', icon:'📐', era:'renaissance', cost:65, prereq:['guilds'],
    desc:'Mills and machines. Unlocks the Windmill. +10% to all output.', unlocks:['windmill'], bonus:{type:'all_mult', value:0.10} },
  { id:'steam_power', name:'Steam Power', icon:'♨️', era:'renaissance', cost:95, prereq:['engineering'],
    desc:'The engine of industry. Unlocks Factory, Steel Mill, Rail Depot. A key to the Industrial Age.',
    unlocks:['factory','steel_mill','rail_depot'] },
  { id:'urban_planning', name:'Urban Planning', icon:'🗺️', era:'renaissance', cost:85, prereq:['masonry'],
    desc:'Designing the growing city. Unlocks Tenements and Textile Mills. A key to the Industrial Age.',
    unlocks:['tenement','textile_mill'] },

  /* ----- Industrial ----- */
  { id:'public_education', name:'Public Education', icon:'📚', era:'industrial', cost:115, prereq:['printing_press'],
    desc:'Schooling for all. Unlocks Public Schools. +30% knowledge.', unlocks:['public_school'], bonus:{type:'knowledge_mult', value:0.30} },
  { id:'sanitation', name:'Sanitation', icon:'🚰', era:'industrial', cost:100, prereq:['urban_planning'],
    desc:'Clean water and sewers. +5 mood, faster growth.', bonus:{type:'happiness_flat', value:5} },
  { id:'electricity', name:'Electricity', icon:'💡', era:'industrial', cost:145, prereq:['steam_power'],
    desc:'Power to the people. +15% to all output.', bonus:{type:'all_mult', value:0.15} },
  { id:'medicine', name:'Modern Medicine', icon:'💉', era:'industrial', cost:165, prereq:['sanitation','public_education'],
    desc:'Vaccines and surgery. Unlocks Hospitals. A key to the Modern Era.', unlocks:['hospital'] },
  { id:'computing', name:'Computing', icon:'🖥️', era:'industrial', cost:185, prereq:['electricity','public_education'],
    desc:'The information age dawns. Unlocks Tech Parks. A key to the Modern Era.', unlocks:['tech_park'] },

  /* ----- Modern ----- */
  { id:'renewables', name:'Renewable Energy', icon:'🔋', era:'modern', cost:200, prereq:['electricity'],
    desc:'Sun and wind. Unlocks Solar Arrays. +4 mood.', unlocks:['solar_array'], bonus:{type:'happiness_flat', value:4} },
  { id:'civic_planning', name:'Civic Planning', icon:'🏛️', era:'modern', cost:180, prereq:['medicine'],
    desc:'Livable cities. Unlocks City Parks.', unlocks:['park'] },
  { id:'mass_transit', name:'Mass Transit', icon:'🚆', era:'modern', cost:210, prereq:['computing'],
    desc:'Subways and rail. Unlocks Transit Hubs.', unlocks:['transit_hub'] },
  { id:'skyscrapers', name:'Skyscrapers', icon:'🏙️', era:'modern', cost:230, prereq:['mass_transit'],
    desc:'Build to the sky. Unlocks Apartment Towers.', unlocks:['apartment'] },
  { id:'automation', name:'Automation', icon:'🤖', era:'modern', cost:280, prereq:['computing','renewables'],
    desc:'Machines that build machines. +40% materials and coin.', bonus:{type:'all_mult', value:0.20} }
];
