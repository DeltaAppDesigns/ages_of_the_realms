/* Buildings.
   cost      : one-time build cost (scaled by costScale^(owned))
   upkeep    : resources consumed every year (fixed, not job-scaled)
   produces  : resources generated every year (scaled by employment ratio)
   jobs      : worker slots this building needs to run at full output
   housing   : people this building can shelter
   happiness : flat mood modifier while it stands
   tech      : tech id required to unlock (null = available from its era)
   era       : earliest era it appears in the Build list
   growth    : optional flat bonus to population growth rate (health buildings)
*/
window.GAME_BUILDINGS = [
  /* ---------- MEDIEVAL ---------- */
  { id:'farm', name:'Farm', icon:'🌾', era:'medieval', tech:null, desc:'Grain fields. The backbone of any village.',
    cost:{materials:15}, costScale:1.14, jobs:2, produces:{food:6} },
  { id:'lumber_camp', name:'Lumber Camp', icon:'🪵', era:'medieval', tech:null, desc:'Fells timber for construction.',
    cost:{coin:10}, costScale:1.14, jobs:2, produces:{materials:6} },
  { id:'hut', name:'Cottage', icon:'🛖', era:'medieval', tech:null, desc:'Simple homes for your people.',
    cost:{materials:12}, costScale:1.12, housing:5, happiness:1 },
  { id:'market', name:'Market', icon:'🪙', era:'medieval', tech:null, desc:'Traders pay taxes into your treasury.',
    cost:{materials:20}, costScale:1.16, jobs:2, produces:{coin:5} },
  { id:'granary', name:'Granary', icon:'🌽', era:'medieval', tech:null, desc:'Stores and preserves surplus grain.',
    cost:{materials:18}, costScale:1.15, jobs:1, produces:{food:4}, happiness:1 },
  { id:'scholars_hall', name:"Scholars' Hall", icon:'📜', era:'medieval', tech:null, desc:'Monks copy texts and study the stars.',
    cost:{coin:18, materials:14}, costScale:1.2, jobs:1, produces:{knowledge:3} },
  { id:'chapel', name:'Chapel', icon:'⛪', era:'medieval', tech:null, desc:'A place of faith. Lifts the spirits of all.',
    cost:{materials:25}, costScale:1.25, upkeep:{coin:1}, happiness:6 },
  { id:'watchtower', name:'Watchtower', icon:'🗼', era:'medieval', tech:null, desc:'Guards the realm. Softens the blow of raids.',
    cost:{materials:22, coin:8}, costScale:1.3, upkeep:{coin:1}, happiness:2, tags:['defense'] },

  /* ---------- RENAISSANCE ---------- */
  { id:'workshop', name:'Workshop', icon:'🔨', era:'renaissance', tech:'guilds', desc:'Skilled artisans craft fine goods.',
    cost:{materials:30, coin:15}, costScale:1.16, jobs:3, produces:{materials:7, coin:4} },
  { id:'bank', name:'Bank', icon:'🏦', era:'renaissance', tech:'banking', desc:'Lends coin and grows the economy.',
    cost:{materials:28, coin:25}, costScale:1.18, jobs:2, produces:{coin:10} },
  { id:'university', name:'University', icon:'🎓', era:'renaissance', tech:'printing_press', desc:'A fountain of new ideas.',
    cost:{materials:35, coin:30}, costScale:1.2, jobs:2, produces:{knowledge:7} },
  { id:'townhouse', name:'Townhouse', icon:'🏠', era:'renaissance', tech:'masonry', desc:'Sturdy stone homes for growing families.',
    cost:{materials:30}, costScale:1.13, housing:12, happiness:1 },
  { id:'theater', name:'Theater', icon:'🎭', era:'renaissance', tech:'masonry', desc:'Plays and music delight the citizens.',
    cost:{materials:34, coin:18}, costScale:1.25, upkeep:{coin:2}, jobs:1, happiness:8 },
  { id:'windmill', name:'Windmill', icon:'🌬️', era:'renaissance', tech:'engineering', desc:'Harnesses the wind to grind grain.',
    cost:{materials:32}, costScale:1.16, jobs:1, produces:{food:10} },

  /* ---------- INDUSTRIAL ---------- */
  { id:'factory', name:'Factory', icon:'🏭', era:'industrial', tech:'steam_power', desc:'Mass production at a price: smoke and noise.',
    cost:{materials:55, coin:40}, costScale:1.16, jobs:5, produces:{materials:14, coin:8}, happiness:-3 },
  { id:'steel_mill', name:'Steel Mill', icon:'🏗️', era:'industrial', tech:'steam_power', desc:'Forges steel for the modern age.',
    cost:{materials:60, coin:35}, costScale:1.17, jobs:4, produces:{materials:18}, happiness:-2 },
  { id:'rail_depot', name:'Rail Depot', icon:'🚂', era:'industrial', tech:'steam_power', desc:'Railways open distant markets.',
    cost:{materials:50, coin:45}, costScale:1.18, jobs:3, produces:{coin:16} },
  { id:'tenement', name:'Tenement', icon:'🏢', era:'industrial', tech:'urban_planning', desc:'Cramped but cheap housing for workers.',
    cost:{materials:45}, costScale:1.12, housing:28, happiness:-2 },
  { id:'textile_mill', name:'Textile Mill', icon:'🧵', era:'industrial', tech:'urban_planning', desc:'Looms churn out cloth for export.',
    cost:{materials:48, coin:30}, costScale:1.16, jobs:4, produces:{coin:12}, happiness:-1 },
  { id:'public_school', name:'Public School', icon:'🏫', era:'industrial', tech:'public_education', desc:'Educates the masses and lifts morale.',
    cost:{materials:42, coin:35}, costScale:1.2, jobs:2, produces:{knowledge:12}, happiness:2 },

  /* ---------- MODERN ---------- */
  { id:'hospital', name:'Hospital', icon:'🏥', era:'modern', tech:'medicine', desc:'Modern care. People live longer and happier.',
    cost:{materials:70, coin:60}, costScale:1.2, upkeep:{food:3}, jobs:3, happiness:10, growth:0.05 },
  { id:'tech_park', name:'Tech Park', icon:'💻', era:'modern', tech:'computing', desc:'Innovation campuses generate ideas and wealth.',
    cost:{materials:80, coin:70}, costScale:1.18, jobs:4, produces:{knowledge:18, coin:14} },
  { id:'solar_array', name:'Solar Array', icon:'☀️', era:'modern', tech:'renewables', desc:'Clean energy sold to the grid. Beloved by all.',
    cost:{materials:65, coin:55}, costScale:1.16, jobs:1, produces:{coin:12}, happiness:3 },
  { id:'transit_hub', name:'Transit Hub', icon:'🚇', era:'modern', tech:'mass_transit', desc:'Moves the city and eases the crowds.',
    cost:{materials:75, coin:65}, costScale:1.18, jobs:3, produces:{coin:10}, happiness:5 },
  { id:'apartment', name:'Apartment Tower', icon:'🏬', era:'modern', tech:'skyscrapers', desc:'Houses thousands on a small footprint.',
    cost:{materials:90, coin:40}, costScale:1.12, housing:60 },
  { id:'park', name:'City Park', icon:'🌳', era:'modern', tech:'civic_planning', desc:'Green space to breathe. A civic treasure.',
    cost:{materials:40, coin:30}, costScale:1.22, happiness:7 }
];
