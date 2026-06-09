/* build 2026-06-08f */
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
  { id:'mechanization', name:'Mechanization', icon:'🚜', era:'industrial', cost:120, prereq:['steam_power'],
    desc:'Machines do the heavy labour. Unlocks the Mechanized Farm. +25% food.', unlocks:['mechanized_farm'], bonus:{type:'food_mult', value:0.25} },

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
    desc:'Machines that build machines. +20% to all output.', bonus:{type:'all_mult', value:0.20} },
  { id:'internet', name:'The Network', icon:'🌐', era:'modern', cost:330, prereq:['computing'],
    desc:'Everything, connected. Unlocks Data Centers. +30% knowledge. A key to the Information Age.',
    unlocks:['data_center'], bonus:{type:'knowledge_mult', value:0.30} },
  { id:'fusion', name:'Fusion Power', icon:'⚛️', era:'modern', cost:350, prereq:['renewables'],
    desc:'A star in a bottle. Unlocks Fusion Plants. +5 mood. A key to the Information Age.',
    unlocks:['fusion_plant'], bonus:{type:'happiness_flat', value:5} },
  { id:'agriscience', name:'Agricultural Science', icon:'🌱', era:'modern', cost:210, prereq:['mechanization'],
    desc:'High-yield crops and greenhouses. Unlocks the Greenhouse Complex. +25% food.', unlocks:['greenhouse'], bonus:{type:'food_mult', value:0.25} },
  { id:'materials_science', name:'Materials Science', icon:'🛠️', era:'modern', cost:230, prereq:['electricity'],
    desc:'Engineered alloys and composites. Unlocks Composite Works. +25% materials.', unlocks:['composite_works'], bonus:{type:'materials_mult', value:0.25} },

  /* ----- Information Age ----- */
  { id:'artificial_intelligence', name:'Artificial Intelligence', icon:'🧠', era:'information', cost:430, prereq:['internet'],
    desc:'Minds of silicon. Unlocks AI Labs. +15% to all output.', unlocks:['ai_lab'], bonus:{type:'all_mult', value:0.15} },
  { id:'maglev_tech', name:'Maglev Transit', icon:'🚄', era:'information', cost:390, prereq:['mass_transit'],
    desc:'The city moves at a hum. Unlocks Maglev Lines.', unlocks:['maglev'] },
  { id:'arcology_design', name:'Arcology Design', icon:'🏢', era:'information', cost:410, prereq:['skyscrapers'],
    desc:'Cities that stand on end. Unlocks Smart Towers.', unlocks:['smart_tower'] },
  { id:'recycling', name:'Closed-Loop Recycling', icon:'♻️', era:'information', cost:370, prereq:['fusion'],
    desc:'Nothing is wasted. Unlocks Recycling Centers. +5 mood.', unlocks:['recycling_center'], bonus:{type:'happiness_flat', value:5} },
  { id:'space_flight', name:'Space Flight', icon:'🚀', era:'information', cost:540, prereq:['internet','fusion'],
    desc:'Beyond the sky. Unlocks Spaceports. A key to the Space Age.', unlocks:['spaceport'] },
  { id:'vertical_farming', name:'Vertical Farming', icon:'🌿', era:'information', cost:400, prereq:['agriscience'],
    desc:'Farms that climb skyward. Unlocks the Vertical Farm. +30% food.', unlocks:['vertical_farm'], bonus:{type:'food_mult', value:0.30} },
  { id:'nanotech', name:'Nanotechnology', icon:'🔩', era:'information', cost:580, prereq:['artificial_intelligence'],
    desc:'Engineering atom by atom. Unlocks the Nanofabricator. +20% to all output. A key to the Space Age.',
    unlocks:['nanofabricator'], bonus:{type:'all_mult', value:0.20} },

  /* ----- Space Age ----- */
  { id:'terraforming', name:'Terraforming', icon:'🌍', era:'space', cost:640, prereq:['space_flight'],
    desc:'Make new worlds bloom. Unlocks Orbital Farms and Bio-Domes.', unlocks:['orbital_farm','bio_dome'] },
  { id:'mega_arcology', name:'Mega-Arcology', icon:'🌆', era:'space', cost:680, prereq:['arcology_design'],
    desc:'A city in a single tower. Unlocks Arcologies.', unlocks:['arcology'] },
  { id:'antimatter', name:'Antimatter Power', icon:'🔆', era:'space', cost:720, prereq:['nanotech'],
    desc:'The ultimate energy. Unlocks Antimatter Plants. +30% coin.', unlocks:['antimatter_plant'], bonus:{type:'coin_mult', value:0.30} },
  { id:'quantum_computing', name:'Quantum Computing', icon:'🔬', era:'space', cost:740, prereq:['nanotech'],
    desc:'Compute the impossible. Unlocks Quantum Labs. +40% knowledge.', unlocks:['quantum_lab'], bonus:{type:'knowledge_mult', value:0.40} },
  { id:'singularity', name:'The Singularity', icon:'✨', era:'space', cost:950, prereq:['quantum_computing','antimatter'],
    desc:'Progress beyond measure. +30% to all output. The pinnacle of your realm.', bonus:{type:'all_mult', value:0.30} }
];
